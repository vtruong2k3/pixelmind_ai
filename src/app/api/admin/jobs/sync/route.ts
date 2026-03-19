import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pollOnce } from "@/lib/chainhub";
import { requireRoleResponse } from "@/lib/roles";
import { uploadUrlToR2 } from "@/lib/r2";

/**
 * POST /api/admin/jobs/sync
 * Đồng bộ status của các jobs đang PROCESSING/QUEUED trong DB với ChainHub.
 * Dùng khi dashboard thấy jobs bị kẹt trạng thái không đúng.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const guard = requireRoleResponse(session?.user?.role, "ADMIN");
  if (guard) return guard;

  try {
    const body = await req.json().catch(() => ({}));
    const maxJobs = Number(body.maxJobs) || 20; // giới hạn để không timeout

    // Lấy jobs đang PROCESSING hoặc QUEUED, có chainhubTaskId
    const stuckJobs = await prisma.$queryRaw<Array<{
      id: string; chainhubTaskId: string; status: string; userId: string; featureId: string;
    }>>`
      SELECT id, "chainhubTaskId", status, "userId", "featureId"
      FROM "Job"
      WHERE status IN ('PROCESSING', 'QUEUED')
        AND "chainhubTaskId" IS NOT NULL
      ORDER BY "createdAt" DESC
      LIMIT ${maxJobs}
    `;

    let synced = 0, completed = 0, failed = 0, queued = 0;
    const results: { id: string; oldStatus: string; newStatus: string }[] = [];

    for (const job of stuckJobs) {
      const result = await pollOnce(job.chainhubTaskId);
      if (!result) continue;

      const newStatus = result.status;
      if (newStatus === job.status) continue; // không thay đổi

      if (newStatus === "COMPLETED" && result.outputUrl) {
        // Upload ảnh lên Cloudflare R2 để lưu vĩnh viễn (thay vì base64 vào DB)
        let storedUrl = result.outputUrl;
        try {
          storedUrl = await uploadUrlToR2(result.outputUrl, "outputs");
          console.log(`[sync] Uploaded to R2: ${storedUrl}`);
        } catch (uploadErr) {
          console.error("[sync] R2 upload thất bại, giữ Chainhub URL:", uploadErr);
          // Fallback: giữ URL gốc của Chainhub (hết hạn sau 7 ngày)
        }

        await prisma.$executeRaw`
          UPDATE "Job" SET status = 'COMPLETED', "outputUrl" = ${storedUrl}, "updatedAt" = NOW()
          WHERE id = ${job.id}
        `;
        completed++;
        results.push({ id: job.id, oldStatus: job.status, newStatus: "COMPLETED" });

      } else if (newStatus === "FAILED") {
        // Hoàn credits
        const features = await prisma.$queryRaw<Array<{ creditCost: number; name: string }>>`
          SELECT f."creditCost", f.name FROM "Feature" f
          INNER JOIN "Job" j ON j."featureId" = f.id
          WHERE j.id = ${job.id} LIMIT 1
        `;
        const creditCost = features[0]?.creditCost ?? 0;
        if (creditCost > 0) {
          await prisma.user.update({ where: { id: job.userId }, data: { credits: { increment: creditCost } } });
          await prisma.creditTransaction.create({
            data: { userId: job.userId, amount: creditCost, type: "refund", description: `Hoàn credits: ${features[0]?.name ?? "Tạo ảnh"} thất bại (sync)` },
          });
        }
        await prisma.$executeRaw`
          UPDATE "Job" SET status = 'FAILED', "errorMsg" = 'Task failed (admin sync)', "updatedAt" = NOW()
          WHERE id = ${job.id}
        `;
        failed++;
        results.push({ id: job.id, oldStatus: job.status, newStatus: "FAILED" });

      } else if (newStatus === "QUEUED" || newStatus === "PROCESSING") {
        // Đồng bộ status nếu khác
        if (newStatus !== job.status) {
          await prisma.$executeRaw`
            UPDATE "Job" SET status = ${newStatus}, "updatedAt" = NOW()
            WHERE id = ${job.id}
          `;
          queued++;
          results.push({ id: job.id, oldStatus: job.status, newStatus });
        }
      }
      synced++;
    }

    return NextResponse.json({
      message: `Đã sync ${synced}/${stuckJobs.length} jobs`,
      stats: { total: stuckJobs.length, synced, completed, failed, queued },
      results,
    });
  } catch (err) {
    console.error("[POST /api/admin/jobs/sync]", err);
    return NextResponse.json({ error: "Sync thất bại" }, { status: 500 });
  }
}
