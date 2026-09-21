import type { UpdateCheckInConfigBody } from "@/types/check-in";
import { apiRequest, type ApiRequestOptions } from "../client";

export const checkInApi = {
  getConfig(classId?: string | null, options?: ApiRequestOptions) {
    return apiRequest("/check-in", {
      ...options,
      query: { classId },
    });
  },
  updateConfig(data: UpdateCheckInConfigBody, options?: ApiRequestOptions) {
    return apiRequest("/check-in", {
      ...options,
      method: "POST",
      json: data,
    });
  },
};
