// Every business action uses the current staff identity and organization.
export class AppEngineError extends Error {
  constructor(status, body) {
    super(`${status} · ${body.message || body.error || "Request failed"}`);
    this.status = status;
    this.body = body;
  }
}
export function createApi(getSession, onResult = () => {}) {
  return async function request(method, path, body) {
    const session = getSession();
    if (!session)
      throw new Error("Sign in with your authorized staff account first.");
    const response = await fetch("/api" + path, {
      method,
      headers: {
        orgid: session.org,
        Authorization: "Bearer " + session.token,
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = await response.json();
    onResult({ method, path, status: response.status, result });
    if (!response.ok) throw new AppEngineError(response.status, result);
    return result;
  };
}
