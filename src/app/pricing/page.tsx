"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Check, Zap, Sparkles, Crown, Star, Calendar, RefreshCw } from "lucide-react";
import PaymentResultDialog, { PaymentDialogState } from "@/components/pricing/PaymentResultDialog";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    priceUSD: "$24",
    priceLabel: "$24 / tháng",
    credits: 500,
    perCredit: "~$0.048/credit",
    cardBg:       "#faf8ff",
    cardBorder:   "#e9e3f9",
    iconBg:       "#ede9fe",
    iconColor:    "#7c3aed",
    accentBg:     "#f3f0ff",
    accentBorder: "#ddd5f9",
    accentColor:  "#6d28d9",
    checkBg:      "#ede9fe",
    checkColor:   "#7c3aed",
    priceColor:   "#0a0a0a",
    badgeBg:      null as string | null,
    badge:        null as string | null,
    highlight:    false,
    features: [
      "500 credits / tháng",
      "Tất cả 10 công cụ AI",
      "Chất lượng SD",
      "Lưu lịch sử",
      "Hỗ trợ qua email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Sparkles,
    priceUSD: "$66",
    priceLabel: "$66 / tháng",
    credits: 1500,
    perCredit: "~$0.044/credit",
    cardBg:       "linear-gradient(145deg, #7c3aed 0%, #4f46e5 100%)",
    cardBorder:   "rgba(255,255,255,0.15)",
    iconBg:       "rgba(255,255,255,0.18)",
    iconColor:    "#fff",
    accentBg:     "rgba(255,255,255,0.12)",
    accentBorder: "rgba(255,255,255,0.2)",
    accentColor:  "#fff",
    checkBg:      "rgba(255,255,255,0.2)",
    checkColor:   "#fff",
    priceColor:   "#fff",
    badgeBg:      "rgba(255,255,255,0.2)" as string | null,
    badge:        "Phổ biến nhất" as string | null,
    highlight:    true,
    features: [
      "1500 credits / tháng",
      "Tất cả 10 công cụ AI",
      "Chất lượng SD + HD",
      "Ưu tiên xử lý",
      "Hỗ trợ ưu tiên",
    ],
  },
  {
    id: "max",
    name: "Max",
    icon: Crown,
    priceUSD: "$100",
    priceLabel: "$100 / tháng",
    credits: 4000,
    perCredit: "~$0.025/credit",
    cardBg:       "#f5f3ff",
    cardBorder:   "#ddd6fe",
    iconBg:       "#ede9fe",
    iconColor:    "#4f46e5",
    accentBg:     "#ede9fe",
    accentBorder: "#c4b5fd",
    accentColor:  "#4f46e5",
    checkBg:      "#ddd6fe",
    checkColor:   "#4f46e5",
    priceColor:   "#0a0a0a",
    badgeBg:      "#ede9fe" as string | null,
    badge:        "Tiết kiệm nhất" as string | null,
    highlight:    false,
    features: [
      "4000 credits / tháng",
      "Tất cả 10 công cụ AI",
      "Chất lượng HD độc quyền",
      "Hỗ trợ ưu tiên 24/7",
      "API access (coming soon)",
    ],
  },
];

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "sb";

// Badge màu theo plan
const PLAN_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  free:    { label: "Free",    bg: "#f4f4f5", color: "#71717a" },
  starter: { label: "Starter", bg: "#ede9fe", color: "#7c3aed" },
  pro:     { label: "Pro",     bg: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff" },
  max:     { label: "Max",     bg: "#1e1b4b", color: "#a5b4fc" },
};

function PlanCard({
  plan,
  currentPlan,
  planExpiresAt,
  onSuccess,
  onPaymentState,
}: {
  plan: typeof PLANS[0];
  currentPlan: string;
  planExpiresAt: string | null;
  onSuccess: (planId: string, expiresAt: string, creditsAdded: number, newBalance: number) => void;
  onPaymentState: (state: PaymentDialogState, opts?: { errorMessage?: string }) => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const Icon = plan.icon;
  const isGradient = plan.cardBg.startsWith("linear");

  // So sánh rank để quyết định hiện/ẩn PayPal
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
        onPaymentState("error", { errorMessage: result.error ?? "Lỗi xử lý thanh toán. Vui lòng thử lại." });
      }
    } catch {
      onPaymentState("error", { errorMessage: "Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại." });
    } finally {
      setProcessing(false);
    }
  };

  const onError = (err: Record<string, unknown>) => {
    console.error(err);
    onPaymentState("error", { errorMessage: "PayPal báo lỗi. Vui lòng thử lại hoặc dùng phương thức thanh toán khác." });
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
    <div className="w-full py-3.5 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2"
      style={isGradient ? { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" } : { background: "#f4f4f5", color: "#71717a" }}>
      <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      Đang xử lý...
    </div>
  );

  return (
    <div
      className="relative rounded-3xl flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
      style={{
        background: plan.cardBg,
        border: `1px solid ${plan.cardBorder}`,
        boxShadow: isActive
          ? "0 0 0 3px #7c3aed, 0 20px 60px rgba(124,58,237,0.25)"
          : plan.highlight
            ? "0 20px 60px rgba(124,58,237,0.2), 0 4px 16px rgba(124,58,237,0.12)"
            : "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Badge */}
      {plan.badge && (
        <div
          className="absolute top-5 right-5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
          style={isGradient
            ? { background: "rgba(255,255,255,0.18)", color: "#fff" }
            : { background: plan.accentBg, color: plan.accentColor, border: `1px solid ${plan.accentBorder}` }
          }
        >
          <Star size={8} fill="currentColor" /> {plan.badge}
        </div>
      )}

      {/* Current plan indicator */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 py-1.5 text-center text-white text-[10px] font-black uppercase tracking-widest"
          style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }}>
          ✦ GÓI CỦA BẠN
        </div>
      )}

      <div className={`p-7 flex flex-col gap-5 h-full ${isActive ? "pt-10" : ""}`}>
        {/* Icon + Name */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: plan.iconBg }}>
            <Icon size={20} style={{ color: plan.iconColor }} />
          </div>
          <p className="text-lg font-bold" style={{ color: plan.priceColor }}>{plan.name}</p>
        </div>

        {/* Price */}
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-3xl font-black tracking-tight" style={{ color: plan.priceColor, letterSpacing: "-0.04em" }}>
              {plan.priceUSD}
            </span>
            <span className="text-sm" style={{ color: isGradient ? "rgba(255,255,255,0.55)" : "#9ca3af" }}>
              / tháng
            </span>
          </div>
          <p className="text-xs mono" style={{ color: isGradient ? "rgba(255,255,255,0.45)" : "#9ca3af" }}>
            {plan.perCredit}
          </p>
        </div>

        {/* Credits badge */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
          style={{ background: plan.accentBg, border: `1px solid ${plan.accentBorder}` }}>
          <Zap size={15} style={{ color: plan.accentColor }} />
          <span className="font-black mono text-sm" style={{ color: plan.accentColor }}>
            {plan.credits.toLocaleString()} credits
          </span>
          <span className="ml-auto text-xs" style={{ color: isGradient ? "rgba(255,255,255,0.5)" : "#9ca3af" }}>
            / tháng
          </span>
        </div>

        {/* Expiry date if current plan */}
        {isActive && planExpiresAt && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: isGradient ? "rgba(255,255,255,0.1)" : "#f0fdf4", border: isGradient ? "1px solid rgba(255,255,255,0.15)" : "1px solid #bbf7d0" }}>
            <Calendar size={13} style={{ color: isGradient ? "#86efac" : "#16a34a" }} />
            <span className="text-xs font-semibold" style={{ color: isGradient ? "#86efac" : "#16a34a" }}>
              Hết hạn: {new Date(planExpiresAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </div>
        )}

        {/* Features */}
        <ul className="flex flex-col gap-2 flex-1">
          {plan.features.map(f => (
            <li key={f} className="flex items-center gap-2.5">
              <div className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center"
                style={{ background: plan.checkBg }}>
                <Check size={11} style={{ color: plan.checkColor }} />
              </div>
              <span className="text-sm" style={{ color: isGradient ? "rgba(255,255,255,0.75)" : "#374151" }}>
                {f}
              </span>
            </li>
          ))}
        </ul>

        {/* PayPal / Action */}
        <div className="mt-3">
          {isActive ? (
            // ── Gói đang dùng: chỉ hiện Gia hạn ──
            <div>
              {processing ? processingUI : (
                <>
                  <p className="text-center text-[11px] mb-2 font-semibold"
                    style={{ color: isGradient ? "rgba(255,255,255,0.5)" : "#9ca3af" }}>
                    <RefreshCw size={10} className="inline mr-1" />Gia hạn thêm 30 ngày
                  </p>
                  {paypalButtons}
                </>
              )}
            </div>
          ) : isDowngrade ? (
            // ── Gói thấp hơn: ẩn hoàn toàn, hiện badge ──
            <div className="w-full py-3.5 rounded-xl text-center text-sm font-semibold"
              style={{ background: "#f4f4f5", color: "#d1d5db" }}>
              Gói thấp hơn gói hiện tại
            </div>
          ) : isUpgrade ? (
            // ── Gói cao hơn: hiện Nâng cấp + PayPal ──
            <div>
              {processing ? processingUI : (
                <>
                  <p className="text-center text-[11px] mb-2 font-semibold"
                    style={{ color: isGradient ? "rgba(255,255,255,0.5)" : "#9ca3af" }}>
                    ↑ Nâng cấp lên {plan.name}
                  </p>
                  {paypalButtons}
                </>
              )}
            </div>
          ) : (
            // ── Free user hoặc gói hết hạn: hiện PayPal mua mới ──
            processing ? processingUI : paypalButtons
          )}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as any;

  // localPlan: cập nhật ngay sau khi mua, không cần đợi session refresh
  const [localPlan, setLocalPlan] = useState<string | null>(null);
  const [localExpiresAt, setLocalExpiresAt] = useState<string | null>(null);

  // Dialog state
  const [dialogState, setDialogState] = useState<PaymentDialogState>("idle");
  const [dialogPlan, setDialogPlan] = useState<string | undefined>();
  const [dialogCredits, setDialogCredits] = useState<number | undefined>();
  const [dialogBalance, setDialogBalance] = useState<number | undefined>();
  const [dialogError, setDialogError] = useState<string | undefined>();

  // Ưu tiên local state (mới mua) > session data (DB)
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
    // Refresh session ngầm
    updateSession();
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}>
        <div className="max-w-5xl mx-auto px-6 py-20">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 mono"
              style={{ background: "#ede9fe", color: "#7c3aed", border: "1px solid #ddd6fe" }}>
              <Zap size={11} /> Gói Tháng · Monthly Plans
            </div>
            <h1 className="font-black text-gray-900 mb-4"
              style={{ fontSize: "clamp(36px,6vw,58px)", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
              Chọn gói{" "}
              <span style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                phù hợp
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-md mx-auto">
              Thanh toán theo tháng. Credits cộng ngay sau khi thanh toán.
            </p>
          </div>

          {/* Current plan status */}
          {session?.user && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: "#f4f4f5", border: "1px solid #e4e4e7" }}>
                <Zap size={13} style={{ color: "#7c3aed" }} />
                <span className="text-sm text-gray-500">Credits hiện tại:</span>
                <span className="text-sm font-black mono" style={{ color: "#7c3aed" }}>{user?.credits ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: badge.bg, border: "1px solid rgba(0,0,0,0.06)" }}>
                <span className="text-sm font-black" style={{ color: badge.color }}>
                  Gói hiện tại: {badge.label}
                </span>
                {planExpiresAt && !isExpired && (
                  <span className="text-xs opacity-70" style={{ color: badge.color }}>
                    · HSD: {new Date(planExpiresAt).toLocaleDateString("vi-VN")}
                  </span>
                )}
                {isExpired && currentPlan !== "free" && (
                  <span className="text-xs text-red-400 font-semibold">· Đã hết hạn</span>
                )}
              </div>
            </div>
          )}

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PLANS.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlan={effectivePlan}
                planExpiresAt={planExpiresAt}
                onSuccess={handleSuccess}
                onPaymentState={handlePaymentState}
              />
            ))}
          </div>

          {/* Info */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "🔒", title: "Thanh toán an toàn", desc: "Powered by PayPal — không lưu thẻ" },
              { icon: "⚡", title: "Credits ngay lập tức", desc: "Cộng vào tài khoản sau thanh toán" },
              { icon: "📅", title: "Thanh toán theo tháng", desc: "Không tự động gia hạn — toàn quyền kiểm soát" },
            ].map(item => (
              <div key={item.title} className="p-5 rounded-2xl text-center border border-gray-100 bg-gray-50">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-sm font-bold text-gray-800 mb-1">{item.title}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs mono text-gray-300 mt-10">
            Powered by PayPal · SSL Secured · Không tự động gia hạn
          </p>
        </div>
      </PayPalScriptProvider>

      {/* ── Payment Result Dialog ── */}
      <PaymentResultDialog
        state={dialogState}
        planName={dialogPlan}
        creditsAdded={dialogCredits}
        newBalance={dialogBalance}
        errorMessage={dialogError}
        onClose={() => setDialogState("idle")}
        onRetry={() => setDialogState("idle")}
      />
    </div>
  );
}
