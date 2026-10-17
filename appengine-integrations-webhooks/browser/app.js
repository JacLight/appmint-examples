const $ = (s) => document.querySelector(s),
  E = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );
let current = "connections",
  cursor = null;
const notice = (t) => {
  $("#notice").textContent = t;
  $("#notice").classList.add("show");
  setTimeout(() => $("#notice").classList.remove("show"), 4500);
};
async function api(route, body) {
  const r = await fetch("/api/" + route, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const j = await r.json();
  if (!r.ok) throw Error(j.error || "Operation failed");
  return j;
}
function bind(sel, fn) {
  $(sel).addEventListener("click", async (e) => {
    const b = e.currentTarget;
    if (b.disabled) return;
    b.disabled = true;
    try {
      await fn();
    } catch (e) {
      notice(e.message);
    } finally {
      b.disabled = false;
    }
  });
}
function form(sel, fn) {
  $(sel).addEventListener("submit", async (e) => {
    e.preventDefault();
    const b = e.target.querySelector("button");
    if (b.disabled) return;
    b.disabled = true;
    try {
      await fn(Object.fromEntries(new FormData(e.target)));
    } catch (e) {
      notice(e.message);
    } finally {
      b.disabled = false;
    }
  });
}
function view(v) {
  current = v;
  ["connections", "events"].forEach((k) => ($("#" + k).hidden = k !== v));
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === v));
}
document.querySelectorAll("[data-view]").forEach(
  (b) =>
    (b.onclick = () => {
      if (!$("#login").hidden) return;
      view(b.dataset.view);
    })
);
const result = (title, message, error = false) =>
  `<div class="result ${error ? "error" : ""}"><b>${E(title)}</b><p>${E(
    message
  )}</p></div>`;
function renderOrder(j) {
  if (!j.order) return;
  const o = j.order;
  $("#order-number").textContent = "Order " + o.number;
  $("#order-result").innerHTML = `<span class="badge ${
    o.status === "new" ? "inactive" : ""
  }">${E(o.status)}</span><dl><dt>Total</dt><dd>$${Number(o.total).toFixed(
    2
  )} ${E(o.currency)}</dd><dt>Gateway</dt><dd>${E(
    o.gateway || "Not paid"
  )}</dd><dt>Paid at</dt><dd>${
    o.paidAt ? E(new Date(o.paidAt).toLocaleTimeString()) : "Not recorded"
  }</dd></dl>${
    o.paymentRef ? `<p class="muted">Reference ${E(o.paymentRef)}</p>` : ""
  }`;
  $("#transaction-result").innerHTML = j.transactions.length
    ? j.transactions
        .map(
          (t) =>
            `<div class="event"><strong>$${Number(t.amount).toFixed(2)} · ${E(
              t.status
            )}</strong><small>Record ${E(t.id)}</small></div>`
        )
        .join("")
    : "<p>No payment transaction yet</p>";
  $("#processed-result").innerHTML = j.processedEvents.length
    ? j.processedEvents
        .map(
          (l) =>
            `<div class="event"><strong>${E(l.eventType)}</strong><small>${E(
              l.eventId
            )}</small><span class="timestamp">Applied ${E(
              new Date(l.processedAt).toLocaleTimeString()
            )}</span></div>`
        )
        .join("")
    : "<p>No processed-event record yet</p>";
}
async function connections() {
  const j = await api("connections");
  $("#connection").textContent = "Organization: " + j.organization;
  $("#config-list").innerHTML = j.connections
    .map(
      (c) =>
        `<button class="key-item" data-config="${E(c.id)}">${E(
          c.name
        )}<small>${E(c.status)} · ${
          c.testKey ? "Stripe TEST" : "Other key mode"
        }</small></button>`
    )
    .join("");
  document.querySelectorAll("[data-config]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          const j = await api("select", { id: b.dataset.config }),
            c = j.connection;
          document
            .querySelectorAll("[data-config]")
            .forEach((n) => n.classList.toggle("selected", n === b));
          $("#config-name").textContent = c.name;
          $("#config-status").textContent = c.status;
          $(
            "#config-metrics"
          ).innerHTML = `<div><small>Provider</small><b>Stripe</b></div><div><small>Environment</small><b>Test</b></div><div><small>Signing secret</small><b>${
            c.signingConfigured ? "Configured" : "Not configured"
          }</b></div><div><small>Saved endpoint ID</small><b>${
            c.registered ? "Present" : "Not saved"
          }</b></div>`;
          notice("Selected this organization’s test connection");
        } catch (e) {
          notice(e.message);
        }
      })
  );
}
form("#login-form", async (b) => {
  await api("connect", b);
  $("#login-form").reset();
  $("#login").hidden = true;
  await connections();
  view("connections");
});
bind("#test-connection", async () => {
  const j = await api("test");
  $("#test-result").innerHTML = result(
    "Provider connected · TEST mode",
    j.message || "The provider account responded. No payment was taken."
  );
});
bind("#inspect-webhooks", async () => {
  const j = await api("webhooks");
  $("#webhook-result").innerHTML = `<p>${
    j.webhooks.length
  } provider-side endpoints found. No registration was changed.</p><table><tr><th>Endpoint</th><th>Status</th><th>Event subscriptions</th></tr>${j.webhooks
    .map(
      (w) =>
        `<tr><td>${E(w.id)}</td><td>${E(w.status)}</td><td>${
          w.enabledEvents?.length || 0
        }</td></tr>`
    )
    .join("")}</table>`;
});
bind("#discover", async () => {
  const j = await api("discover", { provider: $("#provider").value });
  $("#schema-result").innerHTML = `<p><b>${E(j.name)}</b> · ${E(j.type)} · ${E(
    j.useCases?.join(", ")
  )}</p><table><tr><th>Configuration field</th><th>Type</th><th>Source</th></tr>${j.fields
    .map(
      (f) =>
        `<tr><td>${E(f.name)}</td><td>${E(f.type)}</td><td>${
          f.readOnly ? "Provider setup result" : "Configuration input"
        }</td></tr>`
    )
    .join("")}</table><div class="tags">${j.operations
    .map((o) => `<span>${E(o)}</span>`)
    .join("")}</div>`;
});
form("#order-form", async (b) => {
  const j = await api("order", b);
  renderOrder(j);
  notice("Unpaid test order saved");
});
bind("#confirm-payment", async () => {
  const j = await api("payment");
  $("#payment-result").innerHTML = result(
    "Stripe TEST payment succeeded",
    "$" +
      Number(j.payment.amount).toFixed(2) +
      " confirmed by the provider. Now inspect the AppEngine readback."
  );
  renderOrder(j);
});
async function events(next = false) {
  const j = await api("events", next ? { cursor } : {});
  cursor = j.nextCursor;
  $("#event-next").hidden = !j.hasMore;
  $("#event-list").innerHTML =
    j.events
      .map(
        (e) =>
          `<div class="event ${
            e.matchesOrder ? "own" : ""
          }"><div class="row"><strong>${E(
            e.type
          )}</strong><span class="badge">$${e.amount.toFixed(
            2
          )}</span></div><small>${E(e.id)}</small><p>${
            e.matchesOrder
              ? "Selected · exact payment for this course order"
              : "Another test event · not selected"
          }</p></div>`
      )
      .join("") || "<p>No events in this page.</p>";
  if (j.selectedEvent) notice("Matched the exact payment event");
}
bind("#load-events", () => events());
bind("#event-next", () => events(true));
bind("#replay", async () => {
  const j = await api("replay");
  renderOrder(j.after);
  $("#receiver-result").innerHTML = result(
    j.receipt.duplicate
      ? "Duplicate acknowledged · HTTP " + j.status
      : "Event applied · HTTP " + j.status,
    j.receipt.duplicate
      ? `Same transaction IDs: ${
          j.sameTransactionIds ? "yes" : "inspect readback"
        }. Count: ${j.after.transactions.length}.`
      : "AppEngine applied the provider event. The order and transaction are now read from saved records."
  );
});
bind("#reject-fake", async () => {
  const j = await api("refusal");
  renderOrder(j);
  $("#receiver-result").innerHTML = result(
    "Unknown event refused · HTTP " + j.status,
    j.message +
      ". Saved order and transaction unchanged: " +
      (j.unchanged ? "yes" : "inspect result"),
    true
  );
});
bind("#readback", async () => {
  renderOrder(await api("readback"));
  notice("Saved order, transaction and event log reloaded");
});

(async () => {
  try {
    const s = await api("state");
    $("#login").hidden = true;
    await connections();
    view("connections");
    if (s.selected)
      document
        .querySelector('[data-config="' + CSS.escape(s.selected) + '"]')
        ?.click();
    renderOrder(s);
  } catch {}
})();
