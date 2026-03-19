import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";

// GET /api/admin/jobs
export async function GET(req: NextRequest) {
  const session = await auth();
  const guard   = requireRoleResponse(session?.user?.role, "ADMIN");
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const page    = Math.max(1, parseInt(searchParams.get("page")   ?? "1"));
  const limit   = Math.min(100, parseInt(searchParams.get("limit")  ?? "20"));
  const status  = searchParams.get("status")  ?? "";
  const quality = searchParams.get("quality") ?? "";
  const search  = searchParams.get("search")  ?? "";
  const order   = (searchParams.get("order")  ?? "desc") as "asc" | "desc";

  const where: any = {};
  if (status  && status  !== "all") where.status  = status;
  if (quality && quality !== "all") where.quality = quality;
  if (search) {
    where.user = { OR: [
      { name:  { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]};
  }

  const [jobs, total, statusCounts] = await Promise.all([
    prisma.job.findMany({
      where, orderBy: { createdAt: order },
      skip: (page - 1) * limit, take: limit,
      select: {
        id: true, featureName: true, featureSlug: true,
        status: true, quality: true, creditUsed: true,
        outputUrl: true, errorMsg: true, createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
    prisma.job.count({ where }),
    prisma.job.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  const statusMap: Record<string, number> = {};
  statusCounts.forEach(s => { statusMap[s.status] = s._count.status; });

  return NextResponse.json({
    jobs: jobs.map(j => ({ ...j, createdAt: j.createdAt.toISOString(), outputUrl: j.outputUrl ? `/api/image/${j.id}` : null })),
    total, page, totalPages: Math.ceil(total / limit),
    statusSummary: statusMap,
  });
}

// DELETE /api/admin/jobs — xóa job theo id trong body
export async function DELETE(req: NextRequest) {
  const session = await auth();
  const guard   = requireRoleResponse(session?.user?.role, "ADMIN");
  if (guard) return guard;

  const { jobId } = await req.json();
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });
  await prisma.job.delete({ where: { id: jobId } });
  return NextResponse.json({ ok: true });
}
