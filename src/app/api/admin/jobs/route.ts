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

// GET /api/admin/jobs?page=1&limit=20&status=&quality=&feature=&search=&order=desc
export const GET = auth(async function GET(req) {
  if (!isAdminUser(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page    = Math.max(1, parseInt(searchParams.get("page")   ?? "1"));
  const limit   = Math.min(100, parseInt(searchParams.get("limit")  ?? "20"));
  const status  = searchParams.get("status")  ?? "";
  const quality = searchParams.get("quality") ?? "";
  const feature = searchParams.get("feature") ?? "";
  const search  = searchParams.get("search")  ?? "";
  const order   = (searchParams.get("order")  ?? "desc") as "asc" | "desc";

  const where: any = {};
  if (status  && status !== "all")  where.status = status;
  if (quality && quality !== "all") where.quality = quality;
  if (feature && feature !== "all") where.featureSlug = feature;
  if (search) {
    where.user = { OR: [
      { name:  { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]};
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: order },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, featureName: true, featureSlug: true,
        status: true, quality: true, creditUsed: true,
        width: true, height: true, orientation: true,
        outputUrl: true, errorMsg: true,
        isPublic: true, createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  // Status summary for the current filter (without status filter)
  const statusCounts = await prisma.job.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const statusMap: Record<string, number> = {};
  statusCounts.forEach(s => { statusMap[s.status] = s._count.status; });

  return NextResponse.json({
    jobs,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
    statusSummary: {
      done:       statusMap["COMPLETED"]       ?? 0,
      pending:    statusMap["PENDING"]    ?? 0,
      processing: statusMap["PROCESSING"] ?? 0,
      failed:     statusMap["FAILED"]     ?? 0,
    },
  });
});
