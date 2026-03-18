// POST /api/momo/create — Create MoMo payment order
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlan } from "@/lib/payment";
import { createMoMoPayment } from "@/lib/momo";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();
    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: "Plan không hợp lệ" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const timestamp = Date.now();
    const orderId = `PM_${userId.slice(-6)}_${timestamp}`;
    const requestId = `REQ_${timestamp}`;

    // Encode extraData: { userId, planId, credits }
    const extraData = Buffer.from(
      JSON.stringify({ userId, planId, credits: plan.credits })
    ).toString("base64");

    // Build callback URLs
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${baseUrl}/api/momo/callback`;
    const ipnUrl = `${baseUrl}/api/momo/ipn`;

    const result = await createMoMoPayment({
      orderId,
      requestId,
      amount: plan.amountVND,
      orderInfo: `PixelMind AI - ${plan.name}`,
      extraData,
      redirectUrl,
      ipnUrl,
    });

    return NextResponse.json({
      payUrl: result.payUrl,
      deeplink: result.deeplink,
      qrCodeUrl: result.qrCodeUrl,
      orderId: result.orderId,
    });
  } catch (error) {
    console.error("[/api/momo/create] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
