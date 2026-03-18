import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

// GET /api/admin/users/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const guard   = requireRoleResponse((session?.user as any)?.role, "ADMIN");
  if (guard) return guard;

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, image: true,
      role: true, credits: true, plan: true, planExpiresAt: true,
      isBanned: true, banReason: true,
      createdAt: true,
      jobs: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, featureName: true, status: true, creditUsed: true, createdAt: true } },
      creditTransactions: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, amount: true, type: true, description: true, createdAt: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

// PATCH /api/admin/users/[id] — update role, credits, plan
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const guard   = requireRoleResponse((session?.user as any)?.role, "ADMIN");
  if (guard) return guard;

  const { id } = await params;
  const body = await req.json();
  const allowed = ["role", "credits", "plan", "isBanned", "banReason"];
  const data: any = {};
  for (const k of allowed) { if (k in body) data[k] = body[k]; }

  // Handle planExpiresAt: null = reset, ISO string = set date
  if ("planExpiresAt" in body) {
    data.planExpiresAt = body.planExpiresAt ? new Date(body.planExpiresAt) : null;
  }

  // Không cho phép tự hạ role chính mình
  if (id === session!.user!.id && body.role && body.role !== "ADMIN") {
    return NextResponse.json({ error: "Không thể thay đổi role của chính mình" }, { status: 400 });
  }

  // Nếu tặng credits → tạo transaction
  if (typeof body.creditAmount === "number" && body.creditAmount !== 0) {
    const [user] = await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { credits: { increment: body.creditAmount } } }),
      prisma.creditTransaction.create({
        data: { userId: id, amount: body.creditAmount, type: body.creditAmount > 0 ? "bonus" : "spend", description: body.creditDescription ?? "Admin adjustment" },
      }),
    ]);
    logAudit({ action: "gift_credits", actorId: session!.user!.id!, actorEmail: session!.user!.email!, targetType: "user", targetId: id, targetLabel: user.email, details: { amount: body.creditAmount, description: body.creditDescription } });
    return NextResponse.json({ ok: true, user });
  }

  const user = await prisma.user.update({ where: { id }, data });
  // Log audit for notable changes
  if (data.isBanned !== undefined) {
    logAudit({ action: data.isBanned ? "ban_user" : "unban_user", actorId: session!.user!.id!, actorEmail: session!.user!.email!, targetType: "user", targetId: id, targetLabel: user.email, details: { banReason: data.banReason } });
  }
  if (data.role) {
    logAudit({ action: "update_role", actorId: session!.user!.id!, actorEmail: session!.user!.email!, targetType: "user", targetId: id, targetLabel: user.email, details: { newRole: data.role } });
  }
  return NextResponse.json({ ok: true, user });
}

// DELETE /api/admin/users/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const guard   = requireRoleResponse((session?.user as any)?.role, "ADMIN");
  if (guard) return guard;

  const { id } = await params;
  if (id === session!.user!.id) {
    return NextResponse.json({ error: "Không thể tự xóa chính mình" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  await prisma.user.delete({ where: { id } });
  logAudit({ action: "delete_user", actorId: session!.user!.id!, actorEmail: session!.user!.email!, targetType: "user", targetId: id, targetLabel: user?.email ?? id });
  return NextResponse.json({ ok: true });
}
