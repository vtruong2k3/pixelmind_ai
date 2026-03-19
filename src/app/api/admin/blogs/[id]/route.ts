import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateBlogSchema } from "@/lib/schemas/blog";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/blogs/:id  — lấy 1 bài (kèm content)
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: { select: { name: true, image: true, email: true } } },
    });
    if (!post) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

    return NextResponse.json(post);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/admin/blogs/:id
export async function PUT(req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body   = await req.json();
    const parsed = updateBlogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, slug, excerpt, content, coverImage, published } = parsed.data;

    // Slug uniqueness (bỏ qua chính nó)
    if (slug) {
      const dup = await prisma.post.findFirst({ where: { slug, NOT: { id } } });
      if (dup) return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 400 });
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(title      !== undefined && { title }),
        ...(slug       !== undefined && { slug }),
        ...(content    !== undefined && { content }),
        ...(published  !== undefined && { published }),
        excerpt:    excerpt    !== undefined ? (excerpt    || null) : undefined,
        coverImage: coverImage !== undefined ? (coverImage || null) : undefined,
      },
      include: { author: { select: { name: true, image: true, email: true } } },
    });

    return NextResponse.json({ blog: updated });
  } catch (err: any) {
    console.error("[ADMIN_BLOGS_PUT]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/blogs/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role === "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[ADMIN_BLOGS_DELETE]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
