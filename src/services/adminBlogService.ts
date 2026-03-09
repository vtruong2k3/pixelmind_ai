/**
 * src/services/adminBlogService.ts
 * Service layer cho admin blog management.
 * Data fetching dùng axios base instance, tất cả types được import từ @/types.
 */
import api from "./api";
import type { Blog, BlogDetail, BlogListResponse, BlogListParams } from "@/types";
import type { BlogFormValues } from "@/lib/schemas/blog";

// ── Extended types cho admin ──────────────────────────────────────────────────

export interface AdminBlogListParams extends BlogListParams {
  status?: "published" | "draft" | "";
}

// ── API functions ─────────────────────────────────────────────────────────────

/** Lấy danh sách blogs (admin — lấy cả draft) */
export async function adminFetchBlogs(
  params: AdminBlogListParams = {}
): Promise<BlogListResponse> {
  const { page = 1, limit = 10, search = "", status = "" } = params;
  const res = await api.get<BlogListResponse>("/admin/blogs", {
    params: {
      page,
      limit,
      search:  search  || undefined,
      status:  status  || undefined,
    },
  });
  return res.data;
}

/** Lấy chi tiết 1 blog theo ID (admin) */
export async function adminFetchBlogById(id: string): Promise<BlogDetail> {
  const res = await api.get<BlogDetail>(`/admin/blogs/${id}`);
  return res.data;
}

/** Tạo blog mới */
export async function adminCreateBlog(
  data: BlogFormValues
): Promise<{ blog: Blog }> {
  const res = await api.post<{ blog: Blog }>("/admin/blogs", data);
  return res.data;
}

/** Cập nhật blog */
export async function adminUpdateBlog(
  id: string,
  data: BlogFormValues
): Promise<{ blog: Blog }> {
  const res = await api.put<{ blog: Blog }>(`/admin/blogs/${id}`, data);
  return res.data;
}

/** Xóa blog */
export async function adminDeleteBlog(id: string): Promise<void> {
  await api.delete(`/admin/blogs/${id}`);
}

/** Upload ảnh bìa → trả về data URL */
export async function adminUploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await api.post<{ url: string }>("/admin/upload-image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url;
}
