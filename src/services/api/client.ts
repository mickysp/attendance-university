export type ApiRequestOptions = Pick<
  RequestInit,
  "signal" | "cache" | "credentials"
>;

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = ApiRequestOptions & {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: QueryParams;
  json?: unknown;
  body?: FormData;
};

/** Return the original Response so callers can handle HTTP errors and bodies. */
export async function apiRequest(
  path: `/${string}`,
  { query, json, body, ...options }: RequestOptions = {},
): Promise<Response> {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }

  const search = params.toString();

  const response = await fetch(`/api${path}${search ? `?${search}` : ""}`, {
    ...options,
    ...(json !== undefined
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        }
      : body !== undefined
        ? { body }
        : {}),
  });
  if (response.status === 401 && typeof window !== "undefined") {
    const data = await response
      .clone()
      .json()
      .catch(() => null);
    if (data?.reason) {
      window.dispatchEvent(
        new CustomEvent("session-invalid", { detail: data.reason }),
      );
    }
  }
  return response;
}
