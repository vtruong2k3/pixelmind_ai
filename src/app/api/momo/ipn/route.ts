// POST /api/momo/ipn — MoMo IPN (Instant Payment Notification) callback
// Called by MoMo server after payment completes. Must return HTTP 204.

import { NextRequest, NextResponse } from "next/server";
import { verifyIpnSignature } from "@/lib/momo";
import { processPaymentSuccess, getPlan } from "@/lib/payment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[momo/ipn] Received IPN:", JSON.stringify(body));

    // ── 1. Verify signature ──
    if (!verifyIpnSignature(body)) {
      console.error("[momo/ipn] Invalid signature");
      return new NextResponse(null, { status: 400 });
    }

    // ── 2. Check result ──
    if (body.resultCode !== 0) {
      console.warn(`[momo/ipn] Payment failed: resultCode=${body.resultCode} message=${body.message}`);
      // Still return 204 to acknowledge receipt
      return new NextResponse(null, { status: 204 });
    }

    // ── 3. Decode extraData ──
    let customData: { userId: string; planId: string; credits: number };
    try {
      customData = JSON.parse(Buffer.from(body.extraData, "base64").toString("utf-8"));
    } catch {
      console.error("[momo/ipn] Failed to decode extraData:", body.extraData);
      return new NextResponse(null, { status: 400 });
    }

    const { userId, planId, credits } = customData;
    const plan = getPlan(planId);
    if (!plan) {
      console.error("[momo/ipn] Invalid planId:", planId);
      return new NextResponse(null, { status: 400 });
    }

    // ── 4. Process payment ──
    const result = await processPaymentSuccess({
      userId,
      planId,
      credits,
      orderId: body.orderId,
      gateway: "momo",
      amountUSD: parseFloat(plan.amountUSD),
    });

    console.log("[momo/ipn] Processed:", result.alreadyProcessed ? "already processed" : "success");

    // MoMo requires HTTP 204 response
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[/api/momo/ipn] Error:", error);
    // Return 204 anyway to prevent MoMo retries on server errors
    return new NextResponse(null, { status: 204 });
  }
}
