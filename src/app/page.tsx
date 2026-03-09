/**
 * src/app/page.tsx
 * Home page — tách thành components, import từ lib/features và components/home
 */
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import BentoSection from "@/components/home/BentoSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import BuiltToFitSection from "@/components/home/BuiltToFitSection";
import GalleryStrip from "@/components/home/GalleryStrip";
import HomeFooter from "@/components/home/Footer";
import PricingSection from "@/components/home/PricingSection";
import { AI_FEATURES } from "@/lib/features";
import type { NewsCard, FitCard, GalleryStripeItem } from "@/types/ui";
import Link from "next/link";
import { Zap } from "lucide-react";
import { FIcon } from "@/components/studio/icons";

// ─────────────────────────────────────
// DATA (page-specific, không cần share)
// ─────────────────────────────────────
const FALLBACK_GRADIENTS = [
  "linear-gradient(160deg, #0d1117 0%, #1a2a1a 40%, #3a1a0a 70%, #1a0a0a 100%)",
  "linear-gradient(135deg, #0a1628 0%, #1a2a3a 50%, #0a2a1a 100%)",
  "linear-gradient(135deg, #1a0a2a 0%, #2a0a3a 50%, #0a0a2a 100%)",
];

async function getLatestBlogs() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { slug: true, title: true, createdAt: true, coverImage: true },
    });
    return posts.map((p, i) => ({
      slug: p.slug,
      date: new Date(p.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" }).toUpperCase(),
      title: p.title,
      gradient: FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length],
      featured: i === 0,
      coverImage: p.coverImage ?? null,
    }));
  } catch {
    return [];
  }
}


const FIT_CARDS: FitCard[] = [
  {
    tag: "API",
    labels: ["CHẤT LƯỢNG CAO", "DỄ TÍCH HỢP", "PRODUCTION READY"],
    desc: "Tích hợp AI vào ứng dụng của bạn qua REST API đơn giản. Hỗ trợ xử lý quy mô lớn.",
    links: ["Tài liệu", "SDK"],
    cta: "Bắt đầu dùng API",
  },
  {
    tag: "Studio",
    labels: ["KHÔNG CẦN CODE", "10 CÔNG CỤ AI", "MIỄN PHÍ THỬ"],
    desc: "Drag & drop ảnh, chọn tính năng, nhận kết quả trong vài giây trên web.",
    links: ["Studio Demo", "Hướng dẫn"],
    cta: "Mở Studio",
  },
  {
    tag: "Gallery",
    labels: ["CỘNG ĐỒNG", "CHIA SẺ", "TRUYỀN CẢM HỨNG"],
    desc: "Xem hàng ngàn tác phẩm AI từ cộng đồng. Lấy cảm hứng và chia sẻ tác phẩm của bạn.",
    links: ["Xem Gallery"],
    cta: "Khám phá Gallery",
  },
];

const GALLERY_ITEMS: GalleryStripeItem[] = [
  { gradient: "linear-gradient(135deg, #667eea, #764ba2)", label: "Thay áo" },
  { gradient: "linear-gradient(135deg, #f093fb, #f5576c)", label: "Anime" },
  { gradient: "linear-gradient(135deg, #4facfe, #00f2fe)", label: "Background" },
  { gradient: "linear-gradient(135deg, #43e97b, #38f9d7)", label: "Phục hồi" },
  { gradient: "linear-gradient(135deg, #fa709a, #fee140)", label: "Thay mặt" },
  { gradient: "linear-gradient(135deg, #a18cd1, #fbc2eb)", label: "Ghép vật" },
  { gradient: "linear-gradient(135deg, #ffecd2, #fcb69f)", label: "Đổi màu" },
  { gradient: "linear-gradient(135deg, #a1c4fd, #c2e9fb)", label: "Lấy quần áo" },
];

// ─────────────────────────────────────
// PAGE
// ─────────────────────────────────────
export default async function HomePage() {
  const newsCards = await getLatestBlogs();

  return (
    <div className="bg-white">
      <Navbar />

      {/* Section 1 — Hero */}
      <HeroSection />

      {/* Section 2 — "See what's new" bento */}
      <BentoSection cards={newsCards} />

      {/* Section 3 — 10 tính năng AI */}
      <FeaturesSection features={AI_FEATURES} />

      {/* Section 4 — Built to fit (dark) */}
      <BuiltToFitSection cards={FIT_CARDS} />

      {/* Section 5 — Gallery strip */}
      <GalleryStrip items={GALLERY_ITEMS} />

      {/* Section 6 — Pricing */}
      <PricingSection />

      {/* Section 7 — Final CTA (dark) */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #050c08 0%, #0a1208 40%, #060808 100%)" }}
      >
        <div
          className="absolute blur-3xl opacity-20 rounded-full pointer-events-none"
          style={{
            width: "60%", height: "100%",
            background: "radial-gradient(ellipse, #b4a7d6 0%, transparent 70%)",
            top: "0", right: "-20%",
          }}
        />
        <div className="max-w-[1400px] mx-auto px-6 py-32 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div>
            <p className="mono text-xs text-white/30 uppercase tracking-widest mb-4">Bắt đầu ngay hôm nay</p>
            <h2
              className="font-bold text-white leading-none"
              style={{ fontSize: "clamp(40px, 6vw, 72px)", letterSpacing: "-0.04em" }}
            >
              Tạo ảnh AI<br />miễn phí
            </h2>
            <p className="text-white/40 mt-4 max-w-md leading-relaxed">
              10 credits miễn phí khi đăng ký. Không cần thẻ tín dụng.
            </p>
          </div>

          {/* CTA card */}
          <div
            className="rounded-2xl p-8 w-full max-w-md flex flex-col gap-5"
            style={{ background: "rgba(245,243,250,0.97)" }}
          >
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Studio</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Drag &amp; drop ảnh của bạn và nhận kết quả AI chất lượng cao trong vài giây.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {AI_FEATURES.slice(0, 3).map(f => (
                <div key={f.slug} className="rounded-xl bg-gray-50 p-3 text-center flex flex-col items-center gap-1">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{ width: "32px", height: "32px", background: "rgba(124,58,237,0.1)" }}
                  >
                    <FIcon slug={f.slug} size={14} style={{ color: "#7c3aed" }} />
                  </div>
                  <div className="text-[10px] text-gray-500 leading-tight">{f.name}</div>
                  <div className="flex items-center gap-0.5">
                    <Zap size={8} className="text-gray-400" />
                    <span className="text-[9px] text-gray-400 mono">{f.credits}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/studio"
              className="w-full text-center px-6 py-3.5 font-bold text-sm rounded-xl text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{
                background: "var(--cta-gradient)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
              }}
            >
              Thử PixelMind AI ✦
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}
