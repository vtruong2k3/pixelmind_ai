"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Check, Zap, Sparkles, Crown, Star, Calendar, RefreshCw } from "lucide-react";
import PaymentResultDialog, { PaymentDialogState } from "@/components/pricing/PaymentResultDialog";

/* ── Plan Data ── */
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    desc: "Dành cho người mới bắt đầu khám phá AI video & image",
    icon: Zap,
    priceMonthly: 24,
    priceYearly: 17,      // price/mo when billed yearly
    yearlyTotal: 204,      // billed annually
    originalMonthly: 24,   // for strikethrough
    credits: 500,
    highlight: false,
    badge: null as string | null,
    features: {
      credits: [
        { text: "500 Credits /tháng", bold: true },
        "Khoảng 100 video hoặc 250 ảnh",
        "Mua thêm Credit Packs khi cần",
      ],
      features: [
        "Các mô hình Video chất lượng cao",
        "Image & Text-to-Video",
        { text: "720P", highlight: true, rest: " Output" },
        "100+ AI Video Templates & Effects",
        "Cross-Video Character Consistency",
        "AI Video Ads, AI Avatar, AI Music",
        "Fast Generation Mode",
      ],
      benefits: [
        "Private Creation",
        "No Watermarks",
        "Full Commercial Use",
      ],
    },
  },
  {
    id: "pro",
    name: "Pro",
    desc: "Cho content creator và doanh nghiệp chuyên nghiệp",
    icon: Sparkles,
    priceMonthly: 66,
    priceYearly: 47,
    yearlyTotal: 564,
    originalMonthly: 66,
    credits: 1500,
    highlight: true,
    badge: "Phổ biến nhất" as string | null,
    features: {
      credits: [
        { text: "1,500 Credits /tháng", bold: true },
        "Khoảng 300 video hoặc 750 ảnh",
        "Mua thêm Credit Packs khi cần",
      ],
      features: [
        "Các mô hình Video chất lượng cao",
        "Image & Text-to-Video",
        { text: "1080P", highlight: true, rest: " Output" },
        "100+ AI Video Templates & Effects",
        "Cross-Video Character Consistency",
        "AI Video Ads, AI Avatar, AI Music",
        "Fast Generation Mode",
      ],
      benefits: [
        "Private Creation",
        "No Watermarks",
        "Full Commercial Use",
      ],
    },
  },
  {
    id: "max",
    name: "Max",
    desc: "Dành cho studio & team lớn, cần tối đa credits",
    icon: Crown,
    priceMonthly: 100,
    priceYearly: 71,
    yearlyTotal: 852,
    originalMonthly: 100,
    credits: 4000,
    highlight: false,
    badge: "Tiết kiệm nhất" as string | null,
    features: {
      credits: [
        { text: "4,000 Credits /tháng", bold: true },
        "Khoảng 800 video hoặc 2000 ảnh",
        "Mua thêm Credit Packs khi cần",
      ],
      features: [
        "Các mô hình Video chất lượng cao",
        "Image & Text-to-Video",
        { text: "1080P", highlight: true, rest: " Output" },
        "100+ AI Video Templates & Effects",
        "Cross-Video Character Consistency",
        "AI Video Ads, AI Avatar, AI Music",
        "Fast Generation Mode",
      ],
      benefits: [
        "Private Creation",
        "No Watermarks",
        "Full Commercial Use",
        "Priority Support",
      ],
    },
  },
];

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "sb";

// Badge màu theo plan
const PLAN_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  free: { label: "Free", bg: "#f4f4f5", color: "#71717a" },
  starter: { label: "Starter", bg: "#ede9fe", color: "#7c3aed" },
  pro: { label: "Pro", bg: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff" },
  max: { label: "Max", bg: "#1e1b4b", color: "#a5b4fc" },
};

/* ── Feature Item Renderer ── */
function FeatureItem({ item, isHighlightPlan }: { item: string | { text: string; bold?: boolean; highlight?: boolean; rest?: string }; isHighlightPlan: boolean }) {
  if (typeof item === "string") {
    return (
      <li style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: isHighlightPlan ? "rgba(255,255,255,0.75)" : "#4b5563", lineHeight: 1.6 }}>
        <span style={{ color: isHighlightPlan ? "rgba(255,255,255,0.4)" : "#c7c7c7", marginTop: 2 }}>•</span>
        {item}
      </li>
    );
  }
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: isHighlightPlan ? "rgba(255,255,255,0.75)" : "#4b5563", lineHeight: 1.6 }}>
      <span style={{ color: isHighlightPlan ? "rgba(255,255,255,0.4)" : "#c7c7c7", marginTop: 2 }}>•</span>
      <span>
        {item.bold && <strong style={{ color: isHighlightPlan ? "#fff" : "#7c3aed" }}>{item.text}</strong>}
        {item.highlight && <span style={{ color: "#7c3aed", fontWeight: 700 }}>{item.text}</span>}
        {!item.bold && !item.highlight && item.text}
        {item.rest && <span>{item.rest}</span>}
      </span>
    </li>
  );
}

/* ── Plan Card ── */
function PlanCard({
  plan,
  isYearly,
  currentPlan,
  planExpiresAt,
  onSuccess,
  onPaymentState,
}: {
  plan: typeof PLANS[0];
  isYearly: boolean;
  currentPlan: string;
  planExpiresAt: string | null;
  onSuccess: (planId: string, expiresAt: string, creditsAdded: number, newBalance: number) => void;
  onPaymentState: (state: PaymentDialogState, opts?: { errorMessage?: string }) => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [showPaypal, setShowPaypal] = useState(false);
  const Icon = plan.icon;

  const price = isYearly ? plan.priceYearly : plan.priceMonthly;
  const originalPrice = plan.originalMonthly;

  // Plan rank
  const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, max: 3 };
  const myRank = PLAN_RANK[currentPlan] ?? 0;
  const planRank = PLAN_RANK[plan.id] ?? 0;

  const isCurrentPlan = currentPlan === plan.id;
  const isExpired = planExpiresAt ? new Date(planExpiresAt) < new Date() : false;
  const isActive = isCurrentPlan && !isExpired;
  const isUpgrade = planRank > myRank;
  const isDowngrade = planRank < myRank;

  const createOrder = async () => {
    if (!session?.user) { router.push("/login?callbackUrl=/pricing"); return ""; }
    const res = await fetch("/api/paypal/create-order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id }),
    });
    return (await res.json()).orderId;
  };

  const onApprove = async (data: { orderID: string }) => {
    setProcessing(true);
    onPaymentState("loading");
    try {
      const res = await fetch("/api/paypal/capture-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      const result = await res.json();
      if (result.success) {
        onSuccess(
          plan.id,
          result.planExpiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          result.creditsAdded ?? plan.credits,
          result.newBalance ?? 0,
        );
      } else {
        onPaymentState("error", { errorMessage: result.error ?? "Lỗi xử lý thanh toán." });
      }
    } catch {
      onPaymentState("error", { errorMessage: "Không thể kết nối máy chủ." });
    } finally {
      setProcessing(false);
    }
  };

  const onError = (err: Record<string, unknown>) => {
    console.error(err);
    onPaymentState("error", { errorMessage: "PayPal báo lỗi. Vui lòng thử lại." });
  };

  const onCancel = () => {
    onPaymentState("cancelled");
  };

  const paypalButtons = (
    <PayPalButtons
      style={{ layout: "vertical", color: plan.highlight ? "white" : "gold", shape: "pill", label: "pay", height: 44 }}
      createOrder={createOrder}
      onApprove={onApprove}
      onCancel={onCancel}
      onError={onError}
    />
  );

  const processingUI = (
    <div style={{
      width: "100%", padding: "14px 0", borderRadius: 12, textAlign: "center",
      fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      background: plan.highlight ? "rgba(255,255,255,0.12)" : "#f4f4f5",
      color: plan.highlight ? "rgba(255,255,255,0.6)" : "#71717a",
    }}>
      <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
      Đang xử lý...
    </div>
  );

  /* Subscribe button style */
  const subscribeBtn = (
    <button
      onClick={() => {
        if (!session?.user) { router.push("/login?callbackUrl=/pricing"); return; }
        setShowPaypal(!showPaypal);
      }}
      style={{
        width: "100%", padding: "14px 0", borderRadius: 12,
        fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
        background: plan.highlight
          ? "rgba(255,255,255,0.2)"
          : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
        color: "#fff",
        transition: "all 0.2s",
        boxShadow: plan.highlight ? "none" : "0 4px 14px rgba(124,58,237,0.3)",
      }}
    >
      Subscribe
    </button>
  );

  return (
    <div className="pricing-card" style={{
      position: "relative",
      borderRadius: 20,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      cursor: "default",
      background: plan.highlight
        ? "linear-gradient(145deg, #7c3aed 0%, #4f46e5 100%)"
        : "#fff",
      border: isActive
        ? "2px solid #7c3aed"
        : plan.highlight
          ? "none"
          : "1px solid #ebebeb",
      boxShadow: plan.highlight
        ? "0 16px 48px rgba(124,58,237,0.18), 0 4px 12px rgba(124,58,237,0.08)"
        : "0 2px 16px rgba(0,0,0,0.05)",
    }}>
      {/* Badge */}
      {plan.badge && (
        <div style={{
          position: "absolute", top: 16, right: 16,
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: 20,
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
          background: plan.highlight ? "rgba(255,255,255,0.18)" : "#ede9fe",
          color: plan.highlight ? "#fff" : "#7c3aed",
          border: plan.highlight ? "none" : "1px solid #ddd6fe",
        }}>
          <Star size={8} fill="currentColor" /> {plan.badge}
        </div>
      )}

      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
        {/* Plan name */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: plan.highlight ? "#fff" : "#111", margin: 0 }}>
              {plan.name}
            </h3>
            {isActive && (
              <span style={{
                padding: "3px 10px", borderRadius: 20,
                fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em",
                background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                color: "#fff",
              }}>
                ✦ Gói của bạn
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.6)" : "#9ca3af", marginTop: 4 }}>
            {plan.desc}
          </p>
        </div>

        {/* Price */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 40, fontWeight: 900, color: plan.highlight ? "#fff" : "#111", letterSpacing: "-0.04em" }}>
              ${price}
            </span>
            <span style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,0.5)" : "#9ca3af" }}>
              USD/tháng
            </span>
            {isYearly && originalPrice > price && (
              <span style={{ fontSize: 16, color: plan.highlight ? "rgba(255,255,255,0.35)" : "#d1d5db", textDecoration: "line-through" }}>
                ${originalPrice}
              </span>
            )}
          </div>
          {isYearly && (
            <p style={{ fontSize: 12, color: plan.highlight ? "rgba(255,255,255,0.45)" : "#7c3aed", marginTop: 4, fontWeight: 600 }}>
              ${plan.yearlyTotal} USD thanh toán hàng năm
            </p>
          )}
        </div>

        {/* CTA Button */}
        <div>
          {isActive ? (
            <div>
              {processing ? processingUI : (
                <>
                  {!showPaypal ? (
                    <button
                      onClick={() => setShowPaypal(true)}
                      style={{
                        width: "100%", padding: "14px 0", borderRadius: 12,
                        fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
                        background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                        color: "#fff", boxShadow: "0 4px 14px rgba(124,58,237,0.3)",
                      }}
                    >
                      Gia hạn
                    </button>
                  ) : (
                    <div>
                      <p style={{ textAlign: "center", fontSize: 11, marginBottom: 8, fontWeight: 600, color: plan.highlight ? "rgba(255,255,255,0.5)" : "#9ca3af" }}>
                        <RefreshCw size={10} style={{ display: "inline", marginRight: 4 }} />Chọn phương thức thanh toán
                      </p>
                      {paypalButtons}
                      <button onClick={() => setShowPaypal(false)}
                        style={{ width: "100%", padding: "8px 0", background: "transparent", border: "none", color: plan.highlight ? "rgba(255,255,255,0.4)" : "#9ca3af", fontSize: 12, cursor: "pointer", marginTop: 4 }}>
                        ← Quay lại
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : isDowngrade ? (
            <div style={{
              width: "100%", padding: "14px 0", borderRadius: 12, textAlign: "center",
              fontSize: 14, fontWeight: 600,
              background: "#f4f4f5", color: "#d1d5db",
            }}>
              Gói thấp hơn gói hiện tại
            </div>
          ) : (
            <div>
              {processing ? processingUI : (
                !showPaypal ? subscribeBtn : (
                  <div>
                    <p style={{ textAlign: "center", fontSize: 11, marginBottom: 8, fontWeight: 600, color: plan.highlight ? "rgba(255,255,255,0.5)" : "#9ca3af" }}>
                      Chọn phương thức thanh toán
                    </p>
                    {paypalButtons}
                    <button onClick={() => setShowPaypal(false)}
                      style={{ width: "100%", padding: "8px 0", background: "transparent", border: "none", color: plan.highlight ? "rgba(255,255,255,0.4)" : "#9ca3af", fontSize: 12, cursor: "pointer", marginTop: 4 }}>
                      ← Quay lại
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: plan.highlight ? "rgba(255,255,255,0.12)" : "#f0f0f0" }} />

        {/* CREDITS section */}
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: plan.highlight ? "rgba(255,255,255,0.6)" : "#7c3aed", marginBottom: 10 }}>
            CREDITS
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {plan.features.credits.map((item, i) => (
              <FeatureItem key={i} item={item} isHighlightPlan={plan.highlight} />
            ))}
          </ul>
        </div>

        {/* FEATURES section */}
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: plan.highlight ? "rgba(255,255,255,0.6)" : "#7c3aed", marginBottom: 10 }}>
            FEATURES
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {plan.features.features.map((item, i) => (
              <FeatureItem key={i} item={item} isHighlightPlan={plan.highlight} />
            ))}
          </ul>
        </div>

        {/* BENEFITS section */}
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: plan.highlight ? "rgba(255,255,255,0.6)" : "#7c3aed", marginBottom: 10 }}>
            BENEFITS
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {plan.features.benefits.map((item, i) => (
              <FeatureItem key={i} item={item} isHighlightPlan={plan.highlight} />
            ))}
          </ul>
        </div>

        {/* Expiry if active */}
        {isActive && planExpiresAt && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 12,
            background: plan.highlight ? "rgba(255,255,255,0.1)" : "#f0fdf4",
            border: plan.highlight ? "1px solid rgba(255,255,255,0.15)" : "1px solid #bbf7d0",
          }}>
            <Calendar size={13} style={{ color: plan.highlight ? "#86efac" : "#16a34a" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: plan.highlight ? "#86efac" : "#16a34a" }}>
              Hết hạn: {new Date(planExpiresAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function PricingPage() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as any;
  const [isYearly, setIsYearly] = useState(true);

  const [localPlan, setLocalPlan] = useState<string | null>(null);
  const [localExpiresAt, setLocalExpiresAt] = useState<string | null>(null);

  const [dialogState, setDialogState] = useState<PaymentDialogState>("idle");
  const [dialogPlan, setDialogPlan] = useState<string | undefined>();
  const [dialogCredits, setDialogCredits] = useState<number | undefined>();
  const [dialogBalance, setDialogBalance] = useState<number | undefined>();
  const [dialogError, setDialogError] = useState<string | undefined>();

  const sessionPlan: string = user?.plan ?? "free";
  const sessionExpiresAt: string | null = user?.planExpiresAt ?? null;
  const currentPlan = localPlan ?? sessionPlan;
  const planExpiresAt = localExpiresAt ?? sessionExpiresAt;

  const isExpired = planExpiresAt ? new Date(planExpiresAt) < new Date() : false;
  const effectivePlan = isExpired ? "free" : currentPlan;
  const badge = PLAN_BADGE[effectivePlan] ?? PLAN_BADGE.free;

  const handlePaymentState = (state: PaymentDialogState, opts?: { errorMessage?: string }) => {
    if (state === "error") setDialogError(opts?.errorMessage);
    setDialogState(state);
  };

  const handleSuccess = async (planId: string, expiresAt: string, creditsAdded: number, newBalance: number) => {
    setLocalPlan(planId);
    setLocalExpiresAt(expiresAt);
    setDialogPlan(planId.charAt(0).toUpperCase() + planId.slice(1));
    setDialogCredits(creditsAdded);
    setDialogBalance(newBalance);
    setDialogState("success");
    updateSession();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />

      <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 60px" }}>

          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h1 style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 900, color: "#111", letterSpacing: "-0.04em", lineHeight: 1.1,
              marginBottom: 16,
            }}>
              Best AI Video &{" "}
              <span style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Image Generator
              </span>
            </h1>
            <p style={{ fontSize: 16, color: "#9ca3af", maxWidth: 500, margin: "0 auto 32px" }}>
              Thanh toán linh hoạt. Credits cộng ngay sau khi thanh toán thành công.
            </p>

            {/* ── Yearly / Monthly Toggle ── */}
            <div style={{
              display: "inline-flex", alignItems: "center",
              padding: 4, borderRadius: 50,
              background: "#f4f4f5", border: "1px solid #e5e7eb",
            }}>
              <button
                onClick={() => setIsYearly(true)}
                style={{
                  padding: "10px 24px", borderRadius: 50,
                  fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                  transition: "all 0.2s",
                  background: isYearly ? "#111" : "transparent",
                  color: isYearly ? "#fff" : "#9ca3af",
                }}
              >
                Yearly
                {isYearly && (
                  <span style={{
                    marginLeft: 8, padding: "2px 8px", borderRadius: 20,
                    fontSize: 10, fontWeight: 800,
                    background: "#7c3aed", color: "#fff",
                  }}>
                    29% off
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsYearly(false)}
                style={{
                  padding: "10px 24px", borderRadius: 50,
                  fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                  transition: "all 0.2s",
                  background: !isYearly ? "#111" : "transparent",
                  color: !isYearly ? "#fff" : "#9ca3af",
                }}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* ── Current plan status ── */}
          {session?.user && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 40 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 50,
                background: "#f4f4f5", border: "1px solid #e4e4e7",
              }}>
                <Zap size={13} style={{ color: "#7c3aed" }} />
                <span style={{ fontSize: 14, color: "#6b7280" }}>Credits:</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#7c3aed", fontFamily: "monospace" }}>{user?.credits ?? 0}</span>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 50,
                background: badge.bg, border: "1px solid rgba(0,0,0,0.06)",
              }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: badge.color }}>
                  Gói: {badge.label}
                </span>
                {planExpiresAt && !isExpired && (
                  <span style={{ fontSize: 12, opacity: 0.7, color: badge.color }}>
                    · HSD: {new Date(planExpiresAt).toLocaleDateString("vi-VN")}
                  </span>
                )}
                {isExpired && currentPlan !== "free" && (
                  <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>· Đã hết hạn</span>
                )}
              </div>
            </div>
          )}

          {/* ── Plan Cards Grid ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24, alignItems: "stretch",
          }}>
            {PLANS.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isYearly={isYearly}
                currentPlan={effectivePlan}
                planExpiresAt={planExpiresAt}
                onSuccess={handleSuccess}
                onPaymentState={handlePaymentState}
              />
            ))}
          </div>

          {/* ── Trust badges ── */}
          <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { icon: "🔒", title: "Thanh toán an toàn", desc: "Powered by PayPal — không lưu thẻ" },
              { icon: "⚡", title: "Credits ngay lập tức", desc: "Cộng vào tài khoản sau thanh toán" },
              { icon: "📅", title: "Không tự động gia hạn", desc: "Toàn quyền kiểm soát chi phí" },
            ].map(item => (
              <div key={item.title} style={{
                padding: 20, borderRadius: 16, textAlign: "center",
                border: "1px solid #f0f0f0", background: "#fafafa",
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 4 }}>{item.title}</p>
                <p style={{ fontSize: 12, color: "#9ca3af" }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* ── FAQ Section ── */}
          <div style={{ maxWidth: 900, margin: "64px auto 0" }}>
            <h2 style={{ textAlign: "center", fontSize: 50, fontWeight: 700, color: "#111", marginBottom: 32 }}>
              FAQ
            </h2>
            {[
              { q: "Credits là gì và cách sử dụng?", a: "Credits là đơn vị dùng để tạo video/ảnh AI. Mỗi tác vụ tiêu thụ số credits khác nhau." },
              { q: "Tôi có thể dùng thử trước khi mua không?", a: "Có! Đăng ký miễn phí để nhận credits dùng thử các công cụ AI." },
              { q: "Có thể mua 1 tháng không tự động gia hạn?", a: "Có. Chúng tôi không tự động gia hạn — bạn toàn quyền kiểm soát." },
              { q: "Video có watermark không?", a: "Các gói trả phí đều không có watermark và có quyền sử dụng thương mại." },
              { q: "Hết credits thì sao?", a: "Bạn có thể mua thêm Credit Packs bất cứ lúc nào mà không cần nâng gói." },
            ].map((faq, i) => (
              <details key={i} style={{
                borderBottom: "1px solid #f0f0f0", padding: "16px 0",
              }}>
                <summary style={{
                  fontSize: 15, fontWeight: 600, color: "#333", cursor: "pointer",
                  listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  {faq.q}
                  <span style={{ color: "#d1d5db", fontSize: 20, fontWeight: 300 }}>+</span>
                </summary>
                <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8, lineHeight: 1.7 }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "#d1d5db", marginTop: 40, fontFamily: "monospace" }}>
            Powered by PayPal · SSL Secured · Không tự động gia hạn
          </p>
        </div>
      </PayPalScriptProvider>

      <PaymentResultDialog
        state={dialogState}
        planName={dialogPlan}
        creditsAdded={dialogCredits}
        newBalance={dialogBalance}
        errorMessage={dialogError}
        onClose={() => setDialogState("idle")}
        onRetry={() => setDialogState("idle")}
      />

      <style>{`
        .pricing-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(124,58,237,0.15), 0 8px 20px rgba(0,0,0,0.08) !important;
        }
      `}</style>
    </div>
  );
}
