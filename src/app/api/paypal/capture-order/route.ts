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

    // ── Bước 1: Lấy order details TRƯỚC để đọc custom_id (planId) ──
    // Đây là cách đáng tin cậy nhất, vì custom_id trong capture response
    // không phải lúc nào cũng có đầy đủ
    const orderDetailsRes = await fetch(`${base}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orderDetails = await orderDetailsRes.json();

    // custom_id được set khi tạo order trong purchase_units[0].custom_id
    const customIdRaw = orderDetails.purchase_units?.[0]?.custom_id ?? null;
    console.log("[capture-order] custom_id raw:", customIdRaw);
    console.log("[capture-order] order status:", orderDetails.status);

    let customData: { userId: string; planId: string; credits: number } | null = null;
    try {
      if (customIdRaw) customData = JSON.parse(customIdRaw);
    } catch {
      console.warn("[capture-order] Không parse được custom_id:", customIdRaw);
    }

    // Lấy planId từ custom_id (đáng tin cậy) — KHÔNG fallback mù quáng
    const planId = customData?.planId;
    if (!planId || !PAYPAL_PLANS[planId as keyof typeof PAYPAL_PLANS]) {
      console.error("[capture-order] planId không hợp lệ:", planId, "| customData:", customData);
      return NextResponse.json({ error: "Không xác định được gói thanh toán" }, { status: 400 });
    }

    const plan = PAYPAL_PLANS[planId as keyof typeof PAYPAL_PLANS];
    const creditsToAdd = customData?.credits ?? plan.credits;
    const userId = customData?.userId ?? (session.user as any).id;

    console.log(`[capture-order] planId=${planId}, credits=${creditsToAdd}, userId=${userId}`);

    // ── Bước 2: Capture order ──
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

    // ── Bước 3: Idempotent check ──
    const existing = await prisma.creditTransaction.findFirst({
      where: { description: { contains: orderId } },
    });
    if (existing) {
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    // ── Bước 4: Tính ngày hết hạn gói (30 ngày) ──
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true } as any,
    }) as any;

    const now = new Date();
    const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, max: 3 };
    const currentRank = PLAN_RANK[currentUser?.plan ?? "free"] ?? 0;
    const newRank = PLAN_RANK[planId] ?? 1;

    let newExpiresAt: Date;
    if (
      currentUser?.planExpiresAt &&
      currentUser.planExpiresAt > now &&
      currentRank === newRank
    ) {
      // Gia hạn cùng gói: cộng thêm 30 ngày từ ngày hết hạn cũ
      newExpiresAt = new Date((currentUser?.planExpiresAt as any).getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // Gói mới hoặc nâng cấp: 30 ngày từ hôm nay
      newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // ── Bước 5: Cộng credits + set plan + set planExpiresAt ──
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: creditsToAdd },
          plan: planId,
          planExpiresAt: newExpiresAt,
        } as any,
      }),
      prisma.creditTransaction.create({
        data: {
          userId,
          amount:      creditsToAdd,
          type:        "purchase",
          description: `Đăng ký gói ${plan.planKey}: +${creditsToAdd} credits (PayPal ${orderId})`,
          usdAmount:   parseFloat(plan.amountUSD),
        } as any,
      }),
    ]);

    console.log(`[capture-order] ✅ Thành công: userId=${userId} plan=${planId} credits+=${creditsToAdd} expiresAt=${newExpiresAt.toISOString()}`);

    return NextResponse.json({
      success: true,
      creditsAdded: creditsToAdd,
      newBalance: updatedUser.credits,
      plan: planId,
      planExpiresAt: newExpiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[/api/paypal/capture-order] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
