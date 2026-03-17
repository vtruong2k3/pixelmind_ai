import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pollOnce } from "@/lib/chainhub";
import { hasMinRole } from "@/lib/roles";
import { uploadUrlToR2 } from "@/lib/r2";

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

    // Lấy job bằng Prisma API — type-safe, không raw SQL
    const job = await prisma.job.findFirst({
      where:  { id: jobId, userId: session.user.id },
      select: {
        id:             true,
        status:         true,
        outputUrl:      true,
        chainhubTaskId: true,
        errorMsg:       true,
        userId:         true,
        featureId:      true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Đã xong từ lần poll trước
    if (job.status === "COMPLETED" && job.outputUrl) {
      return NextResponse.json({ status: "COMPLETED", outputUrl: `/api/image/${job.id}` });
    }
    if (job.status === "FAILED") {
      return NextResponse.json({ status: "FAILED", error: job.errorMsg ?? "Tạo ảnh thất bại" });
    }

    if (!job.chainhubTaskId) {
      return NextResponse.json({ status: "PROCESSING" });
    }

    // Poll ChainHub 1 lần
    const result = await pollOnce(job.chainhubTaskId);
    if (!result) {
      return NextResponse.json({ status: "PROCESSING" });
    }

    if (result.status === "COMPLETED" && result.outputUrl) {
      const rawUrl = result.outputUrl;
      let finalUrl = rawUrl;

      // Upload ảnh lên Cloudflare R2 ngay lập tức trước khi trả kết quả
      // R2 URL vĩnh viễn thay vì URL chainhub 
      try {
        const r2Url = await uploadUrlToR2(rawUrl, "outputs", {
          Authorization: `Bearer ${process.env.CHAINHUB_API_KEY}`,
        });
        finalUrl = r2Url;
        console.log(`[status] Ảnh upload R2 thành công: ${r2Url} — job=${job.id}`);
      } catch (uploadErr) {
        console.error("[status] R2 upload error:", uploadErr);
        // Fallback: nếu lỗi, giữ rawUrl 
      }

      await prisma.job.update({
        where: { id: job.id },
        data:  { status: "COMPLETED", outputUrl: finalUrl },
      });

      return NextResponse.json({
        status:    "COMPLETED",
        outputUrl: finalUrl,
      });
    }

    if (result.status === "FAILED") {
      // Hoàn credits lại cho user (STAFF/ADMIN bypass credit)
      const role = session.user.role ?? "USER";
      const isAdmin = hasMinRole(role, "STAFF");
      if (!isAdmin) {
        // Lấy creditCost và tên feature qua Prisma API
        const feature = await prisma.feature.findFirst({
          where:  { jobs: { some: { id: job.id } } },
          select: { creditCost: true, name: true },
        });
        const creditCost  = feature?.creditCost ?? 0;
        const featureName = feature?.name ?? "Tạo ảnh";
        if (creditCost > 0) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: job.userId },
              data:  { credits: { increment: creditCost } },
            }),
            prisma.creditTransaction.create({
              data: {
                userId:      job.userId,
                amount:      creditCost,
                type:        "refund",
                description: `Hoàn credits: ${featureName} thất bại`,
              },
            }),
          ]);
          console.log(`[status] Hoàn ${creditCost} credits cho user ${job.userId} do job ${job.id} FAILED`);
        }
      }
      await prisma.job.update({
        where: { id: job.id },
        data:  { status: "FAILED", errorMsg: "ChainHub task failed" },
      });
      return NextResponse.json({ status: "FAILED", error: "Tạo ảnh thất bại. Credits đã được hoàn lại." });
    }

    // ChainHub đang QUEUED hoặc PROCESSING — đồng bộ status vào DB
    const chainhubStatus = result.status ?? "PROCESSING";
    if (chainhubStatus !== job.status && (chainhubStatus === "QUEUED" || chainhubStatus === "PROCESSING")) {
      await prisma.job.update({
        where: { id: job.id },
        data:  { status: chainhubStatus },
      });
    }
    return NextResponse.json({ status: chainhubStatus });

  } catch (error) {
    console.error("[/api/generate/status] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
