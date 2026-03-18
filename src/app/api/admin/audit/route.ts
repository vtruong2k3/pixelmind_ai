import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";

// GET /api/admin/audit — List audit logs with pagination and filters
export async function GET(req: NextRequest) {
  const session = await auth();
  const guard = requireRoleResponse((session?.user as any)?.role, "ADMIN");
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "30"));
  const action = searchParams.get("action") ?? "";
  const search = searchParams.get("search") ?? "";

  const where: any = {};
  if (action && action !== "all") where.action = action;
  if (search) {
    where.OR = [
      { actorEmail:  { contains: search, mode: "insensitive" } },
      { targetLabel: { contains: search, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs: logs.map(l => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      details: l.details ? JSON.parse(l.details) : null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
