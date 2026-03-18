import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";

// POST /api/admin/jobs/[id]/retry — Retry a failed job
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const guard = requireRoleResponse((session?.user as any)?.role, "ADMIN");
  if (guard) return guard;

  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      featureId: true,
      featureSlug: true,
      featureName: true,
      promptUsed: true,
      inputUrls: true,
      quality: true,
      width: true,
      height: true,
      orientation: true,
      creditUsed: true,
      status: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "FAILED") {
    return NextResponse.json({ error: "Chỉ có thể retry job thất bại" }, { status: 400 });
  }

  // Create a new job with same params, status = QUEUED
  const newJob = await prisma.job.create({
    data: {
      userId: job.userId,
      featureId: job.featureId,
      featureSlug: job.featureSlug,
      featureName: job.featureName,
      promptUsed: job.promptUsed,
      inputUrls: job.inputUrls,
      quality: job.quality,
      width: job.width,
      height: job.height,
      orientation: job.orientation,
      creditUsed: 0, // Don't charge credits on retry
      status: "QUEUED",
    },
  });

  return NextResponse.json({
    ok: true,
    newJobId: newJob.id,
    message: "Đã tạo job retry (không tính credits)",
  });
}
