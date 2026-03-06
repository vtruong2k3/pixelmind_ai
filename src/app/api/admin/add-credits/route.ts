import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/add-credits — Admin only: add credits to any user for testing
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = (session?.user as any)?.isAdmin === true;
    if (!session?.user || !isAdmin) {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    const { userId, amount = 100 } = await req.json();
    const targetId: string = userId ?? (session.user as any).id;

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: targetId },
        data: { credits: { increment: amount } },
        select: { id: true, email: true, credits: true },
      }),
      prisma.creditTransaction.create({
        data: {
          userId: targetId,
          amount,
          type: "earn",
          description: `Admin tặng credits (test)`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      userId: targetId,
      creditsAdded: amount,
      newBalance: updatedUser.credits,
    });
  } catch (error) {
    console.error("[/api/admin/add-credits] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
