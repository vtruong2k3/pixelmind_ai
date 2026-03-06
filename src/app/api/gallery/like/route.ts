import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/gallery/like — toggle like cho 1 job
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: "jobId là bắt buộc" }, { status: 400 });
    }

    // Kiểm tra job tồn tại và public
    const job = await prisma.job.findFirst({
      where: { id: jobId, isPublic: true, status: "done" },
      select: { id: true },
    });
    if (!job) {
      return NextResponse.json({ error: "Không tìm thấy ảnh" }, { status: 404 });
    }

    // Toggle like (upsert / delete)
    const existing = await prisma.like.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { userId_jobId: { userId, jobId } } });
    } else {
      await prisma.like.create({ data: { userId, jobId } });
    }

    // Lấy tổng like mới nhất
    const likeCount = await prisma.like.count({ where: { jobId } });

    return NextResponse.json({
      liked: !existing,
      likeCount,
    });
  } catch (error) {
    console.error("[/api/gallery/like] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
