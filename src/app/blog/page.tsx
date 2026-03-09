import type { Metadata } from "next";
import BlogHero from "@/components/blog/BlogHero";
import BlogListClient from "@/components/blog/BlogListClient";

export const metadata: Metadata = {
  title: "Blog — PixelMind AI",
  description:
    "Hướng dẫn, tips & tricks và cập nhật mới nhất về AI sáng tạo từ PixelMind AI Studio.",
  openGraph: {
    title: "Blog — PixelMind AI",
    description: "Khám phá thế giới AI sáng tạo cùng PixelMind",
    type: "website",
  },
};

export default function BlogPage() {
  return (
    <main>
      <BlogHero />
      <BlogListClient />
    </main>
  );
}
