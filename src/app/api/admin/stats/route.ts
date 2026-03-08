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
  const som = new Date(now.getFullYear(), now.getMonth(), 1);
  const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const since30 = new Date(now);
  since30.setDate(since30.getDate() - 29);
  since30.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalJobs,
    newUsersThisMonth,
    newJobsThisMonth,
    planDistribution,
    featureUsage,
    jobStatusCounts,
    // Revenue — dùng $queryRaw để bypass Prisma client chưa regenerate
    revenueTotal,
    revenueMonth,
    revenueToday,
    // Chart
    dailyUsers,
    dailyJobs,
    dailyCredits,
    dailyRevenue,
    // === 2 bảng mới ===
    todayNewUsers,
    recentPurchases,
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

    // Revenue raw SQL
    prisma.$queryRaw<{ total: string }[]>`
      SELECT COALESCE(SUM("usdAmount"), 0)::text AS total FROM "CreditTransaction"
      WHERE type = 'purchase' AND "usdAmount" IS NOT NULL
    `,
    prisma.$queryRaw<{ total: string }[]>`
      SELECT COALESCE(SUM("usdAmount"), 0)::text AS total FROM "CreditTransaction"
      WHERE type = 'purchase' AND "usdAmount" IS NOT NULL AND "createdAt" >= ${som}
    `,
    prisma.$queryRaw<{ total: string }[]>`
      SELECT COALESCE(SUM("usdAmount"), 0)::text AS total FROM "CreditTransaction"
      WHERE type = 'purchase' AND "usdAmount" IS NOT NULL AND "createdAt" >= ${sod}
    `,

    // Chart queries
    prisma.$queryRaw<{ day: Date; cnt: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC') AS day, COUNT(*) AS cnt
      FROM "User" WHERE "createdAt" >= ${since30}
      GROUP BY day ORDER BY day
    `,
    prisma.$queryRaw<{ day: Date; cnt: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC') AS day, COUNT(*) AS cnt
      FROM "Job" WHERE "createdAt" >= ${since30}
      GROUP BY day ORDER BY day
    `,
    prisma.$queryRaw<{ day: Date; total: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC') AS day, ABS(SUM(amount)) AS total
      FROM "CreditTransaction"
      WHERE type = 'spend' AND "createdAt" >= ${since30}
      GROUP BY day ORDER BY day
    `,
    prisma.$queryRaw<{ day: Date; total: string }[]>`
      SELECT DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC') AS day,
             COALESCE(SUM("usdAmount"), 0)::text AS total
      FROM "CreditTransaction"
      WHERE type = 'purchase' AND "usdAmount" IS NOT NULL AND "createdAt" >= ${since30}
      GROUP BY day ORDER BY day
    `,

    // Users tạo hôm nay (limit 10, mới nhất trước)
    prisma.user.findMany({
      where: { createdAt: { gte: sod } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, image: true, plan: true, createdAt: true },
    }),

    // Người dùng mua gói gần đây (CreditTransaction type=purchase, limit 10)
    (prisma.creditTransaction as any).findMany({
      where: { type: "purchase" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, description: true, amount: true, usdAmount: true, createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true, plan: true } },
      },
    }),
  ]);

  // Chart build
  const toKey = (d: Date) => d.toISOString().split("T")[0];
  const userMap    = new Map<string, number>();
  const jobMap     = new Map<string, number>();
  const creditMap  = new Map<string, number>();
  const revenueMap = new Map<string, number>();
  for (const r of dailyUsers)   userMap.set(toKey(r.day),    Number(r.cnt));
  for (const r of dailyJobs)    jobMap.set(toKey(r.day),     Number(r.cnt));
  for (const r of dailyCredits) creditMap.set(toKey(r.day),  Number(r.total));
  for (const r of dailyRevenue) revenueMap.set(toKey(r.day), parseFloat(r.total ?? "0"));

  const chartDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since30);
    d.setDate(d.getDate() + i);
    const key   = toKey(d);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    return { date: key, label, users: userMap.get(key) ?? 0, jobs: jobMap.get(key) ?? 0, credits: creditMap.get(key) ?? 0, revenue: revenueMap.get(key) ?? 0 };
  });

  const statusMap: Record<string, number> = {};
  jobStatusCounts.forEach(s => { statusMap[s.status] = s._count.status; });

  // Parse planId từ description để hiển thị gói mua
  function parsePlanFromDesc(desc: string): string {
    const m = desc.match(/gói (\w+):/);
    return m ? m[1] : "unknown";
  }

  return NextResponse.json({
    overview: {
      totalUsers,
      totalJobs,
      newUsersThisMonth,
      newJobsThisMonth,
      totalRevenueUSD: parseFloat(revenueTotal[0]?.total ?? "0"),
      monthRevenueUSD: parseFloat(revenueMonth[0]?.total ?? "0"),
      todayRevenueUSD: parseFloat(revenueToday[0]?.total ?? "0"),
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
    // Bảng mới
    todayNewUsers: todayNewUsers.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
    recentPurchases: recentPurchases.map(tx => ({
      id:          tx.id,
      plan:        parsePlanFromDesc(tx.description),
      credits:     tx.amount,
      usdAmount:   (tx as any).usdAmount ?? 0, // Fallback as any phòng ngừa Prisma Client chưa sync kịp mới DB push
      description: tx.description,
      createdAt:   tx.createdAt.toISOString(),
      user:        tx.user,
    })),
  });
}
