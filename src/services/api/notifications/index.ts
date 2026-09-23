import { apiRequest, type ApiRequestOptions } from "@/services/api/client";
import type { NotificationPreferences } from "@/types/notifications";

export const notificationsApi = {
  list(options: ApiRequestOptions = {}) {
    return apiRequest("/notifications", { ...options, credentials: "include" });
  },
  markAllRead(options: ApiRequestOptions = {}) {
    return apiRequest("/notifications", {
      ...options,
      method: "PATCH",
      credentials: "include",
      json: { action: "mark-all-read" },
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
