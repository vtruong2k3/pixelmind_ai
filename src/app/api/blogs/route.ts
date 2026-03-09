import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { BlogListResponse } from "@/types";

// GET /api/blogs?page=1&limit=9&search=
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "9",  10));
    const search = searchParams.get("search")?.trim() ?? "";
    const skip   = (page - 1) * limit;

    const where = {
      published: true,
      ...(search
        ? {
            OR: [
              { title:   { contains: search, mode: "insensitive" as const } },
              { excerpt: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id:         true,
          slug:       true,
          title:      true,
          excerpt:    true,
          coverImage: true,
          published:  true,
          createdAt:  true,
          updatedAt:  true,
          author: {
            select: { name: true, image: true, email: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const response: BlogListResponse = {
      blogs:      posts as any,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[API_BLOGS_GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
