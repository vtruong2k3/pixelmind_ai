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
export type JobStatus = "pending" | "processing" | "done" | "failed";
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
