"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Sparkles, Star, Gift } from "lucide-react";

// Slides quảng cáo ưu đãi — tự chuyển mỗi 4s
const PROMO_SLIDES = [
  {
    badge: "⚡ GÓI STARTER",
    title: "500 credits · chỉ $24/tháng",
    subtitle: "Bắt đầu tạo ảnh AI với 10 công cụ. Thanh toán theo tháng, không tự động gia hạn.",
    cta: "Xem gói Starter →",
    href: "/pricing",
    bg: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #312e81 100%)",
    accent: "#c4b5fd",
    pill: { icon: Zap, text: "~$0.048/credit" },
  },
  {
    badge: "⚡ NÂNG CẤP PRO",
    title: "1500 credits · chỉ $66/tháng",
    subtitle: "Tạo không giới hạn ảnh HD với 10 công cụ AI. Ưu tiên xử lý.",
    cta: "Nâng cấp ngay →",
    href: "/pricing",
    bg: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #a78bfa 100%)",
    accent: "#ede9fe",
    pill: { icon: Star, text: "Phổ biến nhất" },
  },
  {
    badge: "💎 GÓI MAX",
    title: "4000 credits · chỉ $100/tháng",
    subtitle: "Chỉ ~$0.025/credit. Chất lượng HD độc quyền. Hỗ trợ 24/7.",
    cta: "Xem gói Max →",
    href: "/pricing",
    bg: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4f46e5 100%)",
    accent: "#a5b4fc",
    pill: { icon: Gift, text: "Tiết kiệm nhất" },
  },
  {
    badge: "✨ MIỂN PHÍ THử",
    title: "10 credits miễn phí khi đăng ký",
    subtitle: "Tạo ảnh ngay không cần thẻ. Trải nghiệm đầy đủ 10 tính năng AI.",
    cta: "Đăng ký miễn phí →",
    href: "/login",
    bg: "linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)",
    accent: "#ddd6fe",
    pill: { icon: Sparkles, text: "Không cần thẻ" },
  },
];

// Điểm nổi bật (stats row)
const STATS = [
  { value: "10+", label: "Công cụ AI" },
  { value: "10K+", label: "Ảnh đã tạo" },
  { value: "99%", label: "Hài lòng" },
  { value: "0đ", label: "Thử miễn phí" },
];

export default function PricingSection() {
  const [active, setActive] = useState(0);

  // Auto-slide mỗi 4 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % PROMO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const slide = PROMO_SLIDES[active];
  const PillIcon = slide.pill.icon;

  return (
    <section id="pricing" className="py-20 px-4" style={{ background: "#fafafa" }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="mono text-xs text-gray-400 uppercase tracking-widest mb-3">Ưu đãi & Nâng cấp</p>
          <h2
            className="font-black text-gray-900"
            style={{ fontSize: "clamp(28px,5vw,50px)", letterSpacing: "-0.04em", lineHeight: 1.1 }}
          >
            Ưu đãi{" "}
            <span style={{
              background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              hôm nay
            </span>
          </h2>
        </div>

        {/* Slideshow banner */}
        <div className="relative overflow-hidden rounded-3xl mb-8" style={{ minHeight: "240px" }}>
          {/* Slide content */}
          <div
            className="relative flex flex-col justify-between p-8 sm:p-10 min-h-[240px] transition-all duration-700"
            style={{ background: slide.bg }}
            key={active}
          >
            {/* Top row */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <span
                className="text-[11px] font-black uppercase tracking-widest mono px-3 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
              >
                {slide.badge}
              </span>
              <span
                className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.12)", color: slide.accent }}
              >
                <PillIcon size={11} /> {slide.pill.text}
              </span>
            </div>

            {/* Center content */}
            <div className="mt-6">
              <h3
                className="font-black text-white mb-2 leading-tight"
                style={{ fontSize: "clamp(22px,4vw,38px)", letterSpacing: "-0.03em" }}
              >
                {slide.title}
              </h3>
              <p
                className="text-sm sm:text-base max-w-md mb-6"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                {slide.subtitle}
              </p>
              <Link
                href={slide.href}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.95)", color: "#4c1d95" }}
              >
                {slide.cta}
              </Link>
            </div>

            {/* Decorative glow */}
            <div
              className="absolute right-0 top-0 pointer-events-none"
              style={{
                width: "300px", height: "100%",
                background: "radial-gradient(ellipse at 100% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)",
              }}
            />
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {PROMO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? "22px" : "6px",
                  height: "6px",
                  background: i === active ? "#fff" : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {STATS.map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-5 text-center border border-gray-100"
              style={{ background: "#fff" }}
            >
              <p
                className="font-black mono"
                style={{ fontSize: "clamp(22px,3vw,32px)", color: "#7c3aed", letterSpacing: "-0.03em" }}
              >
                {s.value}
              </p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-violet-100"
          style={{ background: "#faf8ff" }}>
          <div>
            <p className="font-bold text-gray-900 mb-1">Sẵn sàng tạo ảnh AI?</p>
            <p className="text-sm text-gray-400">10 credits miễn phí khi đăng ký. Không cần thẻ.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/pricing"
              className="px-5 py-2.5 rounded-xl text-sm font-bold border transition-all hover:-translate-y-0.5"
              style={{ borderColor: "#ddd6fe", color: "#7c3aed", background: "#fff" }}
            >
              Xem tất cả gói
            </Link>
            <Link
              href="/studio"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
              }}
            >
              <Zap size={14} /> Thử ngay
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
