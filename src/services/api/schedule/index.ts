import type { CreateScheduleBody } from "@/types/schedule";
import { apiRequest, type ApiRequestOptions } from "../client";

export const scheduleApi = {
  get(classId: string, options?: ApiRequestOptions) {
    return apiRequest("/schedule", {
      ...options,
      query: { classId },
    });
  },
  create(data: CreateScheduleBody, options?: ApiRequestOptions) {
    return apiRequest("/schedule", {
      ...options,
      method: "POST",
      json: data,
    });
  },
};
