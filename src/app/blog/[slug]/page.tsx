import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import BlogDetailClient from "@/components/blog/BlogDetailClient";
import BlogRelated from "@/components/blog/BlogRelated";

type Props = { params: Promise<{ slug: string }> };

// Tạo static metadata từ DB (SSR)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findFirst({
    where: { slug, published: true },
    select: { title: true, excerpt: true, coverImage: true },
  });

  if (!post) {
    return { title: "Bài viết không tồn tại — PixelMind AI" };
  }

  return {
    title: `${post.title} — PixelMind AI`,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [post.coverImage] : [],
      type: "article",
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  return (
    <main>
      <BlogDetailClient slug={slug} />
      <BlogRelated currentSlug={slug} />
    </main>
  );
}
