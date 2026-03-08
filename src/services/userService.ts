// src/services/userService.ts
// User-facing API calls: profile, history, credits

import api from "./api";

// ─── Types ────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  credits: number;
  plan: string;
  planExpiresAt: string | null;
  createdAt: string;
}

export interface UserDashboardData {
  user: UserProfile;
  stats: {
    totalJobs: number;
    totalCreditsUsed: number;
    jobsThisMonth: number;
    creditsThisMonth: number;
  };
  recentJobs: {
    id: string;
    featureName: string;
    status: string;
    quality: string;
    creditUsed: number;
    outputUrl: string | null;
    createdAt: string;
  }[];
  recentTransactions: {
    id: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
  }[];
}

export interface HistoryItem {
  id: string;
  featureName: string;
  featureSlug: string;
  status: string;
  quality: string;
  creditUsed: number;
  outputUrl: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface HistoryResponse {
  jobs: HistoryItem[];
  cursor?: string;
  hasMore: boolean;
}

export interface CreditTx {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  jobId: string | null;
}

// ─── Service methods ──────────────────────────────────────────

export const userService = {
  /** Lấy dữ liệu dashboard với TanStack Query key: ["user-dashboard"] */
  async getDashboard(): Promise<UserDashboardData> {
    const { data } = await api.get<UserDashboardData>("/user/dashboard");
    return data;
  },

  /** Profile thông tin cá nhân */
  async getProfile(): Promise<UserProfile> {
    const { data } = await api.get<UserProfile>("/profile");
    return data;
  },

  async updateProfile(payload: { name?: string }): Promise<UserProfile> {
    const { data } = await api.patch<UserProfile>("/profile", payload);
    return data;
  },

  /** Lịch sử tạo ảnh (infinite scroll) */
  async getHistory(params?: {
    cursor?: string;
    limit?: number;
    feature?: string;
  }): Promise<HistoryResponse> {
    const { data } = await api.get<HistoryResponse>("/history", { params });
    return data;
  },

  /** Lịch sử giao dịch credits */
  async getCreditHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ transactions: CreditTx[]; total: number; totalPages: number }> {
    const { data } = await api.get("/user/credits", { params });
    return data;
  },
};
