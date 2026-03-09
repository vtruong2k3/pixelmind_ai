"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AIFeature } from "@/types/ui";
import { FIcon } from "@/components/studio/icons";

interface HeroSectionProps {
  topFeatures?: AIFeature[];
}

// 3 ảnh mockup (dùng placeholder chất lượng cao từ Unsplash hoặc bạn có thể thay đường dẫn local vào đây)
const SLIDE_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop", // Abstract dark ai concept
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop", // Cyber neon
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop", // Future tech
];

export default function HeroSection({ topFeatures = [] }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 5000); // Đổi ảnh mỗi 5 giây
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="px-4 pt-4 pb-0">
      <div
        className="relative w-full overflow-hidden hero-glow bg-zinc-950"
        style={{
          borderRadius: "var(--radius-card)",
          minHeight: "420px",
          height: "calc(100svh - 100px)",
          maxHeight: "840px",
        }}
      >
        {/* Slidershow Backgrounds */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${SLIDE_IMAGES[currentSlide]})` }}
          />
        </AnimatePresence>

        {/* Overlay gradient to keep text readable */}
        <div className="absolute inset-0 z-0 bg-black/60 sm:bg-black/40 bg-linear-to-t from-black/80 via-transparent to-black/50 pointer-events-none" />

        {/* Tagline */}
        <div className="absolute top-6 sm:top-10 left-0 right-0 z-10 flex justify-center px-4">
          <p className="mono text-[10px] sm:text-xs text-white/50 tracking-widest uppercase text-center" style={{ letterSpacing: "0.2em" }}>
            The frontier AI studio for visual intelligence.
          </p>
        </div>

        {/* Center text */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center gap-4 sm:gap-5 px-5">
          <h1
            className="font-bold text-white leading-none tracking-tight"
            style={{ fontSize: "clamp(38px, 9vw, 110px)", letterSpacing: "-0.04em" }}
          >
            Biến ảnh của bạn<br />
            <span style={{ color: "var(--lavender-bg)" }}>thành tuyệt tác</span>
          </h1>

          <p className="text-white/60 text-sm sm:text-lg max-w-sm sm:max-w-md leading-relaxed">
            10 công cụ AI chỉnh sửa ảnh thời trang, phục hồi ảnh cũ,
            tạo phong cách anime và hơn thế nữa.
          </p>

          <div className="flex gap-3 flex-wrap justify-center mt-1">
            <Link
              href="/gallery"
              className="px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-semibold rounded-lg text-white transition-all"
              style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              Xem Gallery
            </Link>
            <Link
              href="/studio"
              className="px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-bold rounded-lg text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "var(--cta-gradient)", boxShadow: "0 4px 20px rgba(124,58,237,0.45), 0 0 0 1px rgba(124,58,237,0.3)" }}
            >
              Thử miễn phí ✦
            </Link>
          </div>

          <Link href="/#features" className="mono text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-4">
            Khám phá tính năng →
          </Link>
        </div>

        {/* Bottom info card — hidden on small mobile */}
        <div
          className="absolute bottom-4 right-4 z-20 rounded-2xl p-4 sm:p-5 hidden sm:flex items-center justify-between gap-6"
          style={{ background: "rgba(242,240,247,0.93)", backdropFilter: "blur(20px)", minWidth: "280px", maxWidth: "380px" }}
        >
          <div>
            <div className="font-bold tracking-tight text-gray-900" style={{ fontSize: "clamp(18px,2.5vw,28px)", letterSpacing: "-0.03em" }}>
              PixelMind<sup className="text-[0.45em] font-medium align-super">[AI]</sup>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">10 tính năng · SD &amp; HD</p>
          </div>
          <Link
            href="/studio"
            className="px-4 py-2.5 text-sm font-bold rounded-lg text-white whitespace-nowrap transition-all hover:opacity-90 shrink-0"
            style={{ background: "var(--cta-gradient)", boxShadow: "0 2px 12px rgba(124,58,237,0.4)" }}
          >
            Dùng ngay →
          </Link>
        </div>
      </div>

      {/* Feature chips — horizontal scroll on mobile */}
      {topFeatures.length > 0 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide px-1 sm:justify-center">
          {topFeatures.slice(0, 5).map((f: AIFeature) => (
            <Link
              key={f.slug}
              href={`/studio?feature=${f.slug}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:-translate-y-0.5 shrink-0"
              style={{ background: "#f4f4f5", color: "#71717a" }}
            >
              <FIcon slug={f.slug} size={12} />
              {f.name}
              <Zap size={9} />
              <span className="mono">{f.credits}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
