import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";

// GET /api/admin/stats — tổng quan hệ thống
export async function GET() {
  const session = await auth();
  const guard   = requireRoleResponse((session?.user as any)?.role, "ADMIN");
  if (guard) return guard;

  const now = new Date();
  const som = new Date(now.getFullYear(), now.getMonth(), 1); // start of month
  const since30 = new Date(now);
  since30.setDate(since30.getDate() - 29);
  since30.setHours(0, 0, 0, 0);

  // ─── 1. Chạy 7 queries đơn giản song song (thay vì 90) ────────────────
  const [
    totalUsers,
    totalJobs,
    newUsersThisMonth,
    newJobsThisMonth,
    planDistribution,
    featureUsage,
    jobStatusCounts,
    totalRevenue,
    // 3 GROUP BY queries cho chart — mỗi cái tự nhóm theo ngày
    dailyUsers,
    dailyJobs,
    dailyCredits,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.user.count({ where: { createdAt: { gte: som } } }),
    prisma.job.count({ where: { createdAt: { gte: som } } }),
    prisma.user.groupBy({ by: ["plan"], _count: { plan: true } }),
    prisma.job.groupBy({
      by: ["featureSlug", "featureName"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.job.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.creditTransaction.aggregate({
      where: { type: "purchase" },
      _sum:  { amount: true },
    }),

    // ── 3 GROUP BY queries (thay thế hoàn toàn 90 queries cũ) ──────────
    prisma.$queryRaw<{ day: Date; cnt: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC') AS day,
             COUNT(*) AS cnt
      FROM "User"
      WHERE "createdAt" >= ${since30}
      GROUP BY day
      ORDER BY day
    `,
    prisma.$queryRaw<{ day: Date; cnt: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC') AS day,
             COUNT(*) AS cnt
      FROM "Job"
      WHERE "createdAt" >= ${since30}
      GROUP BY day
      ORDER BY day
    `,
    prisma.$queryRaw<{ day: Date; total: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC') AS day,
             ABS(SUM(amount)) AS total
      FROM "CreditTransaction"
      WHERE type = 'spend' AND "createdAt" >= ${since30}
      GROUP BY day
      ORDER BY day
    `,
  ]);

  // ─── 2. Build chart days — merge 3 maps theo date string ──────────────
  const toKey = (d: Date) => d.toISOString().split("T")[0];

  const userMap   = new Map<string, number>();
  const jobMap    = new Map<string, number>();
  const creditMap = new Map<string, number>();

  for (const r of dailyUsers)   userMap.set(toKey(r.day),   Number(r.cnt));
  for (const r of dailyJobs)    jobMap.set(toKey(r.day),    Number(r.cnt));
  for (const r of dailyCredits) creditMap.set(toKey(r.day), Number(r.total));

  // Generate 30 ngày liên tiếp, điền 0 nếu không có dữ liệu
  const chartDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since30);
    d.setDate(d.getDate() + i);
    const key   = toKey(d);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    return {
      date:    key,
      label,
      users:   userMap.get(key)   ?? 0,
      jobs:    jobMap.get(key)    ?? 0,
      credits: creditMap.get(key) ?? 0,
    };
  });

  // ─── 3. Format response ───────────────────────────────────────────────
  const statusMap: Record<string, number> = {};
  jobStatusCounts.forEach(s => { statusMap[s.status] = s._count.status; });

  return NextResponse.json({
    overview: {
      totalUsers,
      totalJobs,
      newUsersThisMonth,
      newJobsThisMonth,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    },
    jobStatus: {
      COMPLETED:  statusMap["COMPLETED"]  ?? 0,
      PROCESSING: statusMap["PROCESSING"] ?? 0,
      QUEUED:     statusMap["QUEUED"]     ?? 0,
      FAILED:     statusMap["FAILED"]     ?? 0,
    },
    planDistribution: planDistribution.map(p => ({ plan: p.plan, count: p._count.plan })),
    featureUsage:     featureUsage.map(f => ({ slug: f.featureSlug, name: f.featureName, count: f._count.id })),
    chartDays,
  });
}
