const origin = process.env.APPENGINE_API_ORIGIN?.replace(/\/$/, ""),
  org = process.env.APPENGINE_ORG,
  token = process.env.APPENGINE_STAFF_TOKEN,
  configId = process.env.APPENGINE_CONFIG_ID;
if (!origin || !org || !token || !configId)
  throw Error("Set API origin, organization, staff token and configuration ID");
async function request(method, path, body) {
  const r = await fetch(origin + path, {
    method,
    headers: {
      orgid: org,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw Error(`AppEngine returned ${r.status}`);
  return r.json();
}
export const discover = (provider) =>
  request("GET", "/upstream/integration-types/" + encodeURIComponent(provider));
export const call = (operation, data = {}) =>
  request(
    "POST",
    "/upstream/call/StripeProvider/" + encodeURIComponent(operation),
    { configId, data }
  );
export async function* recentPaymentEvents(createdGte) {
  let startingAfter;
  for (;;) {
    const page = await call("listEvents", {
      types: ["payment_intent.succeeded"],
      createdGte,
      limit: 50,
      ...(startingAfter ? { startingAfter } : {}),
    });
    for (const event of page.data) yield event;
    if (!page.hasMore) break;
    const next = page.data.at(-1)?.id;
    if (!next || next === startingAfter)
      throw Error("Invalid event pagination cursor");
    startingAfter = next;
  }
}
export async function savedOutcome(orderId, paymentId, eventId) {
  const [order, transactions, events] = await Promise.all([
    request("GET", "/repository/get/sf_order/" + encodeURIComponent(orderId)),
    request("POST", "/repository/find/sf_transaction", {
      query: { "data.ref": paymentId },
      options: { pageSize: 50 },
    }),
    request("POST", "/repository/find/log", {
      query: { "data.kind": "stripe-webhook-event", "data.eventId": eventId },
      options: { pageSize: 10 },
    }),
  ]);
  return { order, transactions: transactions.data, events: events.data };
}
