import type { CheckInFormData } from "@/types/check-in";
import { apiRequest, type ApiRequestOptions } from "../client";

export type SubmitAttendanceRequest = CheckInFormData & {
  classId: string;
  name: string;
};

export const attendanceApi = {
  submit(data: SubmitAttendanceRequest, options?: ApiRequestOptions) {
    return apiRequest("/attendance", {
      ...options,
      method: "POST",
      json: data,
    });
  },
  summary(query: { classId: string; year: number | null }, options?: ApiRequestOptions) {
    return apiRequest("/attendance/summary", {
      ...options,
      query,
    });
  },
  logs(query: { classId: string; studentId: string }, options?: ApiRequestOptions) {
    return apiRequest("/attendance/logs", {
      ...options,
      query,
    });
  },
};
