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

// GET /api/admin/credits?page=1&limit=20&type=&search=&order=desc
export const GET = auth(async function GET(req) {
  if (!isAdminUser(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
      where,
      orderBy: { createdAt: order },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, amount: true, type: true, description: true, createdAt: true,
        jobId: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.creditTransaction.count({ where }),

    // Summary aggregates (unfiltered except by search)
    Promise.all([
      prisma.creditTransaction.aggregate({
        where: { type: "purchase" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.creditTransaction.aggregate({
        where: { type: "spend" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.creditTransaction.aggregate({
        where: { type: "earn" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.creditTransaction.aggregate({
        where: { type: "bonus" },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]),
  ]);

  const [purchaseAgg, spendAgg, earnAgg, bonusAgg] = aggregates;

  return NextResponse.json({
    transactions,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
    summary: {
      totalPurchased: purchaseAgg._sum.amount ?? 0,
      purchaseCount:  purchaseAgg._count.id ?? 0,
      totalSpent:     Math.abs(spendAgg._sum.amount ?? 0),
      spendCount:     spendAgg._count.id ?? 0,
      totalEarned:    earnAgg._sum.amount ?? 0,
      earnCount:      earnAgg._count.id ?? 0,
      totalBonus:     bonusAgg._sum.amount ?? 0,
      bonusCount:     bonusAgg._count.id ?? 0,
    },
  });
});

// POST /api/admin/credits  — manually add credits to a user
export const POST = auth(async function POST(req) {
  if (!isAdminUser(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { userId, amount, description } = body;

  if (!userId || typeof amount !== "number" || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [user, transaction] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
      select: { id: true, name: true, email: true, credits: true },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount,
        type: amount > 0 ? "earn" : "spend",
        description,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, user, transaction });
});
