import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// ── Gói tháng mới (monthly subscription) ──
export const PAYPAL_PLANS = {
  starter: { credits: 500,  amountUSD: "24.00", name: "Starter — 500 Credits/tháng",  planKey: "starter" },
  pro:     { credits: 1500, amountUSD: "66.00", name: "Pro — 1500 Credits/tháng",      planKey: "pro"     },
  max:     { credits: 4000, amountUSD: "100.00",name: "Max — 4000 Credits/tháng",      planKey: "max"     },
};

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

// POST /api/paypal/create-order
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();
    const plan = PAYPAL_PLANS[planId as keyof typeof PAYPAL_PLANS];
    if (!plan) {
      return NextResponse.json({ error: "Plan không hợp lệ" }, { status: 400 });
    }

    const { token, base } = await getPayPalAccessToken();

    const res = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: plan.amountUSD,
            },
            description: plan.name,
            custom_id: JSON.stringify({
              userId: (session.user as any).id,
              planId,
              credits: plan.credits,
            }),
          },
        ],
        application_context: {
          brand_name: "PixelMind AI",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
        },
      }),
    });

    const order = await res.json();
    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("[/api/paypal/create-order] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
