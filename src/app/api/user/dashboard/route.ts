import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/user/dashboard — User overview data
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const now    = new Date();
  const som    = new Date(now.getFullYear(), now.getMonth(), 1); // start of month

  const [user, totalJobs, totalCreditsUsed, jobsThisMonth, creditsThisMonth, recentJobs, recentTransactions] =
    await Promise.all([
      prisma.user.findUnique({
        where:  { id: userId },
        select: { id: true, name: true, email: true, image: true, role: true, credits: true, plan: true, planExpiresAt: true, createdAt: true },
      }),
      prisma.job.count({ where: { userId } }),
      prisma.creditTransaction.aggregate({
        where: { userId, type: "spend" },
        _sum: { amount: true },
      }),
      prisma.job.count({ where: { userId, createdAt: { gte: som } } }),
      prisma.creditTransaction.aggregate({
        where: { userId, type: "spend", createdAt: { gte: som } },
        _sum: { amount: true },
      }),
      prisma.job.findMany({
        where:   { userId },
        orderBy: { createdAt: "desc" },
        take:    8,
        select:  { id: true, featureName: true, status: true, quality: true, creditUsed: true, outputUrl: true, createdAt: true },
      }),
      prisma.creditTransaction.findMany({
        where:   { userId },
        orderBy: { createdAt: "desc" },
        take:    10,
        select:  { id: true, amount: true, type: true, description: true, createdAt: true, jobId: true },
      }),
    ]);

  return NextResponse.json({
    user: { ...user, createdAt: user?.createdAt.toISOString(), planExpiresAt: user?.planExpiresAt?.toISOString() ?? null },
    stats: {
      totalJobs,
      totalCreditsUsed: Math.abs(totalCreditsUsed._sum.amount ?? 0),
      jobsThisMonth,
      creditsThisMonth: Math.abs(creditsThisMonth._sum.amount ?? 0),
    },
    recentJobs: recentJobs.map(j => ({ ...j, createdAt: j.createdAt.toISOString(), outputUrl: j.outputUrl ? `/api/image/${j.id}` : null })),
    recentTransactions: recentTransactions.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })),
  });
}
