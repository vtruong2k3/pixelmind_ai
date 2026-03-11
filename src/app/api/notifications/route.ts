// src/app/api/notifications/route.ts
// GET /api/notifications — trả về 10 jobs gần nhất (COMPLETED / FAILED) trong 24h
// Dùng cho NotificationBell ở Navbar

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 giờ trước

  const jobs = await prisma.job.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["COMPLETED", "FAILED"] },
      updatedAt: { gte: since },
    },
    select: {
      id: true,
      status: true,
      outputUrl: true,
      updatedAt: true,
      feature: { select: { name: true, slug: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ notifications: jobs });
}
