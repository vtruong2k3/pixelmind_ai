import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";

// POST /api/staff/credits — tặng credits, giới hạn 500/lần
export async function POST(req: NextRequest) {
  const session = await auth();
  const guard   = requireRoleResponse(session?.user?.role, "STAFF");
  if (guard) return guard;

  const { userId, amount, description } = await req.json();
  if (!userId || typeof amount !== "number" || !description) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (Math.abs(amount) > 500) {
    return NextResponse.json({ error: "STAFF chỉ được tặng tối đa 500 credits mỗi lần" }, { status: 400 });
  }

  const [user] = await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { credits: { increment: amount } }, select: { id: true, name: true, email: true, credits: true } }),
    prisma.creditTransaction.create({ data: { userId, amount, type: "bonus", description: `[STAFF] ${description}` } }),
  ]);
  return NextResponse.json({ ok: true, user });
}
