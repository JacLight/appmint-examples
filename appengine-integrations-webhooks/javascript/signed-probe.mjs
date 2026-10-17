import crypto from "node:crypto";
/** Local verification probe only; not a provider resend. Keep exact bytes. */
export function stripeTestSignature(
  raw,
  secret,
  timestamp = Math.floor(Date.now() / 1000)
) {
  const digest = crypto
    .createHmac("sha256", secret)
    .update(String(timestamp) + ".")
    .update(raw)
    .digest("hex");
  return `t=${timestamp},v1=${digest}`;
}
export async function sendSignedProbe({ apiOrigin, org, raw, secret }) {
  const r = await fetch(new URL("/connect/webhook/stripe", apiOrigin), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      orgid: org,
      "stripe-signature": stripeTestSignature(raw, secret),
    },
    body: raw,
  });
  return { status: r.status, body: await r.text() };
}
