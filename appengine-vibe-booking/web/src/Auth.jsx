import React, { useState } from "react";
export default function Auth({ api, onSuccess, onBack }) {
  const [mode, setMode] = useState("signin"),
    [pending, setPending] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
    setPending(null);
  }
  function accept(result) {
    if (result.kind === "challenge") {
      setPending(result);
      setMode("challenge");
    } else if (result.kind === "passwordChangeRequired") {
      setPending(result);
      setMode("password");
    } else onSuccess(result);
  }
  async function submit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const value = (k) => String(data.get(k) || "");
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "password") {
        if (value("newPassword") !== value("confirmPassword"))
          throw new Error("Your new passwords do not match.");
        await api.changePassword({
          password: value("password"),
          newPassword: value("newPassword"),
        });
        setMode("signin");
        setPending(null);
        setNotice(
          "Your password has been updated. Sign in with your new password.",
        );
      } else if (mode === "challenge")
        accept(
          await api.verifyChallenge({
            challengeToken: pending.challengeToken,
            code: value("code").trim(),
            rememberDevice: false,
          }),
        );
      else if (mode === "signup")
        accept(
          await api.signUp({
            email: value("email").trim(),
            password: value("password"),
            firstName: value("firstName").trim(),
            lastName: value("lastName").trim(),
          }),
        );
      else
        accept(
          await api.signIn({
            email: value("email").trim(),
            password: value("password"),
          }),
        );
    } catch (e) {
      setError(
        e?.message || "We could not complete that request. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const title = {
    signin: "Welcome back.",
    signup: "Make yourself at home.",
    challenge: "One more step.",
    password: "Choose a new password.",
  }[mode];
  const description = {
    signin:
      "Sign in to choose your appointment and keep the details in one place.",
    signup: "Create your customer account to book a consultation.",
    challenge:
      pending?.message || "Enter your verification code to finish signing in.",
    password: pending?.message || "Update your temporary password to continue.",
  }[mode];
  return (
    <section className="auth-layout">
      <div className="auth-story">
        <span className="eyebrow">A space that's yours</span>
        <h1>
          Good design begins
          <br />
          with a conversation.
        </h1>
        <p>
          A personal consultation. A fresh perspective.
          <br />A little room for something new.
        </p>
        <img
          className="auth-photo"
          src="/images/atelier-living-room.png"
          alt="A warm living room with natural materials and a sculptural sofa"
        />
      </div>
      <form className="form-card" key={mode} onSubmit={submit}>
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={onBack}
        >
          ← Back
        </button>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
        {notice && (
          <p className="form-notice" role="status">
            {notice}
          </p>
        )}
        {mode === "signin" || mode === "signup" ? (
          <>
            {mode === "signup" && (
              <div className="name-fields">
                <label>
                  First name
                  <input autoComplete="given-name" name="firstName" required />
                </label>
                <label>
                  Last name
                  <input autoComplete="family-name" name="lastName" required />
                </label>
              </div>
            )}
            <label>
              Email address
              <input
                autoComplete="username"
                type="email"
                name="email"
                required
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                type="password"
                name="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
              />
            </label>
          </>
        ) : mode === "challenge" ? (
          <label>
            Verification code
            <input
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              required
              autoFocus
            />
          </label>
        ) : (
          <>
            <label>
              Current password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              New password
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary wide" disabled={busy}>
          {busy
            ? "Please wait…"
            : {
                signin: "Sign in",
                signup: "Create account",
                challenge: "Verify and continue",
                password: "Update password",
              }[mode]}{" "}
          <span aria-hidden="true">↗</span>
        </button>
        <div className="auth-switch">
          {mode === "signin" ? (
            <>
              New to Atelier?{" "}
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => switchMode("signup")}
              >
                Create an account
              </button>
            </>
          ) : mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => switchMode("signin")}
              >
                Sign in
              </button>
            </>
          ) : (
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => switchMode("signin")}
            >
              Start sign-in again
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
