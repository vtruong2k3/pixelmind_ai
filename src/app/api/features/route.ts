import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/features - Lấy danh sách tất cả tính năng AI từ DB
export async function GET() {
  try {
    const features = await prisma.feature.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        nameEn: true,
        description: true,
        category: true,
        imageCount: true,
        creditCost: true,
        sortOrder: true,
        // Không trả về prompt ra ngoài để bảo mật
      },
    });

    return NextResponse.json({ features });
  } catch (error) {
    console.error("[/api/features] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
