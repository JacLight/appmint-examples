import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import Stripe from "stripe";
const D = path.resolve(
  process.env.COURSE_PRIVATE_DIR || ".local/webhook-course"
);
fs.mkdirSync(D, { recursive: true, mode: 0o700 });
const P = new URL("./", import.meta.url),
  B = process.env.APPENGINE_API_ORIGIN;
const S = {
  org: process.env.APPENGINE_ORG,
  token: process.env.APPENGINE_STAFF_TOKEN,
};
assert(B && S.org && S.token, "Set API origin, organization and staff token");
const state = {
  phase: "Prepared",
  steps: [],
  receipts: [],
  courseTag: "ae-webhook-" + crypto.randomBytes(12).toString("hex"),
};
let original,
  course,
  endpoint,
  stripe,
  tunnel,
  callbackUrl,
  signingSecret,
  changed = false,
  busy = false;
const safe = () => ({
  phase: state.phase,
  steps: state.steps,
  receipts: state.receipts,
  callbackUrl,
  endpoint: endpoint
    ? {
        id: endpoint.id,
        status: endpoint.status,
        livemode: endpoint.livemode,
        enabledEvents: endpoint.enabled_events,
      }
    : null,
  connection: course
    ? {
        name: course.data.name,
        status: course.data.status,
        signingSecretConfigured: !!course.data.webhookSecret,
      }
    : null,
  order: state.order,
  payment: state.payment,
  before: state.before,
  result: state.result,
  restored: state.restored,
  deleted: state.deleted,
});
const persist = () =>
  fs.writeFileSync(
    D + "/autonomous-state.json",
    JSON.stringify({
      state,
      original,
      course,
      endpoint,
      callbackUrl,
      signingSecret,
    }),
    { mode: 0o600 }
  );
const note = (text, detail) => {
  state.steps.push({ at: new Date().toISOString(), text, detail });
  persist();
};
async function api(method, path, body) {
  const r = await fetch(B + path, {
    method,
    signal: AbortSignal.timeout(45000),
    headers: {
      "content-type": "application/json",
      orgid: S.org,
      authorization: "Bearer " + S.token,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let j;
  const t = await r.text();
  try {
    j = JSON.parse(t);
  } catch {
    j = { message: t };
  }
  if (!r.ok) {
    fs.writeFileSync(
      D + "/autonomous-error.json",
      JSON.stringify({ status: r.status, path, result: j }),
      { mode: 0o600 }
    );
    throw Error("AppEngine HTTP" + r.status + "; private response retained");
  }
  return j;
}
const save = async (c) => {
  const fresh = c.sk ? await api("GET", "/repository/get/config/" + c.sk) : c;
  return api("POST", "/upstream/save-integration", { ...fresh, data: c.data });
};
const configs = () =>
  api("POST", "/repository/find/config", {
    query: {},
    options: { pageSize: 100 },
  }).then((x) => x.data);
async function restore() {
  if (course) {
    course = await save({
      ...course,
      data: { ...course.data, status: "inactive" },
    });
  }
  if (changed) {
    await save(original);
    changed = false;
  }
  const all = await configs();
  assert.deepEqual(all.find((x) => x.sk === original.sk).data, original.data);
  assert.equal(
    all.filter(
      (x) => x.data.provider === "StripeProvider" && x.data.status === "active"
    ).length,
    1
  );
  state.restored = true;
  persist();
}
async function readback() {
  const o = await api("GET", "/repository/get/sf_order/" + state.order.id);
  const t = await api("POST", "/repository/find/sf_transaction", {
    query: { "data.ref": state.payment.id },
    options: { pageSize: 10 },
  });
  const result = {
    orderNumber: o.data.number,
    status: o.data.status,
    total: o.data.total,
    paidAt: o.data.paidAt,
    transactionIds: t.data.map((x) => x.sk),
    amounts: t.data.map((x) => x.data.amount),
  };
  state.result = result;
  persist();
  return result;
}
async function initialize() {
  const all = await configs();
  const active = all.filter(
    (x) => x.data.provider === "StripeProvider" && x.data.status === "active"
  );
  assert.equal(active.length, 1);
  original = active[0];
  assert(original.data.secretKey.startsWith("sk_test_"));
  assert(!original.data.webhookSecret);
  assert(!original.provider);
  assert(
    all.some(
      (x) =>
        x.data.provider === "SMTPProvider" &&
        x.data.host === "127.0.0.1" &&
        x.data.status === "active"
    )
  );
  stripe = new Stripe(original.data.secretKey);
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  state.existingEndpoints = existing.data;
  persist();
  note("Existing endpoints recorded; they will remain unchanged");
}
async function register() {
  assert(!endpoint);
  assert(callbackUrl?.startsWith("https://"));
  endpoint = await stripe.webhookEndpoints.create(
    {
      url: callbackUrl,
      enabled_events: ["payment_intent.succeeded"],
      description: "Temporary AppEngine course TEST receiver",
      metadata: { course: state.courseTag },
    },
    { idempotencyKey: state.courseTag + "-endpoint" }
  );
  assert.equal(endpoint.livemode, false);
  signingSecret = endpoint.secret;
  assert(signingSecret);
  persist();
  endpoint = await stripe.webhookEndpoints.update(endpoint.id, {
    disabled: true,
  });
  persist();
  const data = {
    ...original.data,
    name: "Course autonomous TEST webhook",
    status: "inactive",
    webhookSecret: signingSecret,
    webhookId: endpoint.id,
    webhookUrl: callbackUrl,
  };
  course = await save({ datatype: "config", isNew: true, data });
  state.phase = "Registered • disabled";
  note("Dedicated TEST endpoint created", endpoint.id);
  note("Signing secret saved in dedicated inactive AppEngine connection");
}
async function prepare() {
  assert(endpoint && !state.order);
  const buyer = { email: process.env.COURSE_CUSTOMER_EMAIL };
  assert(buyer.email, "Set a controlled training customer email");
  const customer = (
    await api("POST", "/repository/find/customer", {
      query: { "data.email": buyer.email },
      options: { pageSize: 2 },
    })
  ).data;
  assert.equal(customer.length, 1);
  const data = {
    customerId: customer[0].sk,
    email: buyer.email,
    name: "Maya Chen",
    productItems: [
      {
        sku: process.env.COURSE_PRODUCT_SKU || "AE-WEBHOOK-GUIDE-1017",
        quantity: 1,
      },
    ],
    currency: "USD",
    staffShippingFee: 0,
  };
  const quote = await api("POST", "/storefront/admin/order/quote", data);
  assert.equal(Number(quote.total), 12);
  const o = await api("POST", "/storefront/admin/order", data);
  const order = o.order || o;
  state.order = {
    id: order.sk,
    number: order.data.number,
    status: order.data.status,
    total: order.data.total,
  };
  assert.equal(state.order.status, "new");
  persist();
  const intent = await api(
    "POST",
    "/upstream/call/StripeProvider/paymentIntent",
    {
      configId: original.sk,
      data: {
        amount: 12,
        currency: "usd",
        paymentMethodTypes: ["card"],
        idempotencyKey: state.courseTag + "-intent",
        metadata: { orderNumber: state.order.number, course: state.courseTag },
      },
    }
  );
  assert.equal(intent.livemode, false);
  state.payment = {
    id: intent.id,
    status: intent.status,
    livemode: intent.livemode,
  };
  persist();
  state.before = await readback();
  assert.equal(state.before.status, "new");
  assert.equal(state.before.transactionIds.length, 0);
  state.phase = "Order ready • no payment applied";
  note("Created a fresh unpaid $12 order", state.order.number);
}
async function activate() {
  assert(course && state.payment && !changed);
  changed = true;
  persist();
  try {
    await save({ ...original, data: { ...original.data, status: "inactive" } });
    course = await save({
      ...course,
      data: { ...course.data, status: "active" },
    });
    const active = (await configs()).filter(
      (x) => x.data.provider === "StripeProvider" && x.data.status === "active"
    );
    assert.equal(active.length, 1);
    assert.equal(active[0].sk, course.sk);
    endpoint = await stripe.webhookEndpoints.update(endpoint.id, {
      disabled: false,
    });
    assert.equal(endpoint.livemode, false);
    state.phase = "Receiver enabled • waiting for Stripe";
    note(
      "Enabled only the course endpoint and selected its AppEngine connection"
    );
  } catch (e) {
    await restore();
    throw e;
  }
}
async function confirm() {
  assert(changed && endpoint.status === "enabled" && !state.confirmAttempted);
  const before = await stripe.paymentIntents.retrieve(state.payment.id);
  assert.equal(before.livemode, false);
  assert.equal(before.amount, 1200);
  state.confirmAttempted = true;
  persist();
  const result = await stripe.paymentIntents.confirm(
    state.payment.id,
    { payment_method: "pm_card_visa" },
    { idempotencyKey: state.courseTag + "-confirm" }
  );
  assert.equal(result.livemode, false);
  assert.equal(result.status, "succeeded");
  state.payment.status = result.status;
  state.phase = "Stripe payment succeeded";
  note("Stripe confirmed the TEST payment; waiting for its automatic callback");
}
async function retire() {
  if (endpoint) {
    endpoint = await stripe.webhookEndpoints.update(endpoint.id, {
      disabled: true,
    });
    await restore();
    const deleted = await stripe.webhookEndpoints.del(endpoint.id);
    assert(deleted.deleted);
    state.deleted = true;
    note("Deleted only the temporary course endpoint");
  }
  const remaining = (await stripe.webhookEndpoints.list({ limit: 100 })).data;
  for (const old of state.existingEndpoints)
    assert.deepEqual(
      remaining.find((x) => x.id === old.id),
      old
    );
  state.phase = "Retired • original configuration restored";
  note("Original endpoint records and AppEngine connection verified unchanged");
  const result = {
    ...safe(),
    providerMode: "TEST",
    actualAutonomousDelivery: state.receipts.some(
      (x) => x.forwarded && x.status === 200
    ),
    fixedOrganization: true,
    restrictedPath: true,
    existingEndpointsUnchanged: true,
  };
  fs.writeFileSync(
    D + "/autonomous-delivery-proof.json",
    JSON.stringify(result, null, 2)
  );
}
const receiver = http.createServer(async (req, res) => {
  const finish = (status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (req.method !== "POST" || req.url !== state.callbackPath)
    return finish(404, { error: "not found" });
  if (!signingSecret) return finish(503, { error: "not configured" });
  let parts = [],
    size = 0;
  for await (const part of req) {
    size += part.length;
    if (size > 1024 * 1024) return finish(413, { error: "body too large" });
    parts.push(part);
  }
  const raw = Buffer.concat(parts);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      req.headers["stripe-signature"],
      signingSecret
    );
  } catch {
    return finish(400, { error: "invalid signature" });
  }
  if (
    event.livemode ||
    event.type !== "payment_intent.succeeded" ||
    event.data.object.id !== state.payment?.id ||
    event.data.object.metadata.course !== state.courseTag
  )
    return finish(200, { ignored: true });
  try {
    const arrival = new Date().toISOString();
    const r = await fetch(B + "/connect/webhook/stripe", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": req.headers["stripe-signature"],
        orgid: S.org,
      },
      body: raw,
      signal: AbortSignal.timeout(45000),
    });
    const body = await r.json();
    state.receipts.push({
      arrival,
      eventId: event.id,
      type: event.type,
      signatureVerified: true,
      forwarded: true,
      status: r.status,
      receiver: body,
      delivery: "Autonomous Stripe callback",
    });
    persist();
    if (r.ok) {
      const result = await readback();
      assert.equal(result.status, "paid");
      assert.equal(result.transactionIds.length, 1);
      assert.equal(result.amounts[0], 12);
      state.phase = "Automatic delivery applied • order paid";
      note("Verified signed Stripe callback reached AppEngine", event.id);
      endpoint = await stripe.webhookEndpoints.update(endpoint.id, {
        disabled: true,
      });
      await restore();
      note("Receiver paused; original connection already restored");
    }
    finish(r.status, body);
  } catch (e) {
    fs.writeFileSync(D + "/autonomous-receiver-error.txt", String(e), {
      mode: 0o600,
    });
    finish(500, { error: "temporary receiver failure" });
  }
});
if (fs.existsSync(D + "/autonomous-state.json")) {
  const previous = JSON.parse(fs.readFileSync(D + "/autonomous-state.json"));
  assert(
    !previous.endpoint || previous.state.deleted,
    "Recover the unfinished private endpoint/config state before starting another run"
  );
}
await initialize();
state.callbackPath = "/course/" + crypto.randomBytes(24).toString("hex");
receiver.listen(4124, "127.0.0.1");
const log = fs.openSync(D + "/cloudflared.log", "a", 0o600);
tunnel = spawn(
  process.env.CLOUDFLARED_BIN || "cloudflared",
  [
    "tunnel",
    "--url",
    "http://127.0.0.1:4124",
    "--no-autoupdate",
    "--protocol",
    "http2",
  ],
  { stdio: ["ignore", "ignore", "pipe"] }
);
tunnel.stderr.on("data", (b) => {
  fs.writeSync(log, b);
  const match = String(b).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (match && !callbackUrl) {
    callbackUrl = match[0] + state.callbackPath;
    state.phase = "Isolated HTTPS receiver available";
    persist();
  }
});
const server = http.createServer(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET" && req.url === "/") {
    res.setHeader("Content-Type", "text/html");
    return res.end(fs.readFileSync(new URL("autonomous-ui.html", P)));
  }
  if (req.method === "GET" && req.url === "/style.css") {
    res.setHeader("Content-Type", "text/css");
    return res.end(fs.readFileSync(new URL("../browser/style.css", P)));
  }
  if (req.method === "GET" && req.url === "/state") {
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify(safe()));
  }
  if (
    req.method === "POST" &&
    req.headers.origin === "http://127.0.0.1:4123" &&
    !busy
  ) {
    busy = true;
    try {
      const actions = { register, prepare, activate, confirm, retire };
      const fn = actions[req.url.slice(1)];
      assert(fn);
      await fn();
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(safe()));
    } catch (e) {
      if (changed) await restore();
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String(e) }));
    } finally {
      busy = false;
    }
    return;
  }
  res.statusCode = 404;
  res.end("Not found");
});
server.listen(4123, "127.0.0.1", () =>
  console.log("Isolated course control ready; no external proxy routes")
);
let quitting = false;
async function shutdown() {
  if (quitting) return;
  quitting = true;
  try {
    if (endpoint && !state.deleted) await retire();
  } catch (e) {
    fs.writeFileSync(D + "/autonomous-cleanup-error.txt", String(e), {
      mode: 0o600,
    });
    console.error("Cleanup requires private recovery");
  } finally {
    tunnel?.kill();
    receiver.close();
    server.close();
    process.exit();
  }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
