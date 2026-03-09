import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createBlogSchema } from "@/lib/schemas/blog";

// GET /api/admin/blogs?page=1&limit=10&search=
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role === "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit  = Math.min(50, parseInt(searchParams.get("limit") ?? "10", 10));
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status") ?? ""; // "published" | "draft" | ""
    const skip   = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (search) {
      where.OR = [
        { title:   { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { slug:    { contains: search, mode: "insensitive" } },
      ];
    }
    if (status === "published") where.published = true;
    if (status === "draft")     where.published = false;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          author: { select: { name: true, image: true, email: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      blogs:      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("[ADMIN_BLOGS_GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/blogs
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role === "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createBlogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, slug, excerpt, content, coverImage, published } = parsed.data;

    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug này đã tồn tại" }, { status: 400 });
    }

    const blog = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt:     excerpt    || null,
        content,
        coverImage:  coverImage || null,
        published:   published  ?? false,
        authorId:    session.user.id!,
      },
      include: {
        author: { select: { name: true, image: true, email: true } },
      },
    });

    return NextResponse.json({ blog }, { status: 201 });
  } catch (err: any) {
    console.error("[ADMIN_BLOGS_POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
