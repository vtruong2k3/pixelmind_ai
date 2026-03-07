// src/services/staffService.ts
// Staff-level API calls: xem jobs, tặng credits

import api from "./api";

export interface StaffStats {
  jobsToday: number;
  jobsThisWeek: number;
  activeUsers: number;
  creditsGiftedByMe: number;
  recentActivity: {
    type: "job" | "credit";
    description: string;
    time: string;
    user: string;
  }[];
}

export interface StaffJob {
  id: string;
  featureName: string;
  featureSlug: string;
  status: string;
  quality: string;
  creditUsed: number;
  outputUrl: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

export interface StaffJobsResponse {
  jobs: StaffJob[];
  total: number;
  page: number;
  totalPages: number;
  statusSummary: Record<string, number>;
}

export const staffService = {
  async getStats(): Promise<StaffStats> {
    const { data } = await api.get<StaffStats>("/staff/stats");
    return data;
  },

  async getJobs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    quality?: string;
    order?: "asc" | "desc";
  }): Promise<StaffJobsResponse> {
    const { data } = await api.get<StaffJobsResponse>("/staff/jobs", { params });
    return data;
  },

  /** Tặng credits cho user — max 500/lần với STAFF role */
  async giftCredits(payload: {
    userId: string;
    amount: number;
    description: string;
  }): Promise<{ ok: boolean; user: { name: string; email: string; credits: number } }> {
    const { data } = await api.post("/staff/credits", payload);
    return data;
  },
};
