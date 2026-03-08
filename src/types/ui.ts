// =============================================
// UI-specific types — Studio page
// =============================================
import type { JobQuality, JobOrientation } from "./index";

export type { JobQuality, JobOrientation };

/** File đã upload, chứa preview URL (object URL) */
export interface UploadedFile {
  file: File;
  preview: string; // URL.createObjectURL(file)
}

/** Kết quả ảnh đã tạo (1 lần generate = 1 ResultItem) */
export interface ResultItem {
  id: string;
  outputUrl: string;
  featureName: string;
  featureSlug: string;
  createdAt: Date;
}

/** Preset kích thước ảnh */
export interface SizePreset {
  label: string;
  w: number;
  h: number;
  orientation: JobOrientation;
}

/** Định nghĩa 1 tính năng AI (dùng phía UI, gọn hơn Feature trong DB) */
export interface AIFeature {
  slug: string;
  name: string;
  desc: string;
  category: "fashion" | "creative" | "photo_edit";
  credits: number;
  imageCount: 0 | 1 | 2;
}

/** Category để lọc tính năng */
export interface FeatureCategory {
  id: string;
  label: string;
}

/** Payload gửi lên API /api/generate */
export interface GeneratePayload {
  featureSlug: string;
  prompt: string;
  quality: JobQuality;
  orientation: JobOrientation;
  width: number;
  height: number;
  isPublic: boolean;
  image: File;
  image_2?: File;
}

/** API response từ /api/generate */
export interface GenerateAPIResponse {
  jobId: string;
  outputUrl: string;
  error?: string;
}

// =============================================
// Home page types
// =============================================

export interface NewsCard {
  date: string;
  title: string;
  gradient: string;
  featured: boolean;
}

export interface FitCard {
  tag: string;
  labels: string[];
  desc: string;
  links: string[];
  cta: string;
}

export interface GalleryStripeItem {
  gradient: string;
  label: string;
}
