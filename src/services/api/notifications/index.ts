import { apiRequest, type ApiRequestOptions } from "@/services/api/client";
import type {
  NotificationFilter,
  NotificationPreferences,
} from "@/types/notifications";

export const notificationsApi = {
  list(
    options: ApiRequestOptions = {},
    query: { status?: NotificationFilter; page?: number } = {},
  ) {
    return apiRequest("/notifications", {
      ...options,
      credentials: "include",
      query,
    });
  },
  markRead(id: string, options: ApiRequestOptions = {}) {
    return apiRequest("/notifications", {
      ...options,
      method: "PATCH",
      credentials: "include",
      json: { action: "mark-read", id },
    });
  },
  markAllRead(readThrough: string, options: ApiRequestOptions = {}) {
    return apiRequest("/notifications", {
      ...options,
      method: "PATCH",
      credentials: "include",
      json: { action: "mark-all-read", readThrough },
    });
  },
  updateSettings(
    settings: NotificationPreferences,
    options: ApiRequestOptions = {},
  ) {
    return apiRequest("/notifications", {
      ...options,
      method: "PATCH",
      credentials: "include",
      json: { action: "update-settings", settings },
    });
  },
};
