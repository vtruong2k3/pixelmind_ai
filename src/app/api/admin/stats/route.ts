import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

function isAdminUser(req: any) {
  const session = req.auth;
  const email = (session?.user?.email ?? "").toLowerCase();
  return ADMIN_EMAILS.includes(email) || (session?.user as any)?.isAdmin;
}

// GET /api/admin/stats
export const GET = auth(async function GET(req) {
  if (!isAdminUser(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const startOf30DaysAgo = new Date(now);
  startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 29);
  startOf30DaysAgo.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalJobs,
    newUsersThisMonth,
    newJobsThisMonth,
    jobStatusCounts,
    planDistribution,
    featureUsage,
    creditAggregate,
    recentUsers,
    recentJobs,
    dailyUsers,
    dailyJobs,
    revenueTransactions,
  ] = await Promise.all([
    // Total counts
    prisma.user.count(),
    prisma.job.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.job.count({ where: { createdAt: { gte: startOfMonth } } }),

    // Job status breakdown
    prisma.job.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // Users by plan
    prisma.user.groupBy({
      by: ["plan"],
      _count: { plan: true },
    }),

    // Top features used (top 8)
    prisma.job.groupBy({
      by: ["featureSlug", "featureName"],
      _count: { featureSlug: true },
      orderBy: { _count: { featureSlug: "desc" } },
      take: 8,
    }),

    // Credit aggregates
    prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: { amount: { gt: 0 } },
    }),

    // Recent 5 users
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, image: true, plan: true, credits: true, createdAt: true },
    }),

    // Recent 5 jobs
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, featureName: true, status: true, quality: true, creditUsed: true,
        outputUrl: true, createdAt: true,
        user: { select: { name: true, email: true, image: true } },
      },
    }),

    // Daily user registrations last 30 days
    prisma.user.findMany({
      where: { createdAt: { gte: startOf30DaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    // Daily job creations last 30 days
    prisma.job.findMany({
      where: { createdAt: { gte: startOf30DaysAgo } },
      select: { createdAt: true, creditUsed: true },
      orderBy: { createdAt: "asc" },
    }),

    // Revenue (purchase transactions) last 30 days
    prisma.creditTransaction.findMany({
      where: { type: "purchase", createdAt: { gte: startOf30DaysAgo } },
      select: { amount: true, createdAt: true },
    }),
  ]);

  // Build 30-day chart arrays
  const days: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(startOf30DaysAgo);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  const usersByDay: Record<string, number> = {};
  const jobsByDay: Record<string, number> = {};
  const creditsByDay: Record<string, number> = {};

  days.forEach(d => {
    usersByDay[d] = 0;
    jobsByDay[d] = 0;
    creditsByDay[d] = 0;
  });

  dailyUsers.forEach(u => {
    const d = u.createdAt.toISOString().slice(0, 10);
    if (usersByDay[d] !== undefined) usersByDay[d]++;
  });

  dailyJobs.forEach(j => {
    const d = j.createdAt.toISOString().slice(0, 10);
    if (jobsByDay[d] !== undefined) jobsByDay[d]++;
  });

  revenueTransactions.forEach(t => {
    const d = t.createdAt.toISOString().slice(0, 10);
    if (creditsByDay[d] !== undefined) creditsByDay[d] += t.amount;
  });

  const chartDays = days.map(d => ({
    date: d,
    label: new Date(d + "T00:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
    users: usersByDay[d],
    jobs: jobsByDay[d],
    creditsEarned: creditsByDay[d],
  }));

  // Total credits sold (purchases)
  const totalCreditsEarned = revenueTransactions.reduce((s, t) => s + t.amount, 0);

  // Job status map
  const statusMap: Record<string, number> = {};
  jobStatusCounts.forEach(s => { statusMap[s.status] = s._count.status; });

  return NextResponse.json({
    overview: {
      totalUsers,
      totalJobs,
      newUsersThisMonth,
      newJobsThisMonth,
      totalCreditsEarned,
      creditsEarnedAllTime: creditAggregate._sum.amount ?? 0,
    },
    jobStatus: {
      done: statusMap["COMPLETED"] ?? 0,
      pending: statusMap["QUEUED"] ?? 0,
      processing: statusMap["PROCESSING"] ?? 0,
      failed: statusMap["FAILED"] ?? 0,
    },
    planDistribution: planDistribution.map(p => ({ plan: p.plan, count: p._count.plan })),
    featureUsage: featureUsage.map(f => ({
      slug: f.featureSlug,
      name: f.featureName,
      count: f._count.featureSlug,
    })),
    chartDays,
    recentUsers,
    recentJobs,
  });
});
