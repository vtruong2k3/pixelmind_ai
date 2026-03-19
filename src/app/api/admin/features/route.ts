import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";

// GET /api/admin/features
export async function GET() {
  const session = await auth();
  const guard   = requireRoleResponse(session?.user?.role, "ADMIN");
  if (guard) return guard;

  const features = await prisma.feature.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { jobs: true } } },
  });
  return NextResponse.json({ features });
}

// POST /api/admin/features — tạo feature mới
export async function POST(req: NextRequest) {
  const session = await auth();
  const guard   = requireRoleResponse(session?.user?.role, "ADMIN");
  if (guard) return guard;

  try {
    const body = await req.json();
    const { slug, name, nameEn, description, prompt, category, imageCount, creditCost, sortOrder } = body;

    // Validate required fields
    if (!slug || !name || !category) {
      return NextResponse.json(
        { error: "slug, name, category là bắt buộc" },
        { status: 400 }
      );
    }

    // Check slug unique
    const existing = await prisma.feature.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: `Slug "${slug}" đã tồn tại` },
        { status: 409 }
      );
    }

    const feature = await prisma.feature.create({
      data: {
        slug,
        name:        name.trim(),
        nameEn:      (nameEn ?? name).trim(),
        description: description?.trim() ?? null,
        prompt:      prompt?.trim() ?? "",
        category,
        imageCount:  imageCount !== undefined ? Number(imageCount) : 1,
        creditCost:  creditCost !== undefined ? Number(creditCost) : 10,
        sortOrder:   sortOrder !== undefined ? Number(sortOrder) : 0,
        isActive:    true,
      },
    });
    return NextResponse.json({ feature }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/admin/features]", err);
    return NextResponse.json({ error: "Lỗi tạo feature" }, { status: 500 });
  }
}
