import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PAYPAL_PLANS } from "../create-order/route";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const base = process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return { token: data.access_token as string, base };
}

// POST /api/paypal/capture-order
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId là bắt buộc" }, { status: 400 });
    }

    const { token, base } = await getPayPalAccessToken();

    // Capture PayPal order
    const captureRes = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const captureData = await captureRes.json();

    if (captureData.status !== "COMPLETED") {
      return NextResponse.json({ error: "Thanh toán chưa hoàn thành" }, { status: 400 });
    }

    // Đọc custom_id từ purchase_unit
    const customIdRaw = captureData.purchase_units?.[0]?.reference_id
      ?? captureData.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id
      ?? captureData.purchase_units?.[0]?.custom_id;

    let customData: { userId: string; planId: string; credits: number } | null = null;
    try {
      customData = JSON.parse(customIdRaw ?? "{}");
    } catch {
      // fallback: đọc từ session
    }

    const userId = customData?.userId ?? (session.user as any).id;
    const planId = customData?.planId ?? "starter";
    const plan = PAYPAL_PLANS[planId as keyof typeof PAYPAL_PLANS];
    const creditsToAdd = customData?.credits ?? plan?.credits ?? 50;

    // Cộng credits + ghi CreditTransaction (idempotent: kiểm tra orderId)
    const existing = await prisma.creditTransaction.findFirst({
      where: { description: { contains: orderId } },
    });
    if (existing) {
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: creditsToAdd } },
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          amount: creditsToAdd,
          type: "purchase",
          description: `Nạp credits: ${plan?.name ?? planId} (PayPal ${orderId})`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      creditsAdded: creditsToAdd,
      newBalance: updatedUser.credits,
    });
  } catch (error) {
    console.error("[/api/paypal/capture-order] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
