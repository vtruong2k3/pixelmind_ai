import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";

// GET /api/admin/users
export async function GET(req: NextRequest) {
  const session = await auth();
  const guard   = requireRoleResponse(session?.user?.role, "ADMIN");
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const search = searchParams.get("search") ?? "";
  const role   = searchParams.get("role")  ?? "";
  const plan   = searchParams.get("plan")  ?? "";
  const order  = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  const where: any = {};
  if (role && role !== "all") where.role = role;
  if (plan && plan !== "all") where.plan = plan;
  if (search) {
    where.OR = [
      { name:  { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: order },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, email: true, image: true,
        role: true, credits: true, plan: true, planExpiresAt: true, createdAt: true,
        _count: { select: { jobs: true, creditTransactions: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map(u => ({ ...u, createdAt: u.createdAt.toISOString(), planExpiresAt: u.planExpiresAt?.toISOString() ?? null })),
    total, page,
    totalPages: Math.ceil(total / limit),
  });
}
