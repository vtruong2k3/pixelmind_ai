// src/services/adminService.ts
// Centralised API layer for all /admin pages — uses axios

import axios from "axios";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface AdminOverviewData {
  overview: {
    totalUsers: number;
    totalJobs: number;
    newUsersThisMonth: number;
    newJobsThisMonth: number;
    totalCreditsEarned: number;
    creditsEarnedAllTime: number;
  };
  jobStatus: {
    done: number;
    pending: number;
    processing: number;
    failed: number;
  };
  planDistribution: { plan: string; count: number }[];
  featureUsage: { slug: string; name: string; count: number }[];
  chartDays: {
    date: string;
    label: string;
    users: number;
    jobs: number;
    creditsEarned: number;
  }[];
  recentUsers: AdminUser[];
  recentJobs: AdminJob[];
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  credits: number;
  plan: string;
  planExpiresAt: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: { jobs: number; creditTransactions: number };
}

export interface AdminUserDetail extends AdminUser {
  jobs: AdminJob[];
  creditTransactions: AdminTransaction[];
}

export interface AdminJob {
  id: string;
  featureName: string;
  featureSlug: string;
  status: string;
  quality: string;
  creditUsed: number;
  width?: number;
  height?: number;
  orientation?: string;
  outputUrl?: string | null;
  errorMsg?: string | null;
  isPublic?: boolean;
  createdAt: string;
  user?: { id: string; name: string | null; email: string; image: string | null };
}

export interface AdminTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  jobId?: string | null;
  user?: { id: string; name: string | null; email: string; image: string | null };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminJobListResponse {
  jobs: AdminJob[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusSummary: { done: number; pending: number; processing: number; failed: number };
}

export interface AdminCreditListResponse {
  transactions: AdminTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    totalPurchased: number;
    purchaseCount: number;
    totalSpent: number;
    spendCount: number;
    totalEarned: number;
    earnCount: number;
    totalBonus: number;
    bonusCount: number;
  };
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface JobListParams {
  page?: number;
  limit?: number;
  status?: string;
  quality?: string;
  feature?: string;
  search?: string;
  order?: "asc" | "desc";
}

export interface CreditListParams {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  order?: "asc" | "desc";
}

export interface EditUserPayload {
  credits?: number;
  plan?: string;
  planExpiresAt?: string | null;
}

export interface AddCreditsPayload {
  userId: string;
  amount: number;
  description: string;
}

// ─────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────

const api = axios.create({ baseURL: "/api/admin" });

// ─────────────────────────────────────────
// Service
// ─────────────────────────────────────────

export const adminService = {
  // ── Stats / Overview ──────────────────
  /** Fetch full system statistics for the admin overview page */
  async getStats(): Promise<AdminOverviewData> {
    const { data } = await api.get<AdminOverviewData>("/stats");
    return data;
  },

  // ── Users ─────────────────────────────
  /** List users with pagination, search, plan filter, sort */
  async getUsers(params: UserListParams = {}): Promise<AdminUserListResponse> {
    const { data } = await api.get<AdminUserListResponse>("/users", { params });
    return data;
  },

  /** Get full detail of a single user (includes recent jobs & transactions) */
  async getUserById(id: string): Promise<AdminUserDetail> {
    const { data } = await api.get<{ user: AdminUserDetail }>(`/users/${id}`);
    return data.user;
  },

  /** Update a user's credits, plan, or planExpiresAt */
  async updateUser(id: string, payload: EditUserPayload): Promise<AdminUser> {
    const { data } = await api.patch<{ ok: boolean; user: AdminUser }>(`/users/${id}`, payload);
    return data.user;
  },

  /** Permanently delete a user account */
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  // ── Jobs ──────────────────────────────
  /** List jobs with pagination, status / quality / feature / user search */
  async getJobs(params: JobListParams = {}): Promise<AdminJobListResponse> {
    const { data } = await api.get<AdminJobListResponse>("/jobs", { params });
    return data;
  },

  // ── Credit Transactions ───────────────
  /** List credit transactions with pagination, type filter, user search */
  async getCredits(params: CreditListParams = {}): Promise<AdminCreditListResponse> {
    const { data } = await api.get<AdminCreditListResponse>("/credits", { params });
    return data;
  },

  /** Manually add (or subtract) credits for a user */
  async addCredits(payload: AddCreditsPayload): Promise<{ user: AdminUser; transaction: AdminTransaction }> {
    const { data } = await api.post<{ ok: boolean; user: AdminUser; transaction: AdminTransaction }>("/credits", payload);
    return data;
  },
};
