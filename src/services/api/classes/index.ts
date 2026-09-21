import type { IncomingClass } from "@/types/classes";
import { apiRequest, type ApiRequestOptions } from "../client";

export const classesApi = {
  list(query: { year?: number } = {}, options?: ApiRequestOptions) {
    return apiRequest("/classes", {
      ...options,
      query,
    });
  },
  get(id: string, options?: ApiRequestOptions) {
    return apiRequest(`/classes/${encodeURIComponent(id)}`, options);
  },
  create(data: IncomingClass[], options?: ApiRequestOptions) {
    return apiRequest("/classes/create", {
      ...options,
      method: "POST",
      json: data,
    });
  },
  update(id: string, data: IncomingClass, options?: ApiRequestOptions) {
    return apiRequest("/classes/update", {
      ...options,
      method: "PUT",
      query: { id },
      json: data,
    });
  },
  remove(id: string, options?: ApiRequestOptions) {
    return apiRequest("/classes/delete", {
      ...options,
      method: "DELETE",
      query: { id },
    });
  },
};
