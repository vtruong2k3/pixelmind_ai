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

// GET /api/admin/users?page=1&limit=20&search=&plan=&sort=createdAt&order=desc
export const GET = auth(async function GET(req) {
  if (!isAdminUser(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const search = searchParams.get("search") ?? "";
  const plan   = searchParams.get("plan")   ?? "";
  const sort   = (searchParams.get("sort")  ?? "createdAt") as string;
  const order  = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  const where: any = {};
  if (search) {
    where.OR = [
      { name:  { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (plan && plan !== "all") where.plan = plan;

  const validSortFields: Record<string, any> = {
    createdAt: { createdAt: order },
    credits:   { credits: order },
    name:      { name: order },
    email:     { email: order },
  };
  const orderBy = validSortFields[sort] ?? { createdAt: "desc" };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, email: true, image: true,
        credits: true, plan: true, planExpiresAt: true,
        createdAt: true, updatedAt: true,
        _count: { select: { jobs: true, creditTransactions: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  });
});

// PATCH /api/admin/users  — bulk update (not used currently, reserved)
export const PATCH = auth(async function PATCH(req) {
  if (!isAdminUser(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true });
});
