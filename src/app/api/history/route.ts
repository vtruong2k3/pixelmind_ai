import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const featureSlug = searchParams.get("feature") ?? undefined;

    const where = {
      userId: session.user.id,
      ...(featureSlug ? { featureSlug } : {}),
    };

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        featureSlug: true,
        featureName: true,
        outputUrl: true,
        inputUrls: true,
        quality: true,
        status: true,
        isPublic: true,
        creditUsed: true,
        createdAt: true,
      },
    });

    const hasMore = jobs.length > limit;
    const items = hasMore ? jobs.slice(0, limit) : jobs;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    return NextResponse.json({ jobs: items, cursor: nextCursor, hasMore });
  } catch (error) {
    console.error("[/api/history] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Toggle public/private cho 1 job
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, isPublic } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: "jobId là bắt buộc" }, { status: 400 });
    }

    // Chỉ cho phép user update job của chính họ
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: session.user.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job không tìm thấy" }, { status: 404 });
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { isPublic },
    });

    return NextResponse.json({ success: true, isPublic: updated.isPublic });
  } catch (error) {
    console.error("[/api/history PATCH] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
