import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";

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
      role: true, credits: true, plan: true, planExpiresAt: true, createdAt: true,
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
  const allowed = ["role", "credits", "plan"];
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
    return NextResponse.json({ ok: true, user });
  }

  const user = await prisma.user.update({ where: { id }, data });
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
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
