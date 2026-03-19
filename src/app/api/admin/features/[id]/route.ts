import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoleResponse } from "@/lib/roles";

// PATCH /api/admin/features/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const guard   = requireRoleResponse(session?.user?.role, "ADMIN");
  if (guard) return guard;

  const { id } = await params;
  const body    = await req.json();
  const feature = await prisma.feature.update({ where: { id }, data: body });
  return NextResponse.json({ feature });
}

// DELETE /api/admin/features/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const guard   = requireRoleResponse(session?.user?.role, "ADMIN");
  if (guard) return guard;

  const { id } = await params;
  await prisma.feature.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
