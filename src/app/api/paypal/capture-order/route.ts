import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PAYPAL_PLANS } from "../create-order/route";
import { processPaymentSuccess } from "@/lib/payment";

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

    // ── Step 1: Get order details to read custom_id ──
    const orderDetailsRes = await fetch(`${base}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orderDetails = await orderDetailsRes.json();

    const customIdRaw = orderDetails.purchase_units?.[0]?.custom_id ?? null;
    console.log("[capture-order] custom_id raw:", customIdRaw);
    console.log("[capture-order] order status:", orderDetails.status);

    let customData: { userId: string; planId: string; credits: number } | null = null;
    try {
      if (customIdRaw) customData = JSON.parse(customIdRaw);
    } catch {
      console.warn("[capture-order] Không parse được custom_id:", customIdRaw);
    }

    const planId = customData?.planId;
    if (!planId || !PAYPAL_PLANS[planId as keyof typeof PAYPAL_PLANS]) {
      console.error("[capture-order] planId không hợp lệ:", planId, "| customData:", customData);
      return NextResponse.json({ error: "Không xác định được gói thanh toán" }, { status: 400 });
    }

    const plan = PAYPAL_PLANS[planId as keyof typeof PAYPAL_PLANS];
    const creditsToAdd = customData?.credits ?? plan.credits;
    const userId = customData?.userId ?? (session.user as any).id;

    console.log(`[capture-order] planId=${planId}, credits=${creditsToAdd}, userId=${userId}`);

    // ── Step 2: Capture order ──
    const captureRes = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const captureData = await captureRes.json();
    console.log("[capture-order] capture status:", captureData.status);

    if (captureData.status !== "COMPLETED") {
      return NextResponse.json({ error: "Thanh toán chưa hoàn thành" }, { status: 400 });
    }

    // ── Step 3-5: Use shared payment logic ──
    const result = await processPaymentSuccess({
      userId,
      planId,
      credits: creditsToAdd,
      orderId,
      gateway: "paypal",
      amountUSD: parseFloat(plan.amountUSD),
      sessionEmail: session.user?.email ?? undefined,
      sessionName: session.user?.name ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/paypal/capture-order] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
