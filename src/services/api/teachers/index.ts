import { apiRequest, type ApiRequestOptions } from "../client";

export const teachersApi = {
  list(options?: ApiRequestOptions) {
    return apiRequest("/teachers", options);
  },
  get(id: string, options?: ApiRequestOptions) {
    return apiRequest("/teachers", {
      ...options,
      query: { id },
    });
  },
  save(data: { id?: string; name: string }, options?: ApiRequestOptions) {
    return apiRequest("/teachers", {
      ...options,
      method: data.id ? "PATCH" : "POST",
      json: data,
    });
  },
  remove(id: string, options?: ApiRequestOptions) {
    return apiRequest("/teachers", {
      ...options,
      method: "DELETE",
      query: { id },
    });
  },
};
