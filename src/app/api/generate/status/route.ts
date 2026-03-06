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
      userId: string; featureId: string;
    }>>`
      SELECT id, status, "outputUrl", "chainhubTaskId", "errorMsg", "userId", "featureId"
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
      let storedUrl = result.outputUrl;
      try {
        const imgRes = await fetch(result.outputUrl, {
          headers: { "User-Agent": "PixelMind/1.0" },
        });
        if (imgRes.ok) {
          const contentType = imgRes.headers.get("content-type") || "image/png";
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          storedUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
          console.log(`[status] Ảnh lưu base64 (${Math.round(buffer.byteLength / 1024)}KB) job=${job.id}`);
        } else {
          console.warn(`[status] Download thất bại (${imgRes.status})`);
        }
      } catch (downloadErr) {
        console.warn("[status] Download error:", downloadErr);
      }


      await prisma.$executeRaw`
        UPDATE "Job" SET status = 'done', "outputUrl" = ${storedUrl}, "updatedAt" = NOW()
        WHERE id = ${job.id}
      `;
      // Credits đã bị trừ từ lúc submit — không cần hành động gì thêm
      return NextResponse.json({
        status: "done",
        outputUrl: `/api/image/${job.id}`,
      });
    }

    if (result.status === "FAILED") {
      // Hoàn credits lại cho user
      const isAdmin = (session.user as any).isAdmin === true;
      if (!isAdmin) {
        const features = await prisma.$queryRaw<Array<{ creditCost: number; name: string }>>`
          SELECT f."creditCost", f.name FROM "Feature" f
          INNER JOIN "Job" j ON j."featureId" = f.id
          WHERE j.id = ${job.id} LIMIT 1
        `;
        const creditCost = features[0]?.creditCost ?? 0;
        const featureName = features[0]?.name ?? "Tạo ảnh";
        if (creditCost > 0) {
          await prisma.user.update({
            where: { id: job.userId },
            data:  { credits: { increment: creditCost } },
          });
          await prisma.creditTransaction.create({
            data: {
              userId:      job.userId,
              amount:      creditCost,
              type:        "refund",
              description: `Hoàn credits: ${featureName} thất bại`,
            },
          });
          console.log(`[status] Hoàn ${creditCost} credits cho user ${job.userId} do job ${job.id} FAILED`);
        }
      }
      await prisma.$executeRaw`
        UPDATE "Job" SET status = 'failed', "errorMsg" = 'ChainHub task failed', "updatedAt" = NOW()
        WHERE id = ${job.id}
      `;
      return NextResponse.json({ status: "failed", error: "Tạo ảnh thất bại. Credits đã được hoàn lại." });
    }

    return NextResponse.json({ status: result.status ?? "processing" });
  } catch (error) {
    console.error("[/api/generate/status] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
