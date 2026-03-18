// src/lib/payment.ts
// Shared payment logic for PayPal + MoMo

import { prisma } from "@/lib/prisma";
import { sendPackageUpgradeEmail } from "@/lib/mail";
import { sendDiscordPaymentNotification } from "@/lib/discord";

/* ── Plans (shared across all gateways) ── */
export const PLANS = {
  starter: {
    credits: 500,
    amountUSD: "24.00",
    amountVND: 600000,       // ~$24 × 25,000₫
    name: "Starter — 500 Credits/tháng",
    planKey: "starter",
  },
  pro: {
    credits: 1500,
    amountUSD: "66.00",
    amountVND: 1650000,      // ~$66 × 25,000₫
    name: "Pro — 1500 Credits/tháng",
    planKey: "pro",
  },
  max: {
    credits: 4000,
    amountUSD: "100.00",
    amountVND: 2500000,      // ~$100 × 25,000₫
    name: "Max — 4000 Credits/tháng",
    planKey: "max",
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlan(planId: string) {
  return PLANS[planId as PlanId] ?? null;
}

/* ── Plan Ranking ── */
const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, max: 3 };

/* ── Shared payment success handler ── */
export interface ProcessPaymentParams {
  userId: string;
  planId: string;
  credits: number;
  orderId: string;        // unique transaction ID (PayPal orderId or MoMo orderId)
  gateway: "paypal" | "momo";
  amountUSD?: number;     // for logging
  sessionEmail?: string;  // fallback email
  sessionName?: string;   // fallback name
}

export interface ProcessPaymentResult {
  success: boolean;
  alreadyProcessed?: boolean;
  creditsAdded: number;
  newBalance: number;
  plan: string;
  planExpiresAt: string;
}

export async function processPaymentSuccess(params: ProcessPaymentParams): Promise<ProcessPaymentResult> {
  const { userId, planId, credits, orderId, gateway, amountUSD, sessionEmail, sessionName } = params;
  const plan = getPlan(planId);
  if (!plan) throw new Error(`Invalid planId: ${planId}`);

  // ── 1. Idempotency check ──
  const existing = await prisma.creditTransaction.findFirst({
    where: { description: { contains: orderId } },
  });
  if (existing) {
    return {
      success: true,
      alreadyProcessed: true,
      creditsAdded: 0,
      newBalance: 0,
      plan: planId,
      planExpiresAt: new Date().toISOString(),
    };
  }

  // ── 2. Calculate plan expiry (30 days) ──
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, plan: true, planExpiresAt: true } as any,
  }) as any;

  const now = new Date();
  const currentRank = PLAN_RANK[currentUser?.plan ?? "free"] ?? 0;
  const newRank = PLAN_RANK[planId] ?? 1;

  let newExpiresAt: Date;
  if (
    currentUser?.planExpiresAt &&
    currentUser.planExpiresAt > now &&
    currentRank === newRank
  ) {
    // Same plan renewal: extend from current expiry
    newExpiresAt = new Date(currentUser.planExpiresAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  } else {
    // New plan or upgrade: 30 days from today
    newExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  // ── 3. Atomic transaction: credits + plan + log ──
  const gatewayLabel = gateway === "momo" ? "MoMo" : "PayPal";
  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        credits: { increment: credits },
        plan: planId,
        planExpiresAt: newExpiresAt,
      } as any,
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount: credits,
        type: "purchase",
        description: `Đăng ký gói ${plan.planKey}: +${credits} credits (${gatewayLabel} ${orderId})`,
        usdAmount: amountUSD ?? parseFloat(plan.amountUSD),
      } as any,
    }),
  ]);

  console.log(`[payment] Thành công: userId=${userId} plan=${planId} credits+=${credits} gateway=${gateway} expiresAt=${newExpiresAt.toISOString()}`);

  // ── 4. Notifications (non-blocking) ──
  const emailToNotify = currentUser?.email ?? sessionEmail;
  if (emailToNotify) {
    sendPackageUpgradeEmail(
      emailToNotify,
      plan.planKey || planId,
      "30 ngày",
      newExpiresAt
    ).catch(err => console.error("[payment] Email error:", err));

    sendDiscordPaymentNotification({
      email: emailToNotify,
      username: currentUser?.name ?? sessionName ?? "Unknown User",
      planName: plan.planKey || planId,
      credits,
      amountUSD: amountUSD ?? parseFloat(plan.amountUSD),
      purchaseDate: now,
      expirationDate: newExpiresAt,
    }).catch(err => console.error("[payment] Discord error:", err));
  }

  return {
    success: true,
    creditsAdded: credits,
    newBalance: updatedUser.credits,
    plan: planId,
    planExpiresAt: newExpiresAt.toISOString(),
  };
}
