// src/__tests__/blog-schema.test.ts
// Unit tests for Zod blogFormSchema validation

import { describe, it, expect } from "vitest";
import { blogFormSchema } from "@/lib/schemas/blog";

describe("blogFormSchema", () => {
  const valid = {
    title: "Bài viết hay",
    slug: "bai-viet-hay",
    content: "Nội dung đầy đủ ít nhất 10 ký tự",
    excerpt: "Tóm tắt ngắn",
    coverImage: "https://example.com/img.jpg",
    published: false,
  };

  it("✅ validates a complete form", () => {
    const result = blogFormSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("✅ defaults: excerpt and coverImage default to empty string", () => {
    const result = blogFormSchema.safeParse({
      title: "Test title",
      slug: "test-title",
      content: "Nội dung đủ dài nhé!",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.excerpt).toBe("");
      expect(result.data.coverImage).toBe("");
      expect(result.data.published).toBe(false);
    }
  });

  it("❌ fails if title < 3 chars", () => {
    const result = blogFormSchema.safeParse({ ...valid, title: "Ab" });
    expect(result.success).toBe(false);
  });

  it("❌ fails if slug has invalid characters", () => {
    const result = blogFormSchema.safeParse({ ...valid, slug: "HELLO WORLD" });
    expect(result.success).toBe(false);
  });

  it("❌ fails if content < 10 chars", () => {
    const result = blogFormSchema.safeParse({ ...valid, content: "Short" });
    expect(result.success).toBe(false);
  });

  it("❌ fails if excerpt > 500 chars", () => {
    const result = blogFormSchema.safeParse({ ...valid, excerpt: "x".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("✅ accepts published = true", () => {
    const result = blogFormSchema.safeParse({ ...valid, published: true });
    expect(result.success).toBe(true);
  });
});
