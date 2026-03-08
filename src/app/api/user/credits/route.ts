import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";

// GET /api/user/credits — lịch sử giao dịch credits của user hiện tại
export async function GET(req: NextRequest) {
  const session = await auth();
  const guard = requireRoleResponse((session?.user as any)?.role, "USER");
  if (guard) return guard;

  const userId = session!.user!.id!;
  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  const [transactions, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      select:  { id: true, amount: true, type: true, description: true, createdAt: true, jobId: true },
    }),
    prisma.creditTransaction.count({ where: { userId } }),
  ]);

  return NextResponse.json({
    transactions: transactions.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
