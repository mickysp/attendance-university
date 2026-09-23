import { apiRequest, type ApiRequestOptions } from "@/services/api/client";

type DashboardQuery = { year: number };

export const dashboardApi = {
  overview(query: DashboardQuery, options?: ApiRequestOptions) {
    return apiRequest("/dashboard/overview", { ...options, query });
  },
  ranking(query: DashboardQuery, options?: ApiRequestOptions) {
    return apiRequest("/dashboard/ranking", { ...options, query });
  },
  weekly(query: DashboardQuery, options?: ApiRequestOptions) {
    return apiRequest("/dashboard/weekly", { ...options, query });
  },
};
