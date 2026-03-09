// src/services/adminService.ts
// Admin-level API calls: full system management

import api from "./api";

// ─── Types ────────────────────────────────────────────────────

export interface AdminOverview {
  overview: {
    totalUsers:        number;
    totalJobs:         number;
    newUsersThisMonth: number;
    newJobsThisMonth:  number;
    totalRevenueUSD:   number;
    monthRevenueUSD:   number;
    todayRevenueUSD:   number;
  };
  jobStatus:         Record<string, number>;
  planDistribution:  { plan: string; count: number }[];
  featureUsage:      { slug: string; name: string; count: number }[];
  chartDays:         { date: string; label: string; users: number; jobs: number; credits: number; revenue: number }[];
  todayNewUsers:     { id: string; name: string | null; email: string; image: string | null; plan: string; createdAt: string }[];
  recentPurchases:   { id: string; plan: string; credits: number; description: string; createdAt: string; user: { id: string; name: string | null; email: string; image: string | null; plan: string } }[];
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  credits: number;
  plan: string;
  planExpiresAt: string | null;
  createdAt: string;
  _count?: { jobs: number; creditTransactions: number };
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminJob {
  id: string;
  featureName: string;
  featureSlug: string;
  status: string;
  quality: string;
  creditUsed: number;
  outputUrl: string | null;
  errorMsg: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

export interface AdminJobsResponse {
  jobs: AdminJob[];
  total: number;
  page: number;
  totalPages: number;
  statusSummary: Record<string, number>;
}

export interface AdminTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  jobId: string | null;
  user: { id: string; name: string | null; email: string; image: string | null };
}

export interface AdminTransactionsResponse {
  transactions: AdminTransaction[];
  total: number;
  page: number;
  totalPages: number;
  summary: {
    totalPurchased: number; purchaseCount: number;
    totalSpent: number; spendCount: number;
    totalEarned: number; earnCount: number;
    totalBonus: number; bonusCount: number;
  };
}

export interface AdminFeature {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string | null;
  prompt: string;
  category: string;
  imageCount: number;
  sortOrder: number;
  isActive: boolean;
  creditCost: number;
  createdAt: string;
  updatedAt: string;
  _count?: { jobs: number };
}

export interface AdminBlog {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  published: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: { name: string | null; email: string; image: string | null };
}

export interface AdminBlogsResponse {
  blogs: AdminBlog[];
  total: number;
  page: number;
  totalPages: number;
}


// ─── Service Methods ──────────────────────────────────────────

export const adminService = {
  /** Dashboard overview data */
  async getOverview(): Promise<AdminOverview> {
    const { data } = await api.get<AdminOverview>("/admin/stats");
    return data;
  },

  /** Users */
  async getUsers(params?: {
    page?: number; limit?: number; search?: string; role?: string; plan?: string; order?: string;
  }): Promise<AdminUsersResponse> {
    const { data } = await api.get<AdminUsersResponse>("/admin/users", { params });
    return data;
  },

  async getUser(id: string) {
    const { data } = await api.get(`/admin/users/${id}`);
    return data;
  },

  async updateUser(id: string, payload: { role?: string; credits?: number; creditAmount?: number; creditDescription?: string; plan?: string; planExpiresAt?: string | null }) {
    const { data } = await api.patch(`/admin/users/${id}`, payload);
    return data;
  },

  async deleteUser(id: string) {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  },

  /** Jobs */
  async getJobs(params?: {
    page?: number; limit?: number; status?: string; quality?: string; search?: string; order?: string;
  }): Promise<AdminJobsResponse> {
    const { data } = await api.get<AdminJobsResponse>("/admin/jobs", { params });
    return data;
  },

  async deleteJob(jobId: string) {
    const { data } = await api.delete("/admin/jobs", { data: { jobId } });
    return data;
  },

  async syncJobs(maxJobs = 20): Promise<{ message: string; stats: Record<string, number>; results: { id: string; oldStatus: string; newStatus: string }[] }> {
    const { data } = await api.post("/admin/jobs/sync", { maxJobs });
    return data;
  },


  /** Credits */
  async getTransactions(params?: {
    page?: number; limit?: number; type?: string; search?: string; order?: string;
  }): Promise<AdminTransactionsResponse> {
    const { data } = await api.get<AdminTransactionsResponse>("/admin/credits", { params });
    return data;
  },

  async giftCredits(userId: string, amount: number, description: string) {
    const { data } = await api.post("/admin/credits", { userId, amount, description });
    return data;
  },

  /** Features */
  async getFeatures(): Promise<AdminFeature[]> {
    const { data } = await api.get<{ features: AdminFeature[] }>("/admin/features");
    return data.features;
  },

  async updateFeature(id: string, payload: Partial<AdminFeature>) {
    const { data } = await api.patch(`/admin/features/${id}`, payload);
    return data.feature;
  },

  async createFeature(payload: {
    slug: string; name: string; nameEn?: string; description?: string;
    prompt: string; category: string; imageCount?: number; creditCost?: number; sortOrder?: number;
  }): Promise<AdminFeature> {
    const { data } = await api.post<{ feature: AdminFeature }>("/admin/features", payload);
    return data.feature;
  },

  async deleteFeature(id: string) {
    const { data } = await api.delete(`/admin/features/${id}`);
    return data;
  },


  /** Search users (for credit gift modal) */
  async searchUsers(q: string): Promise<AdminUser[]> {
    const { data } = await api.get<AdminUsersResponse>("/admin/users", { params: { search: q, limit: 5 } });
    return data.users;
  },

  /** Blogs */
  async getBlogs(params?: {
    page?: number; limit?: number; search?: string;
  }): Promise<AdminBlogsResponse> {
    const { data } = await api.get<AdminBlogsResponse>("/admin/blogs", { params });
    return data;
  },

  async createBlog(payload: {
    title: string; slug: string; excerpt?: string; content: string; coverImage?: string; published?: boolean;
  }): Promise<AdminBlog> {
    const { data } = await api.post<{ blog: AdminBlog }>("/admin/blogs", payload);
    return data.blog;
  },

  async updateBlog(id: string, payload: Partial<AdminBlog>) {
    const { data } = await api.patch<{ blog: AdminBlog }>(`/admin/blogs/${id}`, payload);
    return data.blog;
  },

  async deleteBlog(id: string) {
    const { data } = await api.delete(`/admin/blogs/${id}`);
    return data;
  },
};
