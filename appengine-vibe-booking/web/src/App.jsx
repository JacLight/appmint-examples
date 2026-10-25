import React, { useEffect, useRef, useState } from "react";
import Auth from "./Auth.jsx";

const message = (e) => e?.message || "Something went wrong. Please try again.";
const dateLabel = (iso, zone, options = {}) =>
  new Intl.DateTimeFormat("en-US", { timeZone: zone, ...options }).format(
    new Date(iso),
  );
const timeLabel = (slot) =>
  dateLabel(slot.start, slot.timeZone, { hour: "numeric", minute: "2-digit" });
const dayLabel = (slot) =>
  dateLabel(slot.start, slot.timeZone, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
function today(zone, instant = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}
function useRemote(load, deps) {
  const [state, set] = useState({ loading: true, value: null, error: null });
  const [nonce, retry] = useState(0);
  useEffect(() => {
    let current = true;
    set({ loading: true, value: null, error: null });
    Promise.resolve()
      .then(load)
      .then(
        (value) => current && set({ loading: false, value, error: null }),
        (error) => current && set({ loading: false, value: null, error }),
      );
    return () => {
      current = false;
    };
  }, [...deps, nonce]);
  return { ...state, retry: () => retry((n) => n + 1) };
}
function Arrow({ back = false }) {
  return <span aria-hidden="true">{back ? "←" : "↗"}</span>;
}
function Status({ resource, empty, children, onAuth }) {
  if (resource.loading)
    return (
      <div className="state" role="status">
        <span className="spinner" /> Finding your next moment…
      </div>
    );
  if (resource.error)
    return (
      <div className="state error" role="alert">
        <p>{message(resource.error)}</p>
        {resource.error.status === 401 && onAuth ? (
          <button
            className="text-button"
            onClick={() => onAuth(resource.retry)}
          >
            Sign in again <Arrow />
          </button>
        ) : (
          <button className="text-button" onClick={resource.retry}>
            Try again <Arrow />
          </button>
        )}
      </div>
    );
  if (Array.isArray(resource.value) && !resource.value.length)
    return (
      <div className="state">
        <span className="empty-mark" aria-hidden="true">
          ◌
        </span>
        <p>{empty}</p>
      </div>
    );
  return children(resource.value);
}
function SlotPicker({ api, service, selected, onSelect, onAuth }) {
  const [date, setDate] = useState(() =>
    today(service.timeZone, selected ? new Date(selected.start) : new Date()),
  );
  const resource = useRemote(
    () =>
      api.availability({
        serviceId: service.id,
        date,
        timeZone: service.timeZone,
      }),
    [api, service.id, date],
  );
  return (
    <div className="slot-picker">
      <div className="section-row">
        <div>
          <h2>Find a little time.</h2>
          <p className="muted">Choose an appointment that works for you.</p>
        </div>
        <span className="pill">{service.durationMinutes} min</span>
      </div>
      <label className="date-field">
        Appointment date
        <input
          type="date"
          value={date}
          min={today(service.timeZone)}
          onChange={(e) => {
            if (e.target.value) {
              setDate(e.target.value);
              onSelect(null);
            }
          }}
          required
        />
      </label>
      <div className="section-row small">
        <h3>Available times</h3>
        <span className="muted zone">
          {service.timeZone.replaceAll("_", " ")}
        </span>
      </div>
      <Status
        resource={resource}
        onAuth={onAuth}
        empty="No appointments on this date. Try another day."
      >
        {(slots) => {
          const available = slots.filter((s) => s.available);
          return available.length ? (
            <div
              className="slots"
              role="group"
              aria-label="Available appointment times"
            >
              {available.map((slot) => (
                <button
                  key={slot.id}
                  className={`slot ${selected?.id === slot.id ? "selected" : ""}`}
                  aria-pressed={selected?.id === slot.id}
                  onClick={() => onSelect(slot)}
                >
                  {timeLabel(slot)}
                  {slot.timeZone !== service.timeZone && (
                    <small>{slot.timeZone}</small>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="state">
              No appointments on this date. Try another day.
            </p>
          );
        }}
      </Status>
    </div>
  );
}
const schemaKeys = new Set([
  "type",
  "title",
  "description",
  "properties",
  "required",
  "$schema",
  "$id",
]);
const fieldKeys = new Set([
  "type",
  "title",
  "description",
  "enum",
  "const",
  "minLength",
  "maxLength",
  "pattern",
  "minimum",
  "maximum",
  "x-control-variant",
]);
function supported(schema) {
  return (
    schema &&
    schema.properties &&
    (!schema.type || schema.type === "object") &&
    Object.keys(schema).every((k) => schemaKeys.has(k)) &&
    (!schema.required ||
      (Array.isArray(schema.required) &&
        schema.required.every((k) => k in schema.properties))) &&
    Object.values(schema.properties).every(
      (f) =>
        f &&
        ["string", "boolean", "number", "integer"].includes(f.type) &&
        Object.keys(f).every((k) => fieldKeys.has(k)) &&
        (!f.enum || Array.isArray(f.enum)) &&
        (!f["x-control-variant"] || f["x-control-variant"] === "textarea") &&
        validPattern(f.pattern),
    )
  );
}
function validPattern(pattern) {
  try {
    if (pattern !== undefined) new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}
function validate(schema, answers) {
  const errors = {};
  for (const [name, f] of Object.entries(schema.properties)) {
    const v = answers[name],
      missing = v == null || v === "";
    if (missing) {
      if (schema.required?.includes(name))
        errors[name] = "Please complete this field.";
      continue;
    }
    if (f.const !== undefined && v !== f.const)
      errors[name] = "Please confirm this before continuing.";
    if (f.enum && !f.enum.includes(v))
      errors[name] = "Choose an available option.";
    if (
      f.type === "string" &&
      ((f.minLength && v.length < f.minLength) ||
        (f.maxLength && v.length > f.maxLength))
    )
      errors[name] =
        `Please use ${f.minLength || 0}–${f.maxLength || "more"} characters.`;
    if (f.pattern && !new RegExp(f.pattern).test(v))
      errors[name] = "Please use the requested format.";
    if (
      ["number", "integer"].includes(f.type) &&
      (!Number.isFinite(v) ||
        (f.type === "integer" && !Number.isInteger(v)) ||
        (f.minimum !== undefined && v < f.minimum) ||
        (f.maximum !== undefined && v > f.maximum))
    )
      errors[name] = "Please enter a valid number within the requested range.";
  }
  return errors;
}
function Intake({ schema, answers, setAnswers, onNext, onBack }) {
  const [errors, setErrors] = useState({});
  if (!supported(schema))
    return (
      <div className="state error" role="alert">
        This appointment's form is currently unavailable. Please try again
        later.
        <button className="text-button" onClick={onBack}>
          Back to times
        </button>
      </div>
    );
  function submit(e) {
    e.preventDefault();
    const found = validate(schema, answers);
    setErrors(found);
    if (!Object.keys(found).length) onNext();
  }
  return (
    <form onSubmit={submit} className="intake">
      <h2>{schema.title || "Tell us about your space."}</h2>
      <p className="muted">
        {schema.description ||
          "A few details help us make the most of your time together."}
      </p>
      {Object.entries(schema.properties).map(([name, f]) => {
        const id = `intake-${name}`,
          value = answers[name],
          change = (v) => setAnswers((a) => ({ ...a, [name]: v })),
          props = {
            id,
            "aria-invalid": !!errors[name],
            "aria-describedby": `${id}-help`,
            required: schema.required?.includes(name),
          };
        return (
          <div className="field" key={name}>
            {f.type === "boolean" ? (
              <label className="check">
                <input
                  {...props}
                  required={f.const === true}
                  type="checkbox"
                  checked={value === true}
                  onChange={(e) => change(e.target.checked)}
                />
                <span>
                  {f.title || name}
                  {props.required ? " *" : ""}
                </span>
              </label>
            ) : (
              <>
                <label htmlFor={id}>
                  {f.title || name}
                  {props.required ? " *" : ""}
                </label>
                {f.enum ? (
                  <select
                    {...props}
                    value={
                      value === undefined ? "" : String(f.enum.indexOf(value))
                    }
                    onChange={(e) =>
                      change(
                        e.target.value === ""
                          ? undefined
                          : f.enum[Number(e.target.value)],
                      )
                    }
                  >
                    <option value="">Choose an option</option>
                    {f.enum.map((v, i) => (
                      <option key={i} value={i}>
                        {String(v)}
                      </option>
                    ))}
                  </select>
                ) : f["x-control-variant"] === "textarea" ? (
                  <textarea
                    {...props}
                    rows="4"
                    value={value || ""}
                    maxLength={f.maxLength}
                    minLength={f.minLength}
                    onChange={(e) => change(e.target.value)}
                  />
                ) : (
                  <input
                    {...props}
                    type={
                      ["number", "integer"].includes(f.type) ? "number" : "text"
                    }
                    step={f.type === "integer" ? 1 : "any"}
                    min={f.minimum}
                    max={f.maximum}
                    minLength={f.minLength}
                    maxLength={f.maxLength}
                    value={value ?? ""}
                    onChange={(e) =>
                      change(
                        ["number", "integer"].includes(f.type)
                          ? e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                          : e.target.value,
                      )
                    }
                  />
                )}
              </>
            )}
            <small
              id={`${id}-help`}
              className={errors[name] ? "error" : "muted"}
            >
              {errors[name] || f.description}
            </small>
          </div>
        );
      })}
      <div className="actions">
        <button type="button" className="text-button" onClick={onBack}>
          <Arrow back /> Back
        </button>
        <button className="primary">
          Review appointment <Arrow />
        </button>
      </div>
    </form>
  );
}
function BookingSummary({ service, slot, heading = "Your appointment" }) {
  return (
    <aside className="booking-summary">
      <span className="eyebrow">{heading}</span>
      <div className="summary-art">
        <img src="/images/atelier-living-room.png" alt="" />
      </div>
      <h3>{service.name}</h3>
      <p className="muted">
        {service.durationMinutes} minutes · Personal consultation
      </p>
      {slot ? (
        <div className="summary-date">
          <span className="calendar-icon" aria-hidden="true">
            ▦
          </span>
          <div>
            <strong>{dayLabel(slot)}</strong>
            <p>
              {timeLabel(slot)}
              <br />
              <small>{slot.timeZone.replaceAll("_", " ")}</small>
            </p>
          </div>
        </div>
      ) : (
        <p className="summary-note">
          A considered first step toward a home that feels like you.
        </p>
      )}
    </aside>
  );
}
function BookFlow({
  api,
  service,
  customer,
  onAuth,
  onDone,
  onBack,
  onBookings,
}) {
  const [step, setStep] = useState(0),
    [slot, setSlot] = useState(null),
    [answers, setAnswers] = useState({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [unknown, setUnknown] = useState(false);
  const schema = useRemote(
    () => (customer ? api.intakeSchema(service.id) : Promise.resolve(null)),
    [api, service.id, customer?.id],
  );
  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const booked = await api.createBooking({
        serviceId: service.id,
        slotId: slot.id,
        answers,
      });
      onDone(booked);
    } catch (e) {
      setError(message(e));
      if (e.code === "WRITE_OUTCOME_UNKNOWN") setUnknown(true);
      else if (e.status === 401 && e.code !== "SESSION_RENEWED")
        onAuth(() => {});
      else if ([400, 409].includes(e.status)) {
        setSlot(null);
        setStep(0);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="booking-page">
      <button className="text-button" onClick={onBack}>
        <Arrow back /> All consultations
      </button>
      <div className="stepper" aria-label="Booking progress">
        {["Date & time", "Your space", "Review"].map((s, i) => (
          <span
            key={s}
            className={i === step ? "active" : i < step ? "complete" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <b>{i < step ? "✓" : i + 1}</b>
            {s}
          </span>
        ))}
      </div>
      <div className="booking-layout">
        <div className="booking-main">
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {unknown && (
            <div className="unknown-outcome" role="status">
              <p>
                We could not confirm the result. Check your bookings before
                making another request.
              </p>
              <button className="text-button" onClick={onBookings}>
                Check My bookings <Arrow />
              </button>
            </div>
          )}
          {step === 0 ? (
            <>
              {customer ? (
                <>
                  <SlotPicker
                    api={api}
                    onAuth={onAuth}
                    service={service}
                    selected={slot}
                    onSelect={setSlot}
                  />
                  <div className="actions end">
                    <button
                      className="primary"
                      disabled={!slot}
                      onClick={() => setStep(1)}
                    >
                      Continue <Arrow />
                    </button>
                  </div>
                </>
              ) : (
                <div className="availability-auth">
                  <span className="eyebrow">
                    Your time, thoughtfully chosen
                  </span>
                  <h2>Let's find your moment.</h2>
                  <p className="muted">
                    Sign in or create an account to see available times and
                    arrange your personal consultation.
                  </p>
                  <button className="primary" onClick={() => onAuth(() => {})}>
                    Continue to appointments <Arrow />
                  </button>
                </div>
              )}
            </>
          ) : step === 1 ? (
            <Status resource={schema} onAuth={onAuth}>
              {(value) => (
                <Intake
                  schema={value}
                  answers={answers}
                  setAnswers={setAnswers}
                  onNext={() => setStep(2)}
                  onBack={() => setStep(0)}
                />
              )}
            </Status>
          ) : (
            <div className="review">
              <span className="eyebrow">One last look</span>
              <h2>Make time for your space.</h2>
              <p className="muted">
                Check your details before confirming your appointment.
              </p>
              <div className="review-section">
                <h3>Booked for</h3>
                <p>{customer?.name || customer?.email}</p>
                {customer?.name && <p className="muted">{customer.email}</p>}
              </div>
              <div className="review-section">
                <div className="section-row">
                  <h3>Your space</h3>
                  <button className="text-button" onClick={() => setStep(1)}>
                    Edit
                  </button>
                </div>
                <dl>
                  {Object.entries(answers).map(([key, value]) => (
                    <div key={key}>
                      <dt>{schema.value?.properties[key]?.title || key}</dt>
                      <dd>
                        {typeof value === "boolean"
                          ? value
                            ? "Yes"
                            : "No"
                          : String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="actions">
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => setStep(1)}
                >
                  <Arrow back /> Back
                </button>
                <button
                  className="primary"
                  disabled={busy || unknown}
                  onClick={confirm}
                >
                  {busy ? "Confirming…" : "Confirm appointment"} <Arrow />
                </button>
              </div>
            </div>
          )}
        </div>
        <BookingSummary service={service} slot={slot} />
      </div>
    </section>
  );
}
function BookingDetail({ api, id, initial, services, onBack, onAuth }) {
  const remote = useRemote(() => api.booking(id), [api, id]);
  const [updated, setUpdated] = useState(null),
    [moving, setMoving] = useState(false),
    [slot, setSlot] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [unknown, setUnknown] = useState(false),
    [pickerVersion, setPickerVersion] = useState(0);
  const booking = updated || remote.value || initial;
  if (!booking)
    return (
      <Status resource={remote} onAuth={onAuth}>
        {() => null}
      </Status>
    );
  const service = services.find((s) => s.id === booking.serviceId);
  async function move() {
    setBusy(true);
    setError("");
    try {
      setUpdated(await api.rescheduleBooking(id, { slotId: slot.id }));
      setMoving(false);
      setSlot(null);
    } catch (e) {
      setError(message(e));
      if (e.code === "WRITE_OUTCOME_UNKNOWN") setUnknown(true);
      else if (e.status === 401 && e.code !== "SESSION_RENEWED")
        onAuth(() => {});
      else if ([400, 409].includes(e.status)) {
        setSlot(null);
        setPickerVersion((n) => n + 1);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="detail-page">
      <button className="text-button" onClick={onBack}>
        <Arrow back /> My bookings
      </button>
      <div className="detail-heading">
        <span className="eyebrow">
          {initial ? "Appointment received" : "Your appointment"}
        </span>
        <h1>
          {initial
            ? "A little time. A fresh perspective."
            : booking.serviceName}
        </h1>
        <p className="muted">
          {initial
            ? "Your appointment details are below. We look forward to hearing about your space."
            : "Everything you need for your next conversation."}
        </p>
      </div>
      <div className="booking-layout">
        <div className="booking-main">
          {moving && service ? (
            <>
              <SlotPicker
                key={pickerVersion}
                api={api}
                onAuth={onAuth}
                service={service}
                selected={slot}
                onSelect={setSlot}
              />
              <p className="muted">
                Your current appointment stays in place until the new time is
                confirmed.
              </p>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              {unknown && (
                <div className="unknown-outcome">
                  <p>
                    Check the saved appointment before making another change.
                  </p>
                  <button className="text-button" onClick={onBack}>
                    Check My bookings <Arrow />
                  </button>
                </div>
              )}
              <div className="actions">
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => {
                    setMoving(false);
                    setError("");
                  }}
                >
                  Keep current time
                </button>
                <button
                  className="primary"
                  disabled={!slot || busy || unknown}
                  onClick={move}
                >
                  {busy ? "Updating…" : "Confirm new time"} <Arrow />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="section-row">
                <h2>{booking.serviceName}</h2>
                <span className="status-badge">{booking.status}</span>
              </div>
              <div className="appointment-date">
                <span className="eyebrow">{dayLabel(booking)}</span>
                <strong>{timeLabel(booking)}</strong>
                <p className="muted">{booking.timeZone.replaceAll("_", " ")}</p>
              </div>
              {booking.reference && (
                <p className="reference">
                  Booking reference <strong>{booking.reference}</strong>
                </p>
              )}
              {booking.canReschedule && service && (
                <button className="secondary" onClick={() => setMoving(true)}>
                  Choose a different time <Arrow />
                </button>
              )}
              {remote.error && (
                <p className="error" role="alert">
                  We couldn't refresh these details. {message(remote.error)}
                </p>
              )}
            </>
          )}
        </div>
        <aside className="booking-summary">
          <img
            className="detail-photo"
            src="/images/atelier-living-room.png"
            alt=""
          />
          <h3>Bring your ideas.</h3>
          <p className="muted">
            Think about how you want your space to feel, what works today, and
            what you'd love to change.
          </p>
        </aside>
      </div>
    </section>
  );
}
function MyBookings({ api, onSelect, onBrowse, onAuth }) {
  const resource = useRemote(() => api.bookings(), [api]);
  return (
    <section className="bookings-page">
      <span className="eyebrow">Your next chapter</span>
      <div className="section-row">
        <h1>My bookings.</h1>
        <button className="secondary" onClick={onBrowse}>
          Book a consultation <Arrow />
        </button>
      </div>
      <Status
        resource={resource}
        onAuth={onAuth}
        empty="Your appointments will appear here. Find a consultation to get started."
      >
        {(rows) => (
          <div className="booking-list">
            {rows.map((b) => (
              <button
                className="booking-row"
                key={b.id}
                onClick={() => onSelect(b.id)}
              >
                <span className="date-tile">
                  <small>
                    {dateLabel(b.start, b.timeZone, { month: "short" })}
                  </small>
                  <strong>
                    {dateLabel(b.start, b.timeZone, { day: "numeric" })}
                  </strong>
                </span>
                <span className="booking-row-name">
                  <strong>{b.serviceName}</strong>
                  <small>
                    {dayLabel(b)} · {timeLabel(b)} ·{" "}
                    {b.timeZone.replaceAll("_", " ")}
                  </small>
                </span>
                <span className="status-badge">{b.status}</span>
                <Arrow />
              </button>
            ))}
          </div>
        )}
      </Status>
    </section>
  );
}
export default function App({ api }) {
  const [customer, setCustomer] = useState(null),
    [sessionReady, setSessionReady] = useState(false),
    [sessionError, setSessionError] = useState(""),
    [view, setView] = useState("home"),
    [service, setService] = useState(null),
    [detail, setDetail] = useState(null),
    [signedOutError, setSignedOutError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const afterAuth = useRef(null);
  const services = useRemote(() => api.services(), [api]);
  useEffect(() => {
    let alive = true;
    api
      .session()
      .then(
        (c) => alive && setCustomer(c),
        (e) => alive && setSessionError(message(e)),
      )
      .finally(() => alive && setSessionReady(true));
    return () => {
      alive = false;
    };
  }, [api]);
  function navigate(next) {
    setView(next);
    setSignedOutError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function auth(next) {
    afterAuth.current = next;
    setAuthOpen(true);
    window.scrollTo(0, 0);
  }
  function signedIn(c) {
    setCustomer(c);
    setSessionError("");
    setAuthOpen(false);
    afterAuth.current?.();
    afterAuth.current = null;
  }
  async function signOut() {
    try {
      await api.signOut();
      setCustomer(null);
      setService(null);
      setDetail(null);
      navigate("home");
    } catch (e) {
      setSignedOutError(message(e));
    }
  }
  return (
    <>
      <header className="site-header">
        <button
          className="wordmark"
          aria-label="Atelier home"
          onClick={() => navigate("home")}
        >
          atelier
        </button>
        <nav aria-label="Main navigation">
          <button
            className={view === "home" ? "nav-link current" : "nav-link"}
            onClick={() => {
              navigate("home");
              setTimeout(
                () =>
                  document
                    .getElementById("consultations")
                    ?.scrollIntoView({ behavior: "smooth" }),
                50,
              );
            }}
          >
            Consultations
          </button>
          <button
            className={view === "bookings" ? "nav-link current" : "nav-link"}
            onClick={() =>
              customer ? navigate("bookings") : auth(() => navigate("bookings"))
            }
          >
            My bookings
          </button>
          {customer ? (
            <div className="account">
              <span className="avatar">
                {(customer.name || customer.email).slice(0, 1).toUpperCase()}
              </span>
              <span className="account-name">
                {customer.name?.split(" ")[0] || customer.email}
              </span>
              <button className="text-button" onClick={signOut}>
                Sign out
              </button>
            </div>
          ) : (
            <button
              className="header-signin"
              disabled={!sessionReady}
              onClick={() => auth(null)}
            >
              Sign in <Arrow />
            </button>
          )}
        </nav>
      </header>
      <main id="main">
        {signedOutError && (
          <p className="page-alert error" role="alert">
            {signedOutError}
          </p>
        )}
        {sessionError && view !== "home" && (
          <p className="page-alert error" role="alert">
            {sessionError}
          </p>
        )}
        <div hidden={authOpen}>
          {view === "home" ? (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <span className="eyebrow">
                    <i /> Thoughtful spaces. Everyday living.
                  </span>
                  <h1>
                    A home that feels
                    <br />
                    more like <em>you.</em>
                  </h1>
                  <p>
                    Fresh eyes. Considered ideas. A personal design consultation
                    to help you see what's possible in your space.
                  </p>
                  <a className="primary" href="#consultations">
                    Find your consultation <Arrow />
                  </a>
                  <div className="hero-footnote">
                    <span className="line" /> A conversation is a beautiful
                    place to start.
                  </div>
                </div>
                <div className="hero-image">
                  <img
                    className="hero-photo"
                    src="/images/atelier-living-room.png"
                    alt="Sunlit contemporary living room with warm natural materials"
                    fetchPriority="high"
                  />
                  <div className="image-note">
                    <span>THE ATELIER APPROACH</span>
                    <strong>
                      Live well.
                      <br />
                      In your own way.
                    </strong>
                  </div>
                </div>
              </section>
              <section className="services-section" id="consultations">
                <div className="services-intro">
                  <span className="eyebrow">01 / Let's make room</span>
                  <div>
                    <h2>
                      A fresh perspective,
                      <br />
                      at your pace.
                    </h2>
                    <p className="muted">
                      Choose the conversation that fits your project.
                      <br />
                      We'll find a time to bring your ideas together.
                    </p>
                  </div>
                </div>
                <Status
                  resource={services}
                  empty="Our consultation calendar is being updated. Please check back soon."
                >
                  {(rows) => (
                    <div className="service-grid">
                      {rows.map((s, i) => (
                        <article className="service-card" key={s.id}>
                          <div
                            className={`service-symbol symbol-${i % 2}`}
                            aria-hidden="true"
                          >
                            <span />
                            <span />
                            <span />
                          </div>
                          <div className="service-body">
                            <div className="section-row">
                              <span className="eyebrow">
                                Personal consultation
                              </span>
                              <span className="pill">
                                {s.durationMinutes} min
                              </span>
                            </div>
                            <h3>{s.name}</h3>
                            {s.description && (
                              <p className="muted">{s.description}</p>
                            )}
                            <button
                              className="text-button service-cta"
                              onClick={() => {
                                setService(s);
                                navigate("book");
                              }}
                            >
                              Choose a time <Arrow />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </Status>
              </section>
              <section className="approach">
                <span className="eyebrow">Good things start small</span>
                <h2>
                  Your ideas. Our perspective.
                  <br />
                  <em>Something better, together.</em>
                </h2>
                <div className="approach-steps">
                  <p>
                    <b>01</b>
                    <strong>Find your moment</strong>Choose a consultation and a
                    time that fits your day.
                  </p>
                  <p>
                    <b>02</b>
                    <strong>Tell us about your space</strong>Share a little
                    context so we can come prepared.
                  </p>
                  <p>
                    <b>03</b>
                    <strong>Explore what's possible</strong>Make room for a
                    thoughtful conversation.
                  </p>
                </div>
              </section>
            </>
          ) : view === "book" && service ? (
            <BookFlow
              api={api}
              service={service}
              customer={customer}
              onAuth={auth}
              onBookings={() => navigate("bookings")}
              onDone={(b) => {
                setDetail({ id: b.id, initial: b });
                navigate("detail");
              }}
              onBack={() => navigate("home")}
            />
          ) : view === "bookings" ? (
            <MyBookings
              api={api}
              onAuth={auth}
              onSelect={(id) => {
                setDetail({ id });
                navigate("detail");
              }}
              onBrowse={() => navigate("home")}
            />
          ) : view === "detail" && detail ? (
            <BookingDetail
              key={detail.id}
              api={api}
              {...detail}
              services={services.value || []}
              onAuth={auth}
              onBack={() => navigate("bookings")}
            />
          ) : null}
        </div>
        {authOpen && (
          <Auth
            api={api}
            onSuccess={signedIn}
            onBack={() => {
              setAuthOpen(false);
              afterAuth.current = null;
            }}
          />
        )}
      </main>
      <footer>
        <span className="wordmark">atelier</span>
        <p>Space for better living.</p>
        <span className="footer-note">Personal home-design consultations</span>
      </footer>
    </>
  );
}
