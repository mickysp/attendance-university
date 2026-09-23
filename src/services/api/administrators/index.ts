import type {
  AdministratorRole,
  CreateAdministratorBody,
} from "@/types/administrators";
import { apiRequest, type ApiRequestOptions } from "../client";

export const administratorsApi = {
  list(options?: ApiRequestOptions) {
    return apiRequest("/administrators", {
      credentials: "include",
      cache: "no-store",
      ...options,
    });
  },
  create(data: CreateAdministratorBody, options?: ApiRequestOptions) {
    return apiRequest("/administrators", {
      credentials: "include",
      cache: "no-store",
      ...options,
      method: "POST",
      json: data,
    });
  },
  updateRole(id: string, role: AdministratorRole, options?: ApiRequestOptions) {
    return apiRequest("/administrators", {
      credentials: "include",
      cache: "no-store",
      ...options,
      method: "PATCH",
      json: { id, role },
    });
  },
  remove(id: string, options?: ApiRequestOptions) {
    return apiRequest("/administrators", {
      credentials: "include",
      cache: "no-store",
      ...options,
      method: "DELETE",
      json: { id },
    });
  },
};
