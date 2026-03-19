import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/profile — lấy thông tin user: credits, plan, transactions gần đây
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const [user, transactions, stats] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, image: true, credits: true, plan: true, planExpiresAt: true, createdAt: true },
      }),
      prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, amount: true, type: true, description: true, createdAt: true },
      }),
      prisma.job.aggregate({
        where: { userId, status: "COMPLETED" },
        _count: { id: true },
        _sum: { creditUsed: true },
      }),
    ]);

    return NextResponse.json({
      user,
      transactions,
      totalJobs: stats._count.id,
      totalCreditsUsed: stats._sum.creditUsed ?? 0,
    });
  } catch (error) {
    console.error("[/api/profile] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
