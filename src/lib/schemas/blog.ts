// src/lib/schemas/blog.ts
import { z } from "zod";

export const blogFormSchema = z.object({
  title: z
    .string()
    .min(3, "Tiêu đề phải ít nhất 3 ký tự")
    .max(200, "Tiêu đề tối đa 200 ký tự"),

  slug: z
    .string()
    .min(2, "Slug phải ít nhất 2 ký tự")
    .max(200, "Slug tối đa 200 ký tự")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang"),

  excerpt: z
    .string()
    .max(500, "Tóm tắt tối đa 500 ký tự")
    .optional()
    .or(z.literal("")),

  content: z
    .string()
    .min(10, "Nội dung phải ít nhất 10 ký tự"),

  coverImage: z
    .string()
    .optional()
    .or(z.literal("")),

  published: z.boolean(),
});

export type BlogFormValues = z.infer<typeof blogFormSchema>;

// Schema cho API request body
export const createBlogSchema = blogFormSchema;
export const updateBlogSchema = blogFormSchema.partial().extend({
  title: z.string().min(3).max(200),
  slug:  z.string().min(2).max(200),
  content: z.string().min(10),
  published: z.boolean(),
});
