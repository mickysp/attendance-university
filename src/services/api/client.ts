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
export function apiRequest(
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

  return fetch(`/api${path}${search ? `?${search}` : ""}`, {
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
}
