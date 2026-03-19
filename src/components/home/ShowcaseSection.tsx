"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Wand2, Palette, Camera, Layers, Shirt, UserRound, PenLine } from "lucide-react";

/* ── Showcase Data ── */
const SHOWCASES = [
  {
    id: "editing",
    badge: "CHỈNH SỬA ẢNH",
    title: "Biến đổi ảnh\nchỉ với một click",
    desc: "Thay áo, ghép vật thể, đổi background, thay khuôn mặt — tất cả được xử lý bởi AI chất lượng cao. Kết quả tự nhiên, không lỗi, chỉ trong vài giây.",
    prompt: "Thay chiếc áo sơ mi xanh trong ảnh sang áo vest đen thanh lịch",
    tools: [
      { icon: Shirt, label: "Thay áo" },
      { icon: UserRound, label: "Thay mặt" },
      { icon: Layers, label: "Đổi nền" },
      { icon: Camera, label: "Ghép vật" },
    ],
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    glowColor: "rgba(102, 126, 234, 0.15)",
    images: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
    ],
  },
  {
    id: "creative",
    badge: "SÁNG TẠO AI",
    title: "Giải phóng\nsáng tạo không giới hạn",
    desc: "Biến ảnh thật thành anime, chuyển tranh vẽ thành ảnh chân thực, phục hồi ảnh cũ hư hỏng. Khám phá mọi khả năng của AI sáng tạo.",
    prompt: "Biến bức ảnh chân dung này thành phong cách anime Ghibli",
    tools: [
      { icon: Sparkles, label: "→ Anime" },
      { icon: PenLine, label: "Tranh → Ảnh" },
      { icon: Wand2, label: "Phục hồi" },
      { icon: Palette, label: "Đổi màu" },
    ],
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    glowColor: "rgba(240, 147, 251, 0.15)",
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80",
      "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=600&q=80",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
    ],
  },
  {
    id: "generate",
    badge: "TẠO ẢNH TỪ VĂN BẢN",
    title: "Từ ý tưởng\nđến hình ảnh",
    desc: "Chỉ cần mô tả bằng văn bản, AI sẽ tạo ra hình ảnh chất lượng cao. Hỗ trợ đa phong cách — realistic, anime, digital art, oil painting và nhiều hơn nữa.",
    prompt: "Thành phố tương lai với những tòa nhà pha lê, ánh hoàng hôn phản chiếu trên mặt nước",
    tools: [
      { icon: Wand2, label: "Text → Image" },
      { icon: Sparkles, label: "Đa phong cách" },
      { icon: Camera, label: "HD Quality" },
      { icon: Palette, label: "Custom style" },
    ],
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    glowColor: "rgba(79, 172, 254, 0.15)",
    images: [
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=80",
    ],
  },
];

/* ── Main Component ── */
export default function ShowcaseSection() {
  const [activeTab, setActiveTab] = useState(0);
  const showcase = SHOWCASES[activeTab];

  return (
    <section
      id="features"
      style={{
        background: "linear-gradient(180deg, #06060a 0%, #0c1220 50%, #0a0e1a 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow orbs */}
      <div
        style={{
          position: "absolute", top: "10%", left: "-15%",
          width: "50%", height: "60%",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)",
          filter: "blur(80px)", pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute", bottom: "5%", right: "-10%",
          width: "40%", height: "50%",
          background: "radial-gradient(ellipse, rgba(79,172,254,0.06) 0%, transparent 70%)",
          filter: "blur(80px)", pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "100px 24px 120px", position: "relative", zIndex: 1 }}>

        {/* ── Section Header ── */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)", marginBottom: 16,
            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
          }}>
            Khám phá AI Studio
          </p>
          <h2 style={{
            fontSize: "clamp(40px, 5vw, 72px)",
            fontWeight: 600, color: "#fff", lineHeight: 1.1,
            letterSpacing: "-0.04em", margin: "0 0 20px",
          }}>
            Mọi công cụ AI<br />trong một nền tảng
          </h2>
          <p style={{
            fontSize: 16, color: "rgba(255,255,255,0.45)", maxWidth: 560,
            margin: "0 auto", lineHeight: 1.7,
          }}>
            Từ chỉnh sửa ảnh đến sáng tạo nội dung — PixelMind AI cung cấp bộ công cụ toàn diện cho mọi nhu cầu.
          </p>
        </div>

        {/* ── Category Tabs (deevid.ai style) ── */}
        <div style={{
          display: "flex", gap: 8, justifyContent: "center",
          marginBottom: 56, flexWrap: "wrap",
        }}>
          {SHOWCASES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(i)}
              style={{
                padding: "10px 24px", borderRadius: 50,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: activeTab === i
                  ? "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,172,254,0.3))"
                  : "rgba(255,255,255,0.05)",
                color: activeTab === i ? "#fff" : "rgba(255,255,255,0.5)",
                backdropFilter: "blur(10px)",
                transition: "all 0.3s ease",
                border: activeTab === i
                  ? "1px solid rgba(124,58,237,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {s.badge}
            </button>
          ))}
        </div>

        {/* ── Active Showcase ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={showcase.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 40,
              alignItems: "center",
            }}
          >
            {/* Left — Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <h3 style={{
                fontSize: "clamp(32px, 4vw, 52px)",
                fontWeight: 700, color: "#fff", lineHeight: 1.15,
                letterSpacing: "-0.03em", whiteSpace: "pre-line",
              }}>
                {showcase.title}
              </h3>

              <p style={{
                fontSize: 15, color: "rgba(255,255,255,0.55)",
                lineHeight: 1.8, maxWidth: 480,
              }}>
                {showcase.desc}
              </p>

              {/* Prompt Input Demo (deevid.ai style) */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 12,
                maxWidth: 500,
              }}>
                <Wand2 size={16} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                <span style={{
                  fontSize: 13, color: "rgba(255,255,255,0.4)",
                  fontStyle: "italic", lineHeight: 1.5,
                }}>
                  &quot;{showcase.prompt}&quot;
                </span>
              </div>

              {/* Tool pills */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {showcase.tools.map(tool => (
                  <div key={tool.label} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 50,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <tool.icon size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
                      {tool.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button (deevid.ai gradient style) */}
              <Link
                href="/studio"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "14px 32px", borderRadius: 50,
                  fontSize: 14, fontWeight: 700, color: "#fff",
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5, #06b6d4)",
                  boxShadow: "0 4px 24px rgba(124,58,237,0.35), 0 0 60px rgba(6,182,212,0.1)",
                  textDecoration: "none",
                  transition: "all 0.3s ease",
                  width: "fit-content",
                }}
              >
                Thử ngay
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Right — Preview Images (deevid.ai immersive grid) */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: 12,
              height: 480,
            }}>
              {/* Large main image */}
              <div style={{
                gridColumn: "1 / 3",
                gridRow: "1 / 2",
                borderRadius: 20,
                overflow: "hidden",
                position: "relative",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={showcase.images[0]}
                  alt={showcase.badge}
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "cover", display: "block",
                  }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(6,6,10,0.5) 0%, transparent 50%)",
                }} />
                {/* Badge overlay */}
                <div style={{
                  position: "absolute", bottom: 16, left: 16,
                  background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                  borderRadius: 50, padding: "6px 14px",
                  fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)",
                  letterSpacing: "0.05em",
                }}>
                  ✦ AI Generated
                </div>
              </div>

              {/* Bottom left */}
              <div style={{
                borderRadius: 20, overflow: "hidden",
                position: "relative",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={showcase.images[1]}
                  alt={showcase.badge}
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "cover", display: "block",
                  }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(135deg, ${showcase.glowColor} 0%, transparent 100%)`,
                }} />
              </div>

              {/* Bottom right */}
              <div style={{
                borderRadius: 20, overflow: "hidden",
                position: "relative",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={showcase.images[2]}
                  alt={showcase.badge}
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "cover", display: "block",
                  }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(135deg, transparent 0%, ${showcase.glowColor} 100%)`,
                }} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Stats Bar (trust signals like deevid.ai) ── */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 48,
          marginTop: 80, paddingTop: 40,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          flexWrap: "wrap",
        }}>
          {[
            { value: "11", label: "Công cụ AI" },
            { value: "50K+", label: "Ảnh đã tạo" },
            { value: "1K+", label: "Người dùng" },
            { value: "< 10s", label: "Thời gian xử lý" },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 28, fontWeight: 800, color: "#fff",
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #fff, rgba(255,255,255,0.7))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 12, color: "rgba(255,255,255,0.35)",
                fontWeight: 500, marginTop: 4,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
