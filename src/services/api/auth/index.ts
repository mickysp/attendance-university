import type {
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
  VerifyOtpBody,
} from "@/types/auth";
import { apiRequest, type ApiRequestOptions } from "../client";

export const authApi = {
  login(data: LoginBody, options?: ApiRequestOptions) {
    return apiRequest("/auth/login", {
      credentials: "include",
      ...options,
      method: "POST",
      json: data,
    });
  },
  register(data: RegisterBody, options?: ApiRequestOptions) {
    return apiRequest("/auth/register", {
      ...options,
      method: "POST",
      json: data,
    });
  },
  sendOtp(data: ForgotPasswordBody, options?: ApiRequestOptions) {
    return apiRequest("/auth/send-otp", {
      ...options,
      method: "POST",
      json: data,
    });
  },
  verifyOtp(data: VerifyOtpBody, options?: ApiRequestOptions) {
    return apiRequest("/auth/verify-otp", {
      ...options,
      method: "POST",
      json: data,
    });
  },
  resetPassword(data: ResetPasswordBody, options?: ApiRequestOptions) {
    return apiRequest("/auth/reset-password", {
      ...options,
      method: "POST",
      json: data,
    });
  },
  getUser(options?: ApiRequestOptions) {
    return apiRequest("/auth/user", {
      credentials: "include",
      ...options,
    });
  },
  logout(options?: ApiRequestOptions) {
    return apiRequest("/auth/logout", {
      credentials: "include",
      ...options,
      method: "POST",
    });
  },
};
