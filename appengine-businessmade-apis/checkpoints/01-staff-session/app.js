import { createApi } from "./api.mjs";
import { signInStaff } from "./auth.mjs";
const $ = (selector) => document.querySelector(selector);
const app = (window.app = { view: "setup", session: null });
const titles = {
  setup: [
    "Staff session",
    "Authenticate the staff caller before adding business requests.",
  ],
};
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
    h =
      '<article class="card"><h2>Service desk project</h2><p>Sign in with your own training staff account. Branch reads are added in the next checkpoint.</p></article>';
  $("#content").innerHTML = h;
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
    app.view = "setup";
    $("#login").close();
    form.reset();
    notify("Signed in with this staff account.");
  });
};
window.render = render;
render();
