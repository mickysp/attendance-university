import { apiRequest, type ApiRequestOptions } from "../client";
import type {
  UpdateStudentRequest,
  UploadStudentsRequest,
  WithdrawCourseRequest,
} from "@/types/students";

export const studentsApi = {
  list(query: { year?: number } = {}, options?: ApiRequestOptions) {
    return apiRequest("/students", {
      ...options,
      query,
    });
  },
  upload(data: UploadStudentsRequest, options?: ApiRequestOptions) {
    return apiRequest("/students/upload", {
      ...options,
      method: "POST",
      json: data,
    });
  },
  uploadFile(data: FormData, options?: ApiRequestOptions) {
    return apiRequest("/students/upload-file", {
      ...options,
      method: "POST",
      body: data,
    });
  },
  update(data: UpdateStudentRequest, options?: ApiRequestOptions) {
    return apiRequest("/students/update", {
      ...options,
      method: "PUT",
      json: data,
    });
  },
  remove(id: string, options?: ApiRequestOptions) {
    return apiRequest("/students/delete", {
      ...options,
      method: "DELETE",
      query: { id },
    });
  },
  withdrawCourse(query: WithdrawCourseRequest, options?: ApiRequestOptions) {
    return apiRequest("/students/withdraw-course", {
      ...options,
      method: "DELETE",
      query: { ...query },
    });
  },
};
