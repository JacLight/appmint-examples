// This small training adapter covers an already verified staff account.
// Challenge-capable production authentication is linked in the course.
import { AppEngineError } from "./api.mjs";
export async function signInStaff({ org, email, password }) {
  const response = await fetch("/api/profile/user/signin", {
    method: "POST",
    headers: { orgid: org, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const result = await response.json();
  if (!response.ok) throw new AppEngineError(response.status, result);
  if (!result.token)
    throw new Error(
      "Complete the supported sign-in challenge in the Authentication lesson before using this checkpoint."
    );
  return { org, token: result.token };
}
