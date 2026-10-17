import { resetVisitState } from "./state.mjs";
import { createApi } from "./api.mjs";
import { signInStaff } from "./auth.mjs";
const $ = (s) => document.querySelector(s),
  esc = (x) =>
    String(x ?? "").replace(
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
const app = (window.app = {
  view: "setup",
  session: null,
  location: "",
  points: [],
  queue: [],
  products: [],
  employees: [],
});
// Keep the selected visit separate when the customer or branch changes.
// This teaching client keeps context in memory. Reload recovery needs saved IDs.
function resetVisit() {
  resetVisitState(app);
}
const titles = {
  setup: [
    "Location & readiness",
    "Use the saved branch name, available service points and an authorized operator.",
  ],
  arrival: [
    "Arrivals & stands",
    "One customer joins the queue, then moves into an available service stand.",
  ],
};
const money = (n) =>
    Number(n || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    }),
  badge = (x) => `<span class="badge">${esc(x)}</span>`,
  data = (x) => x?.data || {},
  button = (id, label, secondary = false) =>
    `<button id="${id}" class="${
      secondary ? "secondary" : ""
    }">${label}</button>`,
  field = (name, label, value = "", type = "text") =>
    `<label>${label}<input name="${name}" type="${type}" ${
      type === "number" ? 'step="any"' : ""
    } value="${esc(value)}" required></label>`,
  row = (label, value) =>
    `<div class="recordline"><span>${label}</span><strong>${esc(
      value
    )}</strong></div>`;
function notify(text, error = false) {
  $("#notice").hidden = false;
  $("#notice").textContent = text;
  $("#notice").className = error ? "error" : "success";
}
const request = createApi(
  () => app.session,
  ({ method, path, status, result }) => {
    $("#trace").textContent =
      method +
      " " +
      path +
      "\nHTTP " +
      status +
      "\n" +
      JSON.stringify(result, null, 2);
  }
);
let pending = false;
async function act(fn) {
  if (pending) return;
  pending = true;
  document.querySelectorAll("main button").forEach((b) => (b.disabled = true));
  try {
    await fn();
    render();
  } catch (e) {
    // A competing operator may have changed the floor. Re-read; never retry a write.
    if (e.status === 409 && app.location) {
      const failedRequest = $("#trace").textContent;
      try {
        await refreshFloor();
        render();
      } catch {
        // Preserve the original conflict even if this read also fails.
      }
      $("#trace").textContent = failedRequest;
    }
    notify(e.message, true);
  } finally {
    pending = false;
    document
      .querySelectorAll("main button")
      .forEach((b) => (b.disabled = false));
  }
}
function on(id, fn) {
  $("#" + id)?.addEventListener("click", () => act(fn));
}
function form(id, fn) {
  $("#" + id)?.addEventListener("submit", (e) => {
    e.preventDefault();
    act(() => fn(Object.fromEntries(new FormData(e.target))));
  });
}
async function refreshFloor() {
  app.points = await request(
    "GET",
    "/checkin/service-point?businessLocationId=" +
      encodeURIComponent(app.location)
  );
  app.queue = await request(
    "GET",
    "/checkin/queue?businessLocationId=" + encodeURIComponent(app.location)
  );
}
const floor = () =>
  `<div class="floor">${app.points
    .map(
      (p) =>
        `<article class="stand ${esc(
          p.data.status
        )}"><span class="muted">SERVICE STAND</span><h3>${esc(
          p.data.displayName
        )}</h3>${badge(p.data.status)}</article>`
    )
    .join("")}</div>`;
function render() {
  const [title, subtitle] = titles[app.view];
  $("#title").textContent = title;
  $("#subtitle").textContent = subtitle;
  $("#signIn").textContent = app.session
    ? "Staff · Connected"
    : "Staff · Sign in";
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === app.view));
  let h = "";
  if (app.view === "setup")
    h = `<div class="grid"><article class="card"><h2>Choose your branch</h2><form id="chooseLocation">${field(
      "location",
      "Saved location name",
      app.location
    )}<button>Load branch & readiness</button></form><p class="muted">Use the location’s name. Keep record IDs for employee and stand references.</p></article><article class="card"><h2>Register readiness</h2>${
      app.readiness
        ? badge(app.readiness.allowed ? "Allowed" : "Blocked") +
          "<p>" +
          esc(
            app.readiness.reasons?.join(", ") ||
              "No blocking requirements returned for this operator."
          ) +
          "</p>"
        : "Load a branch to check this staff session."
    }</article></div>${floor()}<article class="card"><h2>Product catalogue</h2>${
      app.products
        .map((p) => row(p.data.name, p.data.sku + " · " + money(p.data.price)))
        .join("") ||
      "Products are read from your organization. Create the service products before opening a sale."
    }</article>`;
  if (app.view === "arrival")
    h = `${floor()}<div class="grid"><article class="card"><h2>New walk-in</h2><form id="walkIn">${field(
      "name",
      "Customer name",
      "Dana Reyes"
    )}${field("email", "Email", "", "email")}${field(
      "notes",
      "Visit notes",
      "Tune-up and chain inspection"
    )}<button>Check in customer</button></form></article><article class="card"><h2>Current arrival</h2>${
      app.arrival
        ? row("Customer", app.arrival.data.payload.customer.name) +
          row("Arrival ID", app.arrival.sk) +
          row(
            "Customer ID",
            app.arrival.data.payload.customer.id || "Not returned"
          ) +
          row("Queue status", app.position?.status || "Waiting") +
          row("Position", app.position?.position ?? "—") +
          `<form id="assignStand"><label>Service stand<select name="stand">${app.points
            .map(
              (p) =>
                `<option value="${esc(p.sk)}">${esc(
                  p.data.displayName
                )} · ${esc(p.data.status)}</option>`
            )
            .join("")}</select></label><button>Assign stand</button></form>`
        : "Save a walk-in to read the actual queue position."
    }${button("refreshQueue", "Refresh queue", true)}${
      app.arrival ? button("leaveQueue", "Mark this arrival left", true) : ""
    }${
      app.recent?.length
        ? "<h3>Saved arrivals in this session</h3>" +
          app.recent
            .map(
              (a) =>
                `<button class="secondary" data-arrival="${esc(
                  a.arrival.sk
                )}">${esc(a.arrival.data.payload.customer.name)}</button>`
            )
            .join("")
        : ""
    }<p class="muted">${
      Array.isArray(app.queue) ? app.queue.length : app.queue.data?.length || 0
    } waiting records returned</p></article></div>`;
  $("#content").innerHTML = h;
  form("chooseLocation", async (v) => {
    if (app.location !== v.location) {
      resetVisit();
      app.arrival = null;
      app.recent = [];
    }
    app.location = v.location;
    app.readiness = await request(
      "GET",
      "/storefront/pos/readiness?businessLocationId=" +
        encodeURIComponent(v.location)
    );
    const p = await request("POST", "/repository/find/sf_product", {
      query: { "data.businessLocations": v.location },
      options: { page: 1, pageSize: 50 },
    });
    app.products = p.data;
    const e = await request(
      "GET",
      "/business-made/employees?page=1&pageSize=50"
    );
    app.employees = e.data || e;
    await refreshFloor();
    notify(
      "Branch, available stands, catalogue and operator readiness loaded."
    );
  });
  form("walkIn", async (v) => {
    const savedArrival = await request("POST", "/checkin/walk-in", {
      businessLocationId: app.location,
      customer: { name: v.name, email: v.email },
      partySize: 1,
      quotedWaitMinutes: 10,
      notes: v.notes,
    });
    resetVisit();
    app.arrival = savedArrival;
    app.position = await request(
      "GET",
      "/checkin/queue/position/" + app.arrival.sk
    );
    app.standId = null;
    app.recent ||= [];
    app.recent.push({ arrival: app.arrival });
    await refreshFloor();
    notify("Customer and arrival saved. Queue position is from AppEngine.");
  });
  form("assignStand", async (v) => {
    app.assignment = await request(
      "POST",
      "/checkin/" + app.arrival.sk + "/assign",
      { servicePointId: v.stand }
    );
    app.standId = app.assignment.servicePointId;
    const current = app.recent?.find((a) => a.arrival.sk === app.arrival.sk);
    if (current) current.standId = app.standId;
    await refreshFloor();
    app.position = await request(
      "GET",
      "/checkin/queue/position/" + app.arrival.sk
    );
    notify("Stand assigned. Queue and floor refreshed.");
  });
  on("refreshQueue", refreshFloor);
  on("leaveQueue", async () => {
    await request("POST", "/checkin/" + app.arrival.sk + "/leave", {
      reason: "Customer left the controlled training queue",
    });
    app.position = await request(
      "GET",
      "/checkin/queue/position/" + app.arrival.sk
    );
    await refreshFloor();
    notify("Arrival marked left; queue refreshed.");
  });
  for (const b of document.querySelectorAll("[data-arrival]"))
    b.onclick = () =>
      act(async () => {
        const saved = app.recent.find(
          (a) => a.arrival.sk === b.dataset.arrival
        );
        const position = await request(
          "GET",
          "/checkin/queue/position/" + saved.arrival.sk
        );
        await refreshFloor();
        resetVisit();
        app.arrival = saved.arrival;
        app.standId = saved.standId;
        app.position = position;
        notify("Saved arrival selected and current queue state read.");
      });
}
for (const b of document.querySelectorAll("[data-view]"))
  b.onclick = () => {
    app.view = b.dataset.view;
    render();
  };
$("#signIn").onclick = () => $("#login").showModal();
$("#cancel").onclick = () => $("#login").close();
$("#loginForm").onsubmit = (e) => {
  e.preventDefault();
  const form = e.target;
  const values = Object.fromEntries(new FormData(form));
  act(async () => {
    app.session = await signInStaff(values);
    resetVisit();
    app.arrival = null;
    app.recent = [];
    app.location = "";
    app.points = [];
    app.queue = [];
    app.products = [];
    app.employees = [];
    app.readiness = null;
    app.view = "setup";
    $("#login").close();
    form.reset();
    notify("Signed in with this staff account.");
  });
};
window.render = render;
render();
