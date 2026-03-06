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

// GET /api/admin/users/[id]  — full user detail
export const GET = auth(async function GET(req, { params }: any) {
  if (!isAdminUser(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, image: true,
      credits: true, plan: true, planExpiresAt: true,
      createdAt: true, updatedAt: true,
      _count: { select: { jobs: true, creditTransactions: true } },
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, featureName: true, featureSlug: true,
          status: true, quality: true, creditUsed: true,
          outputUrl: true, createdAt: true,
        },
      },
      creditTransactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, amount: true, type: true, description: true, createdAt: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
});

// PATCH /api/admin/users/[id]  — edit credits, plan, planExpiresAt
export const PATCH = auth(async function PATCH(req, { params }: any) {
  if (!isAdminUser(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const updateData: any = {};
  if (typeof body.credits === "number") updateData.credits = body.credits;
  if (typeof body.plan === "string") updateData.plan = body.plan;
  if (body.planExpiresAt !== undefined) {
    updateData.planExpiresAt = body.planExpiresAt ? new Date(body.planExpiresAt) : null;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true, name: true, email: true,
      credits: true, plan: true, planExpiresAt: true,
    },
  });

  // Log credit change as admin transaction if credits changed
  if (typeof body.credits === "number") {
    const previous = await prisma.user.findUnique({ where: { id }, select: { credits: true } });
    const diff = body.credits - (previous?.credits ?? 0);
    if (diff !== 0) {
      await prisma.creditTransaction.create({
        data: {
          userId: id,
          amount: diff,
          type: diff > 0 ? "earn" : "spend",
          description: `Admin adjustment (${diff > 0 ? "+" : ""}${diff} credits)`,
        },
      });
    }
  }

  return NextResponse.json({ ok: true, user: updated });
});

// DELETE /api/admin/users/[id]  — delete user account
export const DELETE = auth(async function DELETE(req, { params }: any) {
  if (!isAdminUser(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
});
