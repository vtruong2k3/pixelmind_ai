import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { BlogDetail } from "@/types";

// GET /api/blogs/:slug
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const post = await prisma.post.findFirst({
      where: { slug, published: true },
      include: {
        author: { select: { name: true, image: true, email: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Bài viết không tồn tại" }, { status: 404 });
    }

    return NextResponse.json(post as unknown as BlogDetail);
  } catch (err: any) {
    console.error("[API_BLOGS_SLUG_GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
