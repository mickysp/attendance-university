import { apiRequest, type ApiRequestOptions } from "../client";

export const majorsApi = {
  list(options?: ApiRequestOptions) {
    return apiRequest("/majors", options);
  },
};
