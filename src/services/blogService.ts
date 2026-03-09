/**
 * src/services/blogService.ts
 * Service layer cho public blog endpoints.
 */
import api from "./api";
import type { BlogDetail, BlogListParams, BlogListResponse } from "@/types";

export async function fetchBlogs(params: BlogListParams = {}): Promise<BlogListResponse> {
  const { page = 1, limit = 9, search = "" } = params;
  const res = await api.get<BlogListResponse>("/blogs", {
    params: { page, limit, search: search || undefined },
  });
  return res.data;
}

export async function fetchBlogBySlug(slug: string): Promise<BlogDetail> {
  const res = await api.get<BlogDetail>(`/blogs/${slug}`);
  return res.data;
}
