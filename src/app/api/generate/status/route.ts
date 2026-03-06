import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pollOnce } from "@/lib/chainhub";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = req.nextUrl.searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ error: "jobId required" }, { status: 400 });
    }

    // Lấy job — dùng $queryRaw để tránh TypeScript type conflict
    const jobs = await prisma.$queryRaw<Array<{
      id: string; status: string; outputUrl: string | null;
      chainhubTaskId: string | null; errorMsg: string | null;
    }>>`
      SELECT id, status, "outputUrl", "chainhubTaskId", "errorMsg"
      FROM "Job"
      WHERE id = ${jobId} AND "userId" = ${session.user.id}
      LIMIT 1
    `;

    const job = jobs[0];
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Đã xong từ lần poll trước
    if (job.status === "done" && job.outputUrl) {
      return NextResponse.json({ status: "done", outputUrl: `/api/image/${job.id}` });
    }
    if (job.status === "failed") {
      return NextResponse.json({ status: "failed", error: job.errorMsg ?? "Tạo ảnh thất bại" });
    }

    if (!job.chainhubTaskId) {
      return NextResponse.json({ status: "processing" });
    }

    // Poll ChainHub 1 lần
    const result = await pollOnce(job.chainhubTaskId);
    if (!result) {
      return NextResponse.json({ status: "processing" });
    }

    if (result.status === "COMPLETED" && result.outputUrl) {
      await prisma.$executeRaw`
        UPDATE "Job" SET status = 'done', "outputUrl" = ${result.outputUrl}, "updatedAt" = NOW()
        WHERE id = ${job.id}
      `;
      return NextResponse.json({ status: "done", outputUrl: `/api/image/${job.id}` });
    }

    if (result.status === "FAILED") {
      await prisma.$executeRaw`
        UPDATE "Job" SET status = 'failed', "errorMsg" = 'ChainHub task failed', "updatedAt" = NOW()
        WHERE id = ${job.id}
      `;
      return NextResponse.json({ status: "failed", error: "Tạo ảnh thất bại" });
    }

    return NextResponse.json({ status: result.status ?? "processing" });
  } catch (error) {
    console.error("[/api/generate/status] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
