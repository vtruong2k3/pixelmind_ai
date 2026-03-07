import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";

// GET /api/admin/credits
export async function GET(req: NextRequest) {
  const session = await auth();
  const guard   = requireRoleResponse((session?.user as any)?.role, "ADMIN");
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const type   = searchParams.get("type")   ?? "";
  const search = searchParams.get("search") ?? "";
  const order  = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  const where: any = {};
  if (type && type !== "all") where.type = type;
  if (search) {
    where.user = { OR: [
      { name:  { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]};
  }

  const [transactions, total, aggregates] = await Promise.all([
    prisma.creditTransaction.findMany({
      where, orderBy: { createdAt: order },
      skip: (page - 1) * limit, take: limit,
      select: {
        id: true, amount: true, type: true, description: true, createdAt: true, jobId: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.creditTransaction.count({ where }),
    Promise.all([
      prisma.creditTransaction.aggregate({ where: { type: "purchase" }, _sum: { amount: true }, _count: { id: true } }),
      prisma.creditTransaction.aggregate({ where: { type: "spend" },    _sum: { amount: true }, _count: { id: true } }),
      prisma.creditTransaction.aggregate({ where: { type: "earn" },     _sum: { amount: true }, _count: { id: true } }),
      prisma.creditTransaction.aggregate({ where: { type: "bonus" },    _sum: { amount: true }, _count: { id: true } }),
    ]),
  ]);

  const [purchaseAgg, spendAgg, earnAgg, bonusAgg] = aggregates;
  return NextResponse.json({
    transactions: transactions.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })),
    total, page, totalPages: Math.ceil(total / limit),
    summary: {
      totalPurchased: purchaseAgg._sum.amount ?? 0, purchaseCount: purchaseAgg._count.id,
      totalSpent:     Math.abs(spendAgg._sum.amount ?? 0), spendCount: spendAgg._count.id,
      totalEarned:    earnAgg._sum.amount ?? 0, earnCount: earnAgg._count.id,
      totalBonus:     bonusAgg._sum.amount ?? 0, bonusCount: bonusAgg._count.id,
    },
  });
}

// POST /api/admin/credits — tặng credits (không giới hạn)
export async function POST(req: NextRequest) {
  const session = await auth();
  const guard   = requireRoleResponse((session?.user as any)?.role, "ADMIN");
  if (guard) return guard;

  const { userId, amount, description } = await req.json();
  if (!userId || typeof amount !== "number" || !description) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const [user] = await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { credits: { increment: amount } }, select: { id: true, name: true, email: true, credits: true } }),
    prisma.creditTransaction.create({ data: { userId, amount, type: amount > 0 ? "bonus" : "spend", description } }),
  ]);
  return NextResponse.json({ ok: true, user });
}
