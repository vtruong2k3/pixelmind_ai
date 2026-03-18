"use client";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Zap, Sparkles, Crown, Star, Calendar, RefreshCw, Wallet } from "lucide-react";
import PaymentResultDialog, { PaymentDialogState } from "@/components/pricing/PaymentResultDialog";

/* ── VND Price Map (matching lib/payment.ts) ── */
const VND_PRICES: Record<string, number> = {
  starter: 600000,
  pro: 1650000,
  max: 2500000,
};

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + "₫";
}

/* ── Plan Data ── */
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    desc: "Dành cho người mới bắt đầu khám phá AI video & image",
    icon: Zap,
    priceMonthly: 24,
    priceYearly: 17,
    yearlyTotal: 204,
    originalMonthly: 24,
    credits: 500,
    highlight: false,
    badge: null as string | null,
    accent: "#7c3aed",
    accentLight: "#ede9fe",
    accentBorder: "#ddd6fe",
    iconBg: "linear-gradient(135deg, #ede9fe, #e0e7ff)",
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
    accent: "#7c3aed",
    accentLight: "#7c3aed",
    accentBorder: "rgba(167,139,250,0.5)",
    iconBg: "rgba(255,255,255,0.15)",
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
    accent: "#4338ca",
    accentLight: "#e0e7ff",
    accentBorder: "#c7d2fe",
    iconBg: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
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

const PLAN_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  free: { label: "Free", bg: "#f4f4f5", color: "#71717a" },
  starter: { label: "Starter", bg: "#ede9fe", color: "#7c3aed" },
  pro: { label: "Pro", bg: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff" },
  max: { label: "Max", bg: "#e0e7ff", color: "#4338ca" },
};

/* ── Feature Item Renderer ── */
function FeatureItem({ item, isHighlightPlan, accentColor }: {
  item: string | { text: string; bold?: boolean; highlight?: boolean; rest?: string };
  isHighlightPlan: boolean;
  accentColor: string;
}) {
  if (typeof item === "string") {
    return (
      <li style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        fontSize: 13.5, lineHeight: 1.7,
        color: isHighlightPlan ? "rgba(255,255,255,0.75)" : "#6b7280",
      }}>
        <span style={{
          color: isHighlightPlan ? "rgba(255,255,255,0.3)" : "#d1d5db",
          marginTop: 4, fontSize: 5,
        }}>●</span>
        {item}
      </li>
    );
  }
  return (
    <li style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      fontSize: 13.5, lineHeight: 1.7,
      color: isHighlightPlan ? "rgba(255,255,255,0.75)" : "#6b7280",
    }}>
      <span style={{
        color: isHighlightPlan ? "rgba(255,255,255,0.3)" : "#d1d5db",
        marginTop: 4, fontSize: 5,
      }}>●</span>
      <span>
        {item.bold && <strong style={{ color: isHighlightPlan ? "#fff" : accentColor }}>{item.text}</strong>}
        {item.highlight && <span style={{ color: accentColor, fontWeight: 700 }}>{item.text}</span>}
        {!item.bold && !item.highlight && item.text}
        {item.rest && <span>{item.rest}</span>}
      </span>
    </li>
  );
}

/* ── Plan Card ── */
function PlanCard({
  plan, isYearly, currentPlan, planExpiresAt, onSuccess, onPaymentState,
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
  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<"paypal" | "momo">("paypal");
  const Icon = plan.icon;

  const price = isYearly ? plan.priceYearly : plan.priceMonthly;
  const originalPrice = plan.originalMonthly;
  const vndPrice = VND_PRICES[plan.id] ?? 0;

  const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, max: 3 };
  const myRank = PLAN_RANK[currentPlan] ?? 0;
  const planRank = PLAN_RANK[plan.id] ?? 0;
  const isCurrentPlan = currentPlan === plan.id;
  const isExpired = planExpiresAt ? new Date(planExpiresAt) < new Date() : false;
  const isActive = isCurrentPlan && !isExpired;
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
        onSuccess(plan.id, result.planExpiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), result.creditsAdded ?? plan.credits, result.newBalance ?? 0);
      } else {
        onPaymentState("error", { errorMessage: result.error ?? "Lỗi xử lý thanh toán." });
      }
    } catch {
      onPaymentState("error", { errorMessage: "Không thể kết nối máy chủ." });
    } finally {
      setProcessing(false);
    }
  };

  const onError = (err: Record<string, unknown>) => { console.error(err); onPaymentState("error", { errorMessage: "PayPal báo lỗi. Vui lòng thử lại." }); };
  const onCancel = () => { onPaymentState("cancelled"); };

  /* ── MoMo handler ── */
  const handleMomoPay = async () => {
    if (!session?.user) { router.push("/login?callbackUrl=/pricing"); return; }
    setProcessing(true);
    onPaymentState("loading");
    try {
      const res = await fetch("/api/momo/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json();
      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        onPaymentState("error", { errorMessage: data.error ?? "Không tạo được đơn MoMo." });
        setProcessing(false);
      }
    } catch {
      onPaymentState("error", { errorMessage: "Không thể kết nối MoMo." });
      setProcessing(false);
    }
  };

  const paypalButtons = (
    <PayPalButtons
      style={{ layout: "vertical", color: plan.highlight ? "white" : "gold", shape: "pill", label: "pay", height: 44 }}
      createOrder={createOrder} onApprove={onApprove} onCancel={onCancel} onError={onError}
    />
  );

  const processingUI = (
    <div style={{
      width: "100%", padding: "14px 0", borderRadius: 14, textAlign: "center",
      fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      background: plan.highlight ? "rgba(255,255,255,0.12)" : "#f9fafb",
      color: plan.highlight ? "rgba(255,255,255,0.6)" : "#9ca3af",
    }}>
      <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
      Đang xử lý...
    </div>
  );

  /* Button style per plan */
  const btnStyle: React.CSSProperties = plan.highlight
    ? { background: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }
    : plan.id === "max"
      ? { background: "linear-gradient(135deg, #4338ca, #3730a3)", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(67,56,202,0.25)" }
      : { background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(124,58,237,0.25)" };

  const subscribeBtn = (
    <button
      onClick={() => { if (!session?.user) { router.push("/login?callbackUrl=/pricing"); return; } setShowPayment(!showPayment); }}
      className="pricing-btn"
      style={{ width: "100%", padding: "14px 0", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)", ...btnStyle }}
    >
      Subscribe
    </button>
  );

  const renewBtn = (
    <button onClick={() => setShowPayment(true)} className="pricing-btn"
      style={{ width: "100%", padding: "14px 0", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)", ...btnStyle }}>
      Gia hạn
    </button>
  );

  /* ── Payment method chooser (PayPal + MoMo) ── */
  const tabColor = plan.highlight ? "rgba(255,255,255,0.5)" : "#9ca3af";
  const tabActiveColor = plan.highlight ? "#fff" : "#7c3aed";
  const tabActiveBg = plan.highlight ? "rgba(255,255,255,0.15)" : "#f5f3ff";

  const paymentSection = (
    <div>
      {/* Method tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {(["paypal", "momo"] as const).map(method => (
          <button key={method} onClick={() => setPayMethod(method)}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
              border: payMethod === method ? `1.5px solid ${tabActiveColor}` : `1.5px solid ${plan.highlight ? "rgba(255,255,255,0.12)" : "#e5e7eb"}`,
              background: payMethod === method ? tabActiveBg : "transparent",
              color: payMethod === method ? tabActiveColor : tabColor,
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}>
            {method === "paypal" ? <><Wallet size={12} /> PayPal</> : <><Wallet size={12} /> MoMo</>}
          </button>
        ))}
      </div>

      {/* Payment content */}
      {payMethod === "paypal" ? (
        <div>
          <p style={{ textAlign: "center", fontSize: 11, marginBottom: 6, fontWeight: 600, color: tabColor }}>
            Thanh toán qua PayPal (USD)
          </p>
          {paypalButtons}
        </div>
      ) : (
        <div>
          <p style={{ textAlign: "center", fontSize: 11, marginBottom: 8, fontWeight: 600, color: tabColor }}>
            Thanh toán qua MoMo: <strong style={{ color: tabActiveColor }}>{formatVND(vndPrice)}</strong>
          </p>
          <button onClick={handleMomoPay} className="pricing-btn"
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12,
              fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #a50064, #d82d8b)",
              color: "#fff", boxShadow: "0 4px 16px rgba(165,0,100,0.25)",
              transition: "all 0.3s",
            }}>
            Thanh toán MoMo
          </button>
        </div>
      )}

      <button onClick={() => setShowPayment(false)}
        style={{ width: "100%", padding: "8px 0", background: "transparent", border: "none", color: tabColor, fontSize: 12, cursor: "pointer", marginTop: 6 }}>
        ← Quay lại
      </button>
    </div>
  );

  /* — Card border & background — */
  const cardBg = plan.highlight
    ? "linear-gradient(145deg, #7c3aed 0%, #6d28d9 40%, #4f46e5 100%)"
    : "#fff";

  const cardBorder = isActive
    ? plan.highlight
      ? "2px solid rgba(255,255,255,0.7)"
      : `2px solid ${plan.accent}`
    : plan.highlight
      ? "1.5px solid rgba(167,139,250,0.35)"
      : plan.id === "max"
        ? "1.5px solid #c7d2fe"
        : "1.5px solid #e9e5f5";

  const cardShadow = plan.highlight
    ? "0 8px 40px rgba(124,58,237,0.18), 0 2px 12px rgba(124,58,237,0.08)"
    : plan.id === "max"
      ? "0 2px 20px rgba(67,56,202,0.06), 0 1px 4px rgba(0,0,0,0.04)"
      : "0 2px 20px rgba(124,58,237,0.05), 0 1px 4px rgba(0,0,0,0.04)";

  const sectionLabelColor = plan.highlight ? "rgba(255,255,255,0.5)" : plan.accent;

  return (
    <div className={`pricing-card${plan.highlight ? " pricing-card-pro" : ""}`} style={{
      position: "relative", borderRadius: 22, display: "flex", flexDirection: "column",
      overflow: "hidden", transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)", cursor: "default",
      background: cardBg, border: cardBorder, boxShadow: cardShadow,
    }}>
      {/* Highlight scale ring */}
      {plan.highlight && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 22, zIndex: 0,
          background: "linear-gradient(145deg, rgba(167,139,250,0.1), transparent 60%)",
          pointerEvents: "none",
        }} />
      )}

      {/* Badge */}
      {plan.badge && (
        <div style={{
          position: "absolute", top: 16, right: 16, zIndex: 2,
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 12px", borderRadius: 20,
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
          background: plan.highlight ? "rgba(255,255,255,0.15)" : plan.accentLight,
          color: plan.highlight ? "#fff" : plan.accent,
          border: plan.highlight ? "1px solid rgba(255,255,255,0.2)" : `1px solid ${plan.accentBorder}`,
        }}>
          <Star size={9} fill="currentColor" /> {plan.badge}
        </div>
      )}

      <div style={{ padding: "30px 28px", display: "flex", flexDirection: "column", gap: 20, flex: 1, position: "relative", zIndex: 1 }}>
        {/* Plan icon + name */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: plan.iconBg,
              border: plan.highlight ? "1px solid rgba(255,255,255,0.2)" : "none",
            }}>
              <Icon size={18} style={{ color: plan.highlight ? "#fff" : plan.accent }} />
            </div>
            <h3 style={{
              fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.02em",
              color: plan.highlight ? "#fff" : "#111827",
            }}>
              {plan.name}
            </h3>
          </div>
          {isActive && (
            <div style={{ marginLeft: 48, marginBottom: 2 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                letterSpacing: "0.03em",
                background: plan.highlight ? "rgba(255,255,255,0.18)" : "linear-gradient(135deg,#7c3aed,#4f46e5)",
                color: "#fff",
                border: plan.highlight ? "1px solid rgba(255,255,255,0.25)" : "none",
              }}>
                ✦ Gói hiện tại
              </span>
            </div>
          )}
          <p style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.6)" : "#9ca3af", marginTop: 4, marginLeft: 48 }}>
            {plan.desc}
          </p>
        </div>

        {/* Price */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{
              fontSize: 44, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1,
              color: plan.highlight ? "#fff" : "#111827",
            }}>
              ${price}
            </span>
            <span style={{ fontSize: 14, fontWeight: 500, color: plan.highlight ? "rgba(255,255,255,0.5)" : "#9ca3af" }}>
              USD/tháng
            </span>
            {isYearly && originalPrice > price && (
              <span style={{ fontSize: 16, textDecoration: "line-through", color: plan.highlight ? "rgba(255,255,255,0.3)" : "#d1d5db" }}>
                ${originalPrice}
              </span>
            )}
          </div>
          {isYearly && (
            <p style={{ fontSize: 12, marginTop: 5, fontWeight: 600, color: plan.highlight ? "rgba(255,255,255,0.45)" : plan.accent }}>
              ${plan.yearlyTotal} USD thanh toán hàng năm
            </p>
          )}
        </div>

        {/* CTA */}
        <div>
          {isActive ? (
            <div>{processing ? processingUI : (!showPayment ? renewBtn : paymentSection)}</div>
          ) : isDowngrade ? (
            <div style={{
              width: "100%", padding: "14px 0", borderRadius: 14, textAlign: "center",
              fontSize: 14, fontWeight: 600, background: "#f9fafb", color: "#d1d5db",
              border: "1px solid #f3f4f6",
            }}>
              Gói thấp hơn gói hiện tại
            </div>
          ) : (
            <div>{processing ? processingUI : (!showPayment ? subscribeBtn : paymentSection)}</div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: plan.highlight ? "rgba(255,255,255,0.12)" : "#f3f4f6" }} />

        {/* CREDITS */}
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: sectionLabelColor, marginBottom: 10 }}>
            Credits
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {plan.features.credits.map((item, i) => (
              <FeatureItem key={i} item={item} isHighlightPlan={plan.highlight} accentColor={plan.accent} />
            ))}
          </ul>
        </div>

        {/* FEATURES */}
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: sectionLabelColor, marginBottom: 10 }}>
            Features
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {plan.features.features.map((item, i) => (
              <FeatureItem key={i} item={item} isHighlightPlan={plan.highlight} accentColor={plan.accent} />
            ))}
          </ul>
        </div>

        {/* BENEFITS */}
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: sectionLabelColor, marginBottom: 10 }}>
            Benefits
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {plan.features.benefits.map((item, i) => (
              <FeatureItem key={i} item={item} isHighlightPlan={plan.highlight} accentColor={plan.accent} />
            ))}
          </ul>
        </div>

        {/* Expiry */}
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
function PricingPageInner() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as any;
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Handle MoMo redirect result
  useEffect(() => {
    const momoResult = searchParams.get("momo");
    if (momoResult === "success") {
      setDialogState("success");
      setDialogPlan("Gói đã thanh toán");
      updateSession();
      // Clean URL
      router.replace("/pricing", { scroll: false });
    } else if (momoResult === "error") {
      const msg = searchParams.get("message") ?? "Thanh toán MoMo thất bại.";
      setDialogError(msg);
      setDialogState("error");
      router.replace("/pricing", { scroll: false });
    }
  }, [searchParams, router, updateSession]);

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
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <Navbar />

      <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "80px 24px 80px", position: "relative" }}>

          {/* Subtle background decoration */}
          <div style={{
            position: "absolute", top: -100, right: -200, width: 500, height: 500,
            background: "radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)",
            pointerEvents: "none", zIndex: 0,
          }} />
          <div style={{
            position: "absolute", top: 200, left: -200, width: 400, height: 400,
            background: "radial-gradient(circle, rgba(79,70,229,0.03) 0%, transparent 70%)",
            pointerEvents: "none", zIndex: 0,
          }} />

          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: 56, position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 16px", borderRadius: 50, marginBottom: 20,
              background: "#ede9fe", border: "1px solid #ddd6fe",
              fontSize: 12, fontWeight: 700, color: "#7c3aed", letterSpacing: "0.04em",
            }}>
              <Sparkles size={12} /> PRICING
            </div>

            <h1 style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 800, color: "#111827", letterSpacing: "-0.04em", lineHeight: 1.1,
              marginBottom: 16,
            }}>
              Best AI Video &{" "}
              <span style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Image Generator
              </span>
            </h1>
            <p style={{ fontSize: 16, color: "#9ca3af", maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.6 }}>
              Thanh toán linh hoạt. Credits cộng ngay sau khi thanh toán thành công.
            </p>

            {/* Toggle */}
            <div style={{
              display: "inline-flex", alignItems: "center",
              padding: 4, borderRadius: 50,
              background: "#fff", border: "1.5px solid #e9e5f5",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <button
                onClick={() => setIsYearly(true)}
                style={{
                  padding: "10px 26px", borderRadius: 50,
                  fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                  background: isYearly ? "#7c3aed" : "transparent",
                  color: isYearly ? "#fff" : "#9ca3af",
                  boxShadow: isYearly ? "0 2px 12px rgba(124,58,237,0.25)" : "none",
                }}
              >
                Yearly
                {isYearly && (
                  <span style={{
                    marginLeft: 8, padding: "2px 8px", borderRadius: 20,
                    fontSize: 10, fontWeight: 800,
                    background: "rgba(255,255,255,0.25)", color: "#fff",
                  }}>
                    29% off
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsYearly(false)}
                style={{
                  padding: "10px 26px", borderRadius: 50,
                  fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer",
                  transition: "all 0.25s",
                  background: !isYearly ? "#111827" : "transparent",
                  color: !isYearly ? "#fff" : "#9ca3af",
                }}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* ── Current plan status ── */}
          {session?.user && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 40, position: "relative", zIndex: 1 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 18px", borderRadius: 50,
                background: "#fff", border: "1.5px solid #e9e5f5",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <Zap size={13} style={{ color: "#7c3aed" }} />
                <span style={{ fontSize: 14, color: "#6b7280" }}>Credits:</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#7c3aed", fontFamily: "monospace" }}>{user?.credits ?? 0}</span>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 18px", borderRadius: 50,
                background: badge.bg, border: "1.5px solid rgba(0,0,0,0.04)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
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
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: 20, alignItems: "stretch",
            position: "relative", zIndex: 1,
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
          <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, position: "relative", zIndex: 1 }}>
            {[
              { icon: "🔒", title: "Thanh toán an toàn", desc: "Powered by PayPal — không lưu thẻ" },
              { icon: "⚡", title: "Credits ngay lập tức", desc: "Cộng vào tài khoản sau thanh toán" },
              { icon: "📅", title: "Không tự động gia hạn", desc: "Toàn quyền kiểm soát chi phí" },
            ].map(item => (
              <div key={item.title} style={{
                padding: 22, borderRadius: 16, textAlign: "center",
                border: "1.5px solid #f0eef5", background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                transition: "all 0.25s",
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{item.title}</p>
                <p style={{ fontSize: 12, color: "#9ca3af" }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* ── FAQ Section ── */}
          <div style={{ maxWidth: 700, margin: "72px auto 0", position: "relative", zIndex: 1 }}>
            <h2 style={{
              textAlign: "center", fontSize: 32, fontWeight: 800,
              color: "#111827", marginBottom: 36, letterSpacing: "-0.03em",
            }}>
              Câu hỏi thường gặp
            </h2>
            {[
              { q: "Credits là gì và cách sử dụng?", a: "Credits là đơn vị dùng để tạo video/ảnh AI. Mỗi tác vụ tiêu thụ số credits khác nhau." },
              { q: "Tôi có thể dùng thử trước khi mua không?", a: "Có! Đăng ký miễn phí để nhận credits dùng thử các công cụ AI." },
              { q: "Có thể mua 1 tháng không tự động gia hạn?", a: "Có. Chúng tôi không tự động gia hạn — bạn toàn quyền kiểm soát." },
              { q: "Video có watermark không?", a: "Các gói trả phí đều không có watermark và có quyền sử dụng thương mại." },
              { q: "Hết credits thì sao?", a: "Bạn có thể mua thêm Credit Packs bất cứ lúc nào mà không cần nâng gói." },
            ].map((faq, i) => (
              <details key={i} className="faq-item" style={{
                borderBottom: "1px solid #f3f4f6", padding: "18px 0",
              }}>
                <summary style={{
                  fontSize: 15, fontWeight: 600, color: "#374151", cursor: "pointer",
                  listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "color 0.2s",
                }}>
                  {faq.q}
                  <span style={{ color: "#d1d5db", fontSize: 20, fontWeight: 300, transition: "transform 0.2s" }}>+</span>
                </summary>
                <p style={{ fontSize: 14, color: "#6b7280", marginTop: 10, lineHeight: 1.8 }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

          <p style={{
            textAlign: "center", fontSize: 12, color: "#d1d5db",
            marginTop: 48, fontFamily: "monospace", letterSpacing: "0.04em",
          }}>
            Powered by PayPal · SSL Secured · Không tự động gia hạn
          </p>
        </div>
      </PayPalScriptProvider>

      <PaymentResultDialog
        state={dialogState} planName={dialogPlan}
        creditsAdded={dialogCredits} newBalance={dialogBalance}
        errorMessage={dialogError}
        onClose={() => setDialogState("idle")} onRetry={() => setDialogState("idle")}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .pricing-card {
          will-change: transform, box-shadow;
        }
        .pricing-card:hover {
          transform: translateY(-6px);
          box-shadow:
            0 16px 48px rgba(124,58,237,0.1),
            0 6px 16px rgba(0,0,0,0.06) !important;
        }
        .pricing-card-pro:hover {
          box-shadow:
            0 20px 56px rgba(124,58,237,0.22),
            0 8px 20px rgba(124,58,237,0.08) !important;
        }

        .pricing-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        .faq-item summary:hover { color: #111827 !important; }
        .faq-item[open] summary span:last-child { transform: rotate(45deg); }
        .faq-item summary::-webkit-details-marker { display: none; }

        @media (max-width: 768px) {
          .pricing-card:hover { transform: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fafafa" }} />}>
      <PricingPageInner />
    </Suspense>
  );
}
