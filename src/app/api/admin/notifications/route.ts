import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";

// GET /api/admin/notifications — Admin alerts: failed jobs, new purchases, new users
export async function GET() {
  const session = await auth();
  const guard = requireRoleResponse((session?.user as any)?.role, "STAFF");
  if (guard) return guard;

  const since1h  = new Date(Date.now() - 60 * 60 * 1000);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [failedJobs, newPurchases, newUsers, queuedCount] = await Promise.all([
    // Jobs failed trong 24h
    prisma.job.findMany({
      where: { status: "FAILED", updatedAt: { gte: since24h } },
      select: {
        id: true, featureName: true, errorMsg: true, updatedAt: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    // Purchases trong 24h
    prisma.creditTransaction.findMany({
      where: { type: "purchase", createdAt: { gte: since24h } },
      select: {
        id: true, amount: true, description: true, createdAt: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // New users trong 24h
    prisma.user.findMany({
      where: { createdAt: { gte: since24h } },
      select: { id: true, name: true, email: true, plan: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Jobs đang chờ xử lý
    prisma.job.count({ where: { status: { in: ["QUEUED", "PROCESSING"] } } }),
  ]);

  // Alert level
  const failedLastHour = failedJobs.filter(j => new Date(j.updatedAt) >= since1h).length;
  const alertLevel = failedLastHour >= 5 ? "critical" : failedLastHour >= 2 ? "warning" : "normal";

  return NextResponse.json({
    alerts: {
      level: alertLevel,
      failedJobsCount: failedJobs.length,
      failedLastHour,
      newPurchasesCount: newPurchases.length,
      newUsersCount: newUsers.length,
      queuedCount,
    },
    failedJobs: failedJobs.map(j => ({
      ...j, updatedAt: j.updatedAt.toISOString(),
    })),
    newPurchases: newPurchases.map(p => ({
      ...p, createdAt: p.createdAt.toISOString(),
    })),
    newUsers: newUsers.map(u => ({
      ...u, createdAt: u.createdAt.toISOString(),
    })),
  });
}
