"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Check, Zap, Sparkles, Crown, Star } from "lucide-react";
import { toast } from "sonner";

// ── Phân tích màu brand từ globals.css ──
// --lavender:       #7c3aed   (violet-700 — CTA primary)
// --lavender-hover: #6d28d9   (violet-800)
// --lavender-bg:    #a78bfa   (violet-400 — accent)
// --lavender-light: #ede9fe   (violet-100 — icon bg on white)
// --cta-gradient:   #7c3aed → #4f46e5
// body background: #fff (white)
// body text: #0a0a0a

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    price: "49.000đ",
    priceUSD: "$2",
    credits: 50,
    perCredit: "~980đ/credit",
    // Light violet tint — subtle entry card
    cardBg:      "#faf8ff",
    cardBorder:  "#e9e3f9",
    iconBg:      "#ede9fe",
    iconColor:   "#7c3aed",
    accentBg:    "#f3f0ff",
    accentBorder:"#ddd5f9",
    accentColor: "#6d28d9",
    badgeBg:     null,
    checkColor:  "#7c3aed",
    checkBg:     "#ede9fe",
    priceColor:  "#0a0a0a",
    features: [
      "50 credits",
      "Tất cả 10 công cụ AI",
      "Chất lượng SD",
      "Lưu lịch sử",
    ],
    highlight: false,
    badge: null,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Sparkles,
    price: "99.000đ",
    priceUSD: "$4",
    credits: 200,
    perCredit: "~495đ/credit",
    // Brand violet gradient — hero card
    cardBg:      "linear-gradient(145deg, #7c3aed 0%, #4f46e5 100%)",
    cardBorder:  "rgba(255,255,255,0.15)",
    iconBg:      "rgba(255,255,255,0.18)",
    iconColor:   "#fff",
    accentBg:    "rgba(255,255,255,0.12)",
    accentBorder:"rgba(255,255,255,0.2)",
    accentColor: "#fff",
    badgeBg:     "rgba(255,255,255,0.2)",
    checkColor:  "#fff",
    checkBg:     "rgba(255,255,255,0.2)",
    priceColor:  "#fff",
    features: [
      "200 credits",
      "Tất cả 10 công cụ AI",
      "Chất lượng SD + HD",
      "Ưu tiên xử lý",
    ],
    highlight: true,
    badge: "Phổ biến nhất",
  },
  {
    id: "max",
    name: "Max",
    icon: Crown,
    price: "249.000đ",
    priceUSD: "$10",
    credits: 500,
    perCredit: "~498đ/credit",
    // Deep violet / indigo — premium subtle
    cardBg:      "#f5f3ff",
    cardBorder:  "#ddd6fe",
    iconBg:      "#ede9fe",
    iconColor:   "#4f46e5",
    accentBg:    "#ede9fe",
    accentBorder:"#c4b5fd",
    accentColor: "#4f46e5",
    badgeBg:     "#ede9fe",
    checkColor:  "#4f46e5",
    checkBg:     "#ddd6fe",
    priceColor:  "#0a0a0a",
    features: [
      "500 credits",
      "Tất cả 10 công cụ AI",
      "Chất lượng HD độc quyền",
      "Hỗ trợ ưu tiên",
    ],
    highlight: false,
    badge: "Tiết kiệm nhất",
  },
];

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "sb";

function PlanCard({ plan, onSuccess }: {
  plan: typeof PLANS[0];
  onSuccess: (planId: string, credits: number) => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const Icon = plan.icon;
  const isGradient = plan.cardBg.startsWith("linear");

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
    try {
      const res = await fetch("/api/paypal/capture-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`🎉 Nạp thành công! +${plan.credits} credits!`);
        onSuccess(plan.id, plan.credits);
      } else toast.error(result.error ?? "Lỗi xử lý thanh toán");
    } catch { toast.error("Không thể xác nhận thanh toán"); }
    finally { setProcessing(false); }
  };

  return (
    <div
      className="relative rounded-3xl flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
      style={{
        background: plan.cardBg,
        border: `1px solid ${plan.cardBorder}`,
        boxShadow: plan.highlight
          ? "0 20px 60px rgba(124,58,237,0.25), 0 4px 16px rgba(124,58,237,0.15)"
          : "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Badge */}
      {plan.badge && (
        <div
          className="absolute top-5 right-5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
          style={plan.highlight
            ? { background: "rgba(255,255,255,0.18)", color: "#fff" }
            : { background: plan.accentBg, color: plan.accentColor, border: `1px solid ${plan.accentBorder}` }
          }
        >
          <Star size={8} fill="currentColor" /> {plan.badge}
        </div>
      )}

      <div className="p-7 flex flex-col gap-5 h-full">
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
              {plan.price}
            </span>
            <span className="text-sm" style={{ color: isGradient ? "rgba(255,255,255,0.55)" : "#9ca3af" }}>
              ≈ {plan.priceUSD}
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
            {plan.credits} credits
          </span>
          <span className="ml-auto text-xs" style={{ color: isGradient ? "rgba(255,255,255,0.5)" : "#9ca3af" }}>
            ~{Math.round(plan.credits / 2)} ảnh HD
          </span>
        </div>

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

        {/* PayPal */}
        <div className="mt-3">
          {processing ? (
            <div className="w-full py-3.5 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2"
              style={plan.highlight
                ? { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }
                : { background: "#f4f4f5", color: "#71717a" }
              }>
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Đang xử lý...
            </div>
          ) : (
            <PayPalButtons
              style={{ layout: "vertical", color: plan.highlight ? "white" : "gold", shape: "pill", label: "pay", height: 44 }}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={(err) => { console.error(err); toast.error("Lỗi PayPal. Vui lòng thử lại."); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [purchased, setPurchased] = useState<Record<string, number>>({});

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}>
        <div className="max-w-5xl mx-auto px-6 py-20">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 mono"
              style={{ background: "#ede9fe", color: "#7c3aed", border: "1px solid #ddd6fe" }}>
              <Zap size={11} /> Credits & Pricing
            </div>
            <h1 className="font-black text-gray-900 mb-4"
              style={{ fontSize: "clamp(36px,6vw,58px)", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
              Chọn gói{" "}
              <span style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                credits
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-sm mx-auto">
              Thanh toán một lần. Credits không hết hạn.
            </p>
          </div>

          {/* User credits */}
          {session?.user && (
            <div className="flex items-center justify-center gap-2 mb-10">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: "#ede9fe", border: "1px solid #ddd6fe" }}>
                <Zap size={13} style={{ color: "#7c3aed" }} />
                <span className="text-sm text-gray-500">Credits hiện tại:</span>
                <span className="text-sm font-black mono" style={{ color: "#7c3aed" }}>
                  {user?.credits ?? 0}
                </span>
              </div>
            </div>
          )}

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PLANS.map(plan => (
              <PlanCard key={plan.id} plan={plan} onSuccess={(id, c) => setPurchased(p => ({ ...p, [id]: (p[id] ?? 0) + c }))} />
            ))}
          </div>

          {/* Success */}
          {Object.keys(purchased).length > 0 && (
            <div className="mt-10 p-5 rounded-2xl text-center"
              style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <p className="font-semibold text-green-600">✅ Thanh toán thành công! Credits đã được cộng vào tài khoản.</p>
            </div>
          )}

          {/* Info row */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "🔒", title: "Thanh toán an toàn", desc: "Powered by PayPal — không lưu thẻ" },
              { icon: "⚡", title: "Credits ngay lập tức", desc: "Cộng vào tài khoản sau thanh toán" },
              { icon: "∞", title: "Không hết hạn", desc: "Dùng thoải mái, không áp lực" },
            ].map(item => (
              <div key={item.title} className="p-5 rounded-2xl text-center border border-gray-100 bg-gray-50">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-sm font-bold text-gray-800 mb-1">{item.title}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs mono text-gray-300 mt-10">
            Powered by PayPal · SSL Secured · Credits không hết hạn
          </p>
        </div>
      </PayPalScriptProvider>
    </div>
  );
}
