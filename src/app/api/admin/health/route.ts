import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";

// GET /api/admin/health — System health check
export async function GET() {
  const session = await auth();
  const guard = requireRoleResponse((session?.user as any)?.role, "ADMIN");
  if (guard) return guard;

  const results: {
    service: string;
    status: "ok" | "error";
    latencyMs: number;
    detail?: string;
  }[] = [];

  // 1. Database health
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    results.push({ service: "PostgreSQL", status: "ok", latencyMs: Date.now() - start });
  } catch (e: any) {
    results.push({ service: "PostgreSQL", status: "error", latencyMs: 0, detail: e.message });
  }

  // 2. ChainHub API health
  try {
    const start = Date.now();
    const baseUrl = process.env.CHAINHUB_API_URL ?? "";
    const res = await fetch(baseUrl, {
      method: "GET",
      headers: { "Authorization": `Bearer ${process.env.CHAINHUB_API_KEY ?? ""}` },
      signal: AbortSignal.timeout(5000),
    });
    results.push({
      service: "ChainHub AI",
      status: res.ok || res.status === 404 || res.status === 405 ? "ok" : "error",
      latencyMs: Date.now() - start,
      detail: res.ok ? undefined : `HTTP ${res.status}`,
    });
  } catch (e: any) {
    results.push({ service: "ChainHub AI", status: "error", latencyMs: 0, detail: e.message?.slice(0, 100) });
  }

  // 3. R2 Storage health (check via head request to public URL)
  try {
    const start = Date.now();
    const publicUrl = process.env.R2_PUBLIC_URL ?? "";
    if (!publicUrl) {
      results.push({ service: "R2 Storage", status: "error", latencyMs: 0, detail: "R2_PUBLIC_URL not configured" });
    } else {
      const res = await fetch(publicUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      results.push({
        service: "R2 Storage",
        status: res.ok || res.status === 403 || res.status === 404 ? "ok" : "error",
        latencyMs: Date.now() - start,
        detail: res.ok ? undefined : `HTTP ${res.status} (bucket accessible)`,
      });
    }
  } catch (e: any) {
    results.push({ service: "R2 Storage", status: "error", latencyMs: 0, detail: e.message?.slice(0, 100) });
  }

  // 4. Queue stats from DB
  const [queuedJobs, processingJobs, failedLast24h, totalUsers] = await Promise.all([
    prisma.job.count({ where: { status: "QUEUED" } }),
    prisma.job.count({ where: { status: "PROCESSING" } }),
    prisma.job.count({
      where: {
        status: "FAILED",
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.user.count(),
  ]);

  return NextResponse.json({
    services: results,
    queue: {
      queued: queuedJobs,
      processing: processingJobs,
      failedLast24h,
    },
    totalUsers,
    checkedAt: new Date().toISOString(),
  });
}
