// =============================================
// Role types
// =============================================
export type { UserRole } from "@/lib/roles";

// =============================================
// Feature types
// =============================================
export interface Feature {
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
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// Job types
// =============================================
export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
export type JobQuality = "sd" | "hd";
export type JobOrientation = "portrait" | "landscape" | "square";

export interface Job {
  id: string;
  userId: string;
  featureId: string;
  featureSlug: string;
  featureName: string;
  promptUsed: string;
  inputUrls: string[];
  outputUrl: string | null;
  quality: JobQuality;
  width: number;
  height: number;
  orientation: JobOrientation;
  status: JobStatus;
  errorMsg: string | null;
  creditUsed: number;
  isPublic: boolean;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// API Request / Response types
// =============================================
export interface GenerateRequest {
  featureSlug: string;
  quality?: JobQuality;
  orientation?: JobOrientation;
  isPublic?: boolean;
  // Files sẽ được upload qua FormData
}

export interface GenerateResponse {
  success: boolean;
  jobId?: string;
  outputUrl?: string;
  error?: string;
  creditRemaining?: number;
}

// =============================================
// History types
// =============================================
export interface HistoryItem {
  id: string;
  featureSlug: string;
  featureName: string;
  outputUrl: string;
  inputUrls: string[];
  quality: JobQuality;
  status: JobStatus;
  isPublic: boolean;
  creditUsed: number;
  createdAt: Date;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

// =============================================
// Gallery types
// =============================================
export interface GalleryItem {
  id: string;
  featureSlug: string;
  featureName: string;
  outputUrl: string;
  userName: string | null;
  userImage: string | null;
  createdAt: Date;
}

export interface GalleryResponse {
  items: GalleryItem[];
  total: number;
  cursor?: string;
}

// =============================================
// User types
// =============================================
export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  credits: number;
  plan: string;
}
// =============================================
// Dashboard types
// =============================================
export interface DashboardStats {
  totalJobs: number;
  totalCreditsUsed: number;
  jobsThisMonth: number;
  creditsThisMonth: number;
}

export interface FeatureUsage {
  featureSlug: string;
  featureName: string;
  _count: number;
}

export interface DashboardData {
  user: UserProfile & { planExpiresAt: string | null; createdAt: Date };
  stats: DashboardStats;
  usageByFeature: FeatureUsage[];
  recentJobs: HistoryItem[];
  recentTransactions: { id: string; amount: number; type: string; description: string; createdAt: Date }[];
}

// =============================================
// Blog / Post types
// =============================================
export interface BlogAuthor {
  name:  string | null;
  image: string | null;
  email: string;
}

/** Dùng trong list page — không kèm content đầy đủ */
export interface Blog {
  id:         string;
  slug:       string;
  title:      string;
  excerpt:    string | null;
  coverImage: string | null;
  published:  boolean;
  author:     BlogAuthor;
  createdAt:  string;   // ISO string từ API
  updatedAt:  string;
}

/** Dùng trong detail page — kèm đầy đủ content */
export interface BlogDetail extends Blog {
  content: string;
}

export interface BlogListParams {
  page?:   number;
  limit?:  number;
  search?: string;
}

export interface BlogListResponse {
  blogs:      Blog[];
  total:      number;
  page:       number;
  totalPages: number;
}
