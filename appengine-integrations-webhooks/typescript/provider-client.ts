export type ClientOptions = {
  origin: string;
  organization: string;
  staffToken: string;
  configId: string;
};
export type ProviderEvent = {
  id: string;
  type: string;
  livemode: boolean;
  created: number;
  data: { object: Record<string, unknown> };
};
export function integrationClient(options: ClientOptions) {
  const request = async <T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> => {
    const r = await fetch(options.origin.replace(/\/$/, "") + path, {
      method,
      headers: {
        orgid: options.organization,
        authorization: `Bearer ${options.staffToken}`,
        "content-type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!r.ok) throw Error(`AppEngine returned ${r.status}`);
    return r.json() as Promise<T>;
  };
  const call = <T>(operation: string, data: unknown = {}) =>
    request<T>(
      "POST",
      "/upstream/call/StripeProvider/" + encodeURIComponent(operation),
      { configId: options.configId, data }
    );
  return {
    discover: (provider: string) =>
      request<unknown>(
        "GET",
        "/upstream/integration-types/" + encodeURIComponent(provider)
      ),
    test: () =>
      call<{ success: boolean; livemode: boolean; message: string }>("test"),
    async *paymentEvents(createdGte: number): AsyncGenerator<ProviderEvent> {
      let startingAfter: string | undefined;
      for (;;) {
        const page = await call<{ data: ProviderEvent[]; hasMore: boolean }>(
          "listEvents",
          {
            types: ["payment_intent.succeeded"],
            createdGte,
            limit: 50,
            ...(startingAfter ? { startingAfter } : {}),
          }
        );
        yield* page.data;
        if (!page.hasMore) break;
        const next = page.data.at(-1)?.id;
        if (!next || next === startingAfter)
          throw Error("Invalid event pagination cursor");
        startingAfter = next;
      }
    },
  };
}
