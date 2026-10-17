import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)),
  PORT = Number(process.env.PORT || 4102),
  API = (process.env.APPENGINE_API_ORIGIN || "").replace(/\/$/, ""),
  ORG = process.env.APPENGINE_ORG || "";
if (!API || !ORG) throw Error("Set APPENGINE_API_ORIGIN and APPENGINE_ORG.");
const sessions = new Map(),
  cleanConfig = (c) => ({
    id: c.sk,
    name: c.data.name,
    provider: c.data.provider,
    status: c.data.status,
    priority: c.data.priority,
    testKey: String(c.data.secretKey || "").startsWith("sk_test_"),
    signingConfigured: !!c.data.webhookSecret,
    registered: !!c.data.webhookId,
  });
const orderView = (o) => ({
  id: o.sk,
  number: o.data.number,
  status: o.data.status,
  total: o.data.amount ?? o.data.total,
  currency: o.data.currency || "USD",
  paidAt: o.data.paidAt,
  paymentRef: o.data.paymentRef,
  gateway: o.data.paymentGateway,
});
async function api(s, method, route, body, publicRoute = false) {
  const r = await fetch(API + route, {
    method,
    signal: AbortSignal.timeout(90000),
    headers: {
      orgid: ORG,
      "content-type": "application/json",
      ...(!publicRoute ? { authorization: "Bearer " + s.token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const t = await r.text();
  let data;
  try {
    data = JSON.parse(t);
  } catch {
    data = { message: t };
  }
  return { status: r.status, ok: r.ok, data };
}
function must(r) {
  if (!r.ok)
    throw Object.assign(
      Error(r.data?.message || r.data?.error || "AppEngine operation failed"),
      { status: r.status }
    );
  return r.data;
}
const reply = (res, status, data, headers = {}) => {
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
    ...headers,
  });
  res.end(JSON.stringify(data));
};
async function bodyOf(req) {
  let raw = "";
  for await (const c of req) {
    raw += c;
    if (raw.length > 65536) throw Error("Body too large");
  }
  return raw ? JSON.parse(raw) : {};
}
async function provider(s, operation, data = {}) {
  if (!s.configId) throw Error("Select a saved connection");
  return must(
    await api(s, "POST", "/upstream/call/StripeProvider/" + operation, {
      configId: s.configId,
      data,
    })
  );
}
async function selected(s) {
  const c = must(await api(s, "GET", "/repository/get/config/" + s.configId));
  if (
    c.data.provider !== "StripeProvider" ||
    c.data.status !== "active" ||
    !String(c.data.secretKey).startsWith("sk_test_")
  )
    throw Error(
      "This demonstration requires an active own-organization Stripe TEST connection"
    );
  return c;
}
async function readback(s) {
  if (!s.orderId) return {};
  const o = must(await api(s, "GET", "/repository/get/sf_order/" + s.orderId));
  const tx = s.intent
    ? must(
        await api(s, "POST", "/repository/find/sf_transaction", {
          query: { "data.ref": s.intent.id },
          options: { pageSize: 50 },
        })
      ).data
    : [];
  const logs = s.eventId
    ? must(
        await api(s, "POST", "/repository/find/log", {
          query: {
            "data.kind": "stripe-webhook-event",
            "data.eventId": s.eventId,
          },
          options: { pageSize: 10 },
        })
      ).data
    : [];
  return {
    order: orderView(o),
    transactions: tx.map((t) => ({
      id: t.sk,
      reference: t.data.ref,
      status: t.data.status,
      amount: t.data.amount,
      currency: t.data.currency,
    })),
    processedEvents: logs.map((l) => ({
      eventId: l.data.eventId,
      eventType: l.data.eventType,
      processedAt: l.data.processedAt,
    })),
  };
}
http
  .createServer(async (req, res) => {
    let s,
      ownsLock = false;
    try {
      const u = new URL(req.url, "http://127.0.0.1:" + PORT);
      if (req.method === "GET" && !u.pathname.startsWith("/api/")) {
        const f = u.pathname === "/" ? "index.html" : u.pathname.slice(1);
        if (!["index.html", "style.css", "app.js"].includes(f))
          return reply(res, 404, { error: "Not found" });
        res.writeHead(200, {
          "content-type": f.endsWith(".css")
            ? "text/css"
            : f.endsWith(".js")
            ? "text/javascript"
            : "text/html",
          "cache-control": "no-store",
        });
        return res.end(fs.readFileSync(path.join(HERE, f)));
      }
      if (
        req.headers.origin &&
        !["http://127.0.0.1:" + PORT, "http://localhost:" + PORT].includes(
          req.headers.origin
        )
      )
        return reply(res, 403, { error: "Unexpected browser origin" });
      const body = await bodyOf(req);
      const cookie = (req.headers.cookie || "").match(
        /(?:^|; )integration_course=([^;]+)/
      )?.[1];
      s = cookie && sessions.get(cookie);
      if (u.pathname === "/api/connect" && req.method === "POST") {
        const j = must(
          await api(
            {},
            "POST",
            "/profile/user/signin",
            { email: body.email, password: body.password },
            true
          )
        );
        if (!j.token)
          return reply(res, 409, {
            error: "Complete the sign-in challenge in API Foundations first",
          });
        const id = crypto.randomBytes(32).toString("hex");
        sessions.set(id, {
          token: j.token,
          busy: false,
          attempt: crypto.randomUUID(),
        });
        return reply(
          res,
          200,
          { connected: true, organization: ORG },
          {
            "set-cookie": `integration_course=${id}; HttpOnly; SameSite=Strict; Path=/`,
          }
        );
      }
      if (!s)
        return reply(res, 401, { error: "Connect your development account" });
      if (req.method === "POST" && s.busy)
        return reply(res, 409, { error: "Wait for the current operation" });
      s.busy = req.method === "POST";
      ownsLock = s.busy;
      if (u.pathname === "/api/state")
        return reply(res, 200, {
          connected: true,
          organization: ORG,
          selected: s.configId,
          ...(await readback(s)),
        });
      if (u.pathname === "/api/connections") {
        const configs = must(
          await api(s, "POST", "/repository/find/config", {
            query: { "data.provider": "StripeProvider" },
            options: { pageSize: 100 },
          })
        );
        return reply(res, 200, {
          connections: configs.data.map(cleanConfig),
          organization: ORG,
        });
      }
      if (u.pathname === "/api/select") {
        s.configId = body.id;
        return reply(res, 200, { connection: cleanConfig(await selected(s)) });
      }
      if (u.pathname === "/api/discover") {
        const allowed = [
          "StripeProvider",
          "PayPalProvider",
          "EasyPostProvider",
          "TwilioProvider",
          "FacebookProvider",
        ];
        if (!allowed.includes(body.provider))
          throw Error("Select a supported example provider");
        const j = must(
          await api(s, "GET", "/upstream/integration-types/" + body.provider)
        );
        return reply(res, 200, {
          name: j.name,
          type: j.type,
          useCases: j.useCases,
          operations: j.operation,
          fields: Object.entries(j.configSchema?.properties || {}).map(
            ([name, v]) => ({
              name,
              type: v.type,
              readOnly: !!v.readOnly,
              title: v.title,
            })
          ),
        });
      }
      if (u.pathname === "/api/test") {
        await selected(s);
        const result = await provider(s, "test");
        if (result.livemode !== false) throw Error("Stop: not a test account");
        return reply(res, 200, result);
      }
      if (u.pathname === "/api/webhooks") {
        await selected(s);
        const j = await provider(s, "listWebhooks");
        return reply(res, 200, {
          success: j.success,
          webhooks: (j.webhooks || []).map((w) => ({
            id: w.id,
            status: w.status,
            enabledEvents: w.enabledEvents,
            created: w.created,
          })),
          note: "Existing endpoints are inspected only; this companion has not registered or changed them.",
        });
      }
      if (u.pathname === "/api/order") {
        await selected(s);
        if (s.orderId) return reply(res, 200, await readback(s));
        if (s.orderAttempted)
          throw Error(
            "Prior order outcome is uncertain. Inspect saved orders before retrying."
          );
        const customers = must(
          await api(s, "POST", "/repository/find/customer", {
            query: { "data.email": body.email },
            options: { pageSize: 2 },
          })
        ).data;
        if (customers.length !== 1)
          throw Error("Use an existing controlled training customer");
        const sku = "AE-WEBHOOK-GUIDE-1017";
        const products = must(
          await api(s, "POST", "/repository/find/sf_product", {
            query: { "data.sku": sku },
            options: { pageSize: 2 },
          })
        ).data;
        if (!products.length)
          throw Error(
            "Create the workshop guide fixture following README first"
          );
        const payload = {
          customerId: customers[0].sk,
          email: body.email,
          name: [customers[0].data.firstName, customers[0].data.lastName]
            .filter(Boolean)
            .join(" "),
          productItems: [{ sku, quantity: 1 }],
          currency: "USD",
          staffShippingFee: 0,
        };
        const quote = must(
          await api(s, "POST", "/storefront/admin/order/quote", payload)
        );
        if (!(Number(quote.total) > 0 && Number(quote.total) <= 50))
          throw Error("Course order exceeds the test limit");
        s.orderAttempted = true;
        const result = must(
          await api(s, "POST", "/storefront/admin/order", payload)
        );
        const o = result.order || result;
        s.orderId = o.sk;
        s.orderNumber = o.data.number;
        s.total = o.data.amount ?? o.data.total;
        return reply(res, 200, await readback(s));
      }
      if (u.pathname === "/api/payment") {
        const c = await selected(s);
        if (process.env.ALLOW_SANDBOX_CONFIRM !== "1")
          throw Error(
            "Enable the documented sandbox confirmation option, or use your payment client"
          );
        if (!s.orderId) throw Error("Create the unpaid test order first");
        if (!s.intent) {
          s.intent = await provider(s, "paymentIntent", {
            amount: s.total,
            currency: "usd",
            paymentMethodTypes: ["card"],
            idempotencyKey: "integration-course-" + s.attempt,
            description: "AppEngine course TEST order",
            metadata: {
              orderNumber: s.orderNumber,
              course: "integration-course",
            },
          });
          if (s.intent.livemode !== false)
            throw Error("Only test intents are allowed");
          s.since = Math.floor(Date.now() / 1000) - 10;
        }
        if (!s.confirmed) {
          const r = await fetch(
            "https://api.stripe.com/v1/payment_intents/" +
              encodeURIComponent(s.intent.id) +
              "/confirm",
            {
              method: "POST",
              headers: {
                authorization: "Bearer " + c.data.secretKey,
                "content-type": "application/x-www-form-urlencoded",
                "idempotency-key": "integration-confirm-" + s.attempt,
              },
              body: new URLSearchParams({ payment_method: "pm_card_visa" }),
            }
          );
          const j = await r.json();
          if (!r.ok || j.livemode !== false || j.status !== "succeeded")
            throw Error("Sandbox payment confirmation did not succeed");
          s.confirmed = true;
        }
        return reply(res, 200, {
          payment: {
            id: s.intent.id,
            status: "succeeded",
            test: true,
            amount: s.total,
          },
          ...(await readback(s)),
          note: "Stripe test payment method; no real card charged. No webhook is simulated.",
        });
      }
      if (u.pathname === "/api/events") {
        await selected(s);
        const j = await provider(s, "listEvents", {
          types: ["payment_intent.succeeded"],
          createdGte: s.since || Math.floor(Date.now() / 1000) - 3600,
          limit: 5,
          ...(body.cursor ? { startingAfter: body.cursor } : {}),
        });
        const rows = j.data.map((e) => ({
          id: e.id,
          type: e.type,
          created: e.created,
          paymentId: e.data?.object?.id,
          amount: Number(e.data?.object?.amount_received || 0) / 100,
          livemode: e.livemode,
          matchesOrder: e.data?.object?.metadata?.orderNumber === s.orderNumber,
        }));
        const ours = rows.find(
          (e) => e.matchesOrder && e.paymentId === s.intent?.id
        );
        if (ours) s.eventId = ours.id;
        return reply(res, 200, {
          events: rows,
          hasMore: j.hasMore,
          nextCursor: rows.at(-1)?.id,
          selectedEvent: s.eventId,
        });
      }
      if (u.pathname === "/api/replay") {
        const c = await selected(s);
        if (c.data.webhookSecret)
          throw Error(
            "Signing is configured: request a fresh provider resend instead of an ID-only replay"
          );
        if (!s.eventId)
          throw Error("Find the provider event for this order first");
        const before = await readback(s),
          result = await api(
            s,
            "POST",
            "/connect/webhook/stripe",
            { id: s.eventId },
            true
          );
        must(result);
        const after = await readback(s);
        return reply(res, 200, {
          status: result.status,
          receipt: result.data,
          before,
          after,
          sameTransactionIds: before.transactions.length
            ? JSON.stringify(before.transactions.map((t) => t.id)) ===
              JSON.stringify(after.transactions.map((t) => t.id))
            : null,
          mode: "Deliberate replay of a genuine provider event",
        });
      }
      if (u.pathname === "/api/refusal") {
        await selected(s);
        const before = await readback(s);
        const r = await api(
          s,
          "POST",
          "/connect/webhook/stripe",
          {
            id: "evt_course_unknown_event",
            type: "payment_intent.succeeded",
            data: {
              object: {
                metadata: { orderNumber: s.orderNumber },
                amount_received: 999999,
              },
            },
          },
          true
        );
        const after = await readback(s);
        return reply(res, 200, {
          status: r.status,
          message: r.data.message,
          unchanged: JSON.stringify(before) === JSON.stringify(after),
          ...after,
        });
      }
      if (u.pathname === "/api/readback")
        return reply(res, 200, await readback(s));
      return reply(res, 404, { error: "Unknown companion operation" });
    } catch (e) {
      return reply(res, e.status || 400, {
        error: String(e.message).replace(
          /(?:sk|pk|whsec)_[A-Za-z0-9_]+/g,
          "[redacted]"
        ),
      });
    } finally {
      if (s && ownsLock) s.busy = false;
    }
  })
  .listen(PORT, "127.0.0.1", () =>
    console.log("Integration companion listening on loopback port", PORT)
  );
