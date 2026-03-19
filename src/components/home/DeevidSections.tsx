"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Shield, Lock,
  Sparkles, Wand2, Palette, Camera, Layers, Shirt, UserRound, PenLine,
  Image as ImageIcon, ScanFace, Paintbrush,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   SECTION 1 — AI INTRO  
   "Khám phá mọi khả năng của AI Image"
   Typing prompt animation + before/after preview
   ═══════════════════════════════════════════════════ */

const TYPING_PROMPTS = [
  "Thay chiếc áo sơ mi trắng sang áo vest đen thanh lịch",
  "Biến bức ảnh chân dung thành phong cách anime Ghibli",
  "Thành phố tương lai với tòa nhà pha lê lúc hoàng hôn",
  "Phục hồi bức ảnh gia đình cũ bị phai màu từ năm 1990",
];

function TypingPrompt() {
  const [promptIdx, setPromptIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const prompt = TYPING_PROMPTS[promptIdx];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < prompt.length) {
          setDisplayText(prompt.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setPromptIdx((prev) => (prev + 1) % TYPING_PROMPTS.length);
        }
      }
    }, isDeleting ? 20 : 40);
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, promptIdx]);

  return (
    <div style={{
      maxWidth: 640, margin: "0 auto",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16, padding: "20px 24px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <Wand2 size={18} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
      <span style={{
        fontSize: 14, color: "rgba(255,255,255,0.5)",
        minHeight: 20, fontFamily: "inherit",
      }}>
        {displayText}
        <span style={{
          display: "inline-block", width: 2, height: 16,
          background: "#06b6d4", marginLeft: 1,
          animation: "blink 1s step-end infinite", verticalAlign: "text-bottom",
        }} />
      </span>
    </div>
  );
}

function AIIntroSection() {
  return (
    <section style={{
      background: "#000", padding: "120px 24px 100px", textAlign: "center",
    }}>
      <h2 style={{
        fontSize: "clamp(32px, 4.5vw, 56px)", fontWeight: 700,
        color: "#fff", lineHeight: 1.2, letterSpacing: "-0.03em",
        margin: "0 0 32px",
      }}>
        Khám phá mọi khả năng<br />của AI Image
      </h2>
      <TypingPrompt />

      {/* Before/After showcase images */}
      <div style={{
        display: "flex", gap: 12, justifyContent: "center",
        marginTop: 48, maxWidth: 900, margin: "48px auto 0",
      }}>
        {[
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=420&q=80",
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=420&q=80",
        ].map((src, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: 16, overflow: "hidden", position: "relative",
            aspectRatio: "16/10",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="AI showcase" style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
            }} />
            <div style={{
              position: "absolute", bottom: 12, left: 12,
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
              borderRadius: 50, padding: "4px 12px",
              fontSize: 11, fontWeight: 600, color: "#fff",
            }}>
              {i === 0 ? "Ảnh gốc" : "✦ AI Result"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION 2, 3, 4 — TOOL SHOWCASES (deevid.ai exact clone)
   3D carousel: center card large (~60vw), side cards faded/scaled
   Teal arc divider, centered heading, prompt pill + arrows
   ═══════════════════════════════════════════════════ */

const TOOL_SECTIONS = [
  {
    title: "Chỉnh sửa ảnh AI",
    desc: "Thay áo, ghép vật thể, đổi background, thay khuôn mặt — tất cả được xử lý bởi AI. Kết quả tự nhiên, chất lượng cao, chỉ trong vài giây.",
    link: "/studio?feature=swap_shirt",
    cards: [
      {
        img: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80",
        video: "https://assets.mixkit.co/videos/1171/1171-720.mp4",
        prompt: "Thay chiếc áo trắng sang áo vest đen thanh lịch",
      },
      {
        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
        video: "https://assets.mixkit.co/videos/34563/34563-720.mp4",
        prompt: "Thay khuôn mặt cho nhân vật trong ảnh",
      },
      {
        img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80",
        video: "https://assets.mixkit.co/videos/4815/4815-720.mp4",
        prompt: "Đổi background sang cảnh biển hoàng hôn",
      },
      {
        img: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&q=80",
        video: "https://assets.mixkit.co/videos/42373/42373-720.mp4",
        prompt: "Ghép vật thể túi xách vào tay người mẫu",
      },
      {
        img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80",
        video: "https://assets.mixkit.co/videos/34487/34487-720.mp4",
        prompt: "Thay đồ bơi cho người mẫu trong ảnh",
      },
    ],
  },
  {
    title: "Sáng tạo AI",
    desc: "Biến ảnh thật thành anime, chuyển tranh vẽ thành ảnh chân thực, phục hồi ảnh cũ — khám phá mọi khả năng sáng tạo không giới hạn.",
    link: "/studio?feature=to_anime",
    cards: [
      {
        img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
        video: "https://assets.mixkit.co/videos/4907/4907-720.mp4",
        prompt: "Biến bức ảnh chân dung thành phong cách anime Ghibli",
      },
      {
        img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
        video: "https://assets.mixkit.co/videos/4487/4487-720.mp4",
        prompt: "Chuyển tranh vẽ thành ảnh chân thực realistic",
      },
      {
        img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80",
        video: "https://assets.mixkit.co/videos/3759/3759-720.mp4",
        prompt: "Phục hồi bức ảnh gia đình cũ bị phai màu",
      },
      {
        img: "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=800&q=80",
        video: "https://assets.mixkit.co/videos/52096/52096-720.mp4",
        prompt: "Đổi màu quần áo sang tông đỏ burgundy",
      },
      {
        img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80",
        video: "https://assets.mixkit.co/videos/34508/34508-720.mp4",
        prompt: "Lấy quần áo từ ảnh mẫu ghép vào ảnh khác",
      },
    ],
    /* comparison data for Image-to-Video style layout */
    comparisons: [
      {
        originalImg: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80",
        resultImg: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
        prompt: "Biến bức ảnh chân dung thành phong cách anime Ghibli",
      },
      {
        originalImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
        resultImg: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
        prompt: "Chuyển tranh vẽ thành ảnh chân thực realistic",
      },
      {
        originalImg: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=80",
        resultImg: "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=800&q=80",
        prompt: "Phục hồi bức ảnh gia đình cũ bị phai màu",
      },
      {
        originalImg: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
        resultImg: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80",
        prompt: "Lấy quần áo từ ảnh mẫu ghép vào ảnh khác",
      },
    ],
  },
  {
    title: "Tạo ảnh từ văn bản",
    desc: "Chỉ cần mô tả bằng văn bản, AI sẽ tạo hình ảnh chất lượng cao — realistic, anime, digital art, oil painting và nhiều phong cách khác.",
    link: "/studio?feature=text_to_image",
    cards: [
      {
        img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
        video: "https://assets.mixkit.co/videos/4881/4881-720.mp4",
        prompt: "Thành phố tương lai với những tòa nhà pha lê lúc hoàng hôn",
      },
      {
        img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80",
        video: "https://assets.mixkit.co/videos/3028/3028-720.mp4",
        prompt: "Phong cảnh mơ với cánh đồng hoa oải hương tím",
      },
      {
        img: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80",
        video: "https://assets.mixkit.co/videos/4890/4890-720.mp4",
        prompt: "Vũ trụ fantasy với tinh vân đầy sắc màu",
      },
      {
        img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        video: "https://assets.mixkit.co/videos/2611/2611-720.mp4",
        prompt: "Dãy núi hùng vĩ phủ tuyết trắng trong nắng sớm",
      },
      {
        img: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
        video: "https://assets.mixkit.co/videos/5765/5765-720.mp4",
        prompt: "Đại dương sâu thẳm với rạn san hô phát sáng",
      },
    ],
  },
];

/* ── 3D Carousel — deevid.ai exact clone ──
   Center card: ~62vw, full opacity, thin white border, 20px radius
   Side cards: ~18vw, 0.4 opacity, clipped at viewport edges
   Gap: ~28px between center and side cards
   Below: prompt pill (#1D1D1D) + circular nav arrows
   ──────────────────────────────────────────── */

function ShowcaseCarousel({ section }: { section: typeof TOOL_SECTIONS[0] }) {
  const [active, setActive] = useState(0);
  const cards = section.cards;
  const total = cards.length;

  const prev = () => setActive((a) => (a - 1 + total) % total);
  const next = () => setActive((a) => (a + 1) % total);

  const getIndex = (offset: number) => (active + offset + total) % total;

  /* card styles */
  const sideCardStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    [side]: "-2vw",
    top: "50%",
    transform: "translateY(-50%) scale(0.88)",
    width: "clamp(140px, 22vw, 320px)",
    height: "clamp(240px, 46vw, 500px)",
    borderRadius: 20,
    overflow: "hidden",
    opacity: 0.35,
    transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    zIndex: 1,
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.06)",
  });

  return (
    <>
      {/* ── 3D Carousel Container ── */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "clamp(300px, 42vw, 520px)",
        overflow: "visible",
      }}>
        {/* Side card LEFT — clipped at viewport edge */}
        <div style={sideCardStyle("left")} onClick={prev}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cards[getIndex(-1)].img} alt="" style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
          }} />
        </div>

        {/* CENTER card — full size, video autoplay */}
        <div style={{
          position: "absolute",
          left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          width: "clamp(260px, 62vw, 900px)",
          height: "100%",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 12px 80px rgba(0,0,0,0.7), 0 0 120px rgba(6,182,212,0.04)",
          transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 10,
        }}>
          {/* Video element like deevid.ai */}
          <video
            key={cards[active].video}
            autoPlay
            loop
            muted
            playsInline
            poster={cards[active].img}
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
            }}
          >
            <source src={cards[active].video} type="video/mp4" />
          </video>
          {/* Bottom gradient overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 25%)",
            pointerEvents: "none",
          }} />
        </div>

        {/* Side card RIGHT — clipped at viewport edge */}
        <div style={sideCardStyle("right")} onClick={next}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cards[getIndex(1)].img} alt="" style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
          }} />
        </div>
      </div>

      {/* ── Prompt pill + nav arrows (deevid.ai exact) ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 12, marginTop: 28, padding: "0 24px",
      }}>
        {/* Left arrow */}
        <button onClick={prev} style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "#1D1D1D",
          border: "none",
          color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#ff3466")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#1D1D1D")}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Prompt pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "#1D1D1D",
          border: "none",
          borderRadius: 50, padding: "12px 24px",
          maxWidth: 580, minWidth: 0,
          overflow: "hidden",
        }}>
          <span style={{
            fontSize: 13, fontWeight: 700, color: "#fff",
            flexShrink: 0, letterSpacing: "0.02em",
          }}>
            Prompt
          </span>
          <span style={{
            fontSize: 14, color: "rgba(255,255,255,0.6)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {cards[active].prompt}
          </span>
        </div>

        {/* Right arrow */}
        <button onClick={next} style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "#1D1D1D",
          border: "none",
          color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#ff3466")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#1D1D1D")}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </>
  );
}

/* ── Single Showcase Section (deevid.ai exact) ── */
function SingleShowcase({ section }: { section: typeof TOOL_SECTIONS[0] }) {
  return (
    <section style={{
      background: "linear-gradient(180deg, #060d14 0%, #000 40%, #000 100%)",
      padding: "0 0 80px",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* ── Teal arc divider at top (deevid.ai signature) ── */}
      <div style={{
        position: "relative",
        width: "100%",
        height: 120,
        overflow: "hidden",
        marginBottom: 48,
      }}>
        {/* The arc shape — a large circle whose bottom edge peeks in */}
        <div style={{
          position: "absolute",
          left: "50%", bottom: 0,
          transform: "translateX(-50%)",
          width: "160%",
          height: 700,
          borderRadius: "50%",
          background: "linear-gradient(180deg, rgba(6,182,212,0.06) 0%, transparent 50%)",
          border: "1px solid rgba(6,182,212,0.12)",
          borderBottom: "none",
          boxShadow: "0 -30px 100px rgba(6,182,212,0.05)",
        }} />
      </div>

      {/* ── Centered heading + description ── */}
      <div style={{
        textAlign: "center",
        maxWidth: 900, margin: "0 auto",
        padding: "0 24px 52px",
      }}>
        <h2 style={{
          fontSize: "clamp(36px, 4.5vw, 52px)", fontWeight: 700,
          color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em",
          marginBottom: 20,
        }}>
          {section.title}
        </h2>
        <p style={{
          fontSize: 17, color: "rgba(255,255,255,0.5)",
          lineHeight: 1.7, maxWidth: 720, margin: "0 auto",
        }}>
          {section.desc}
        </p>
      </div>

      {/* ── 3D Carousel ── */}
      <ShowcaseCarousel section={section} />

      {/* ── Full-width teal divider line (deevid.ai) ── */}
      <div style={{
        width: "100%", height: 1, marginTop: 80,
        background: "linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.3) 30%, rgba(6,182,212,0.3) 70%, transparent 100%)",
      }} />
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   COMPARISON SHOWCASE — deevid.ai "Image to Video" clone
   Side-by-side: Original image (left) → Result (right)
   With prompt box below original + red >> arrow
   ═══════════════════════════════════════════════════ */

function ComparisonShowcase({ section }: { section: typeof TOOL_SECTIONS[1] }) {
  const comparisons = section.comparisons || [];
  const [active, setActive] = useState(0);
  const total = comparisons.length;
  const prev = () => setActive((a) => (a - 1 + total) % total);
  const next = () => setActive((a) => (a + 1) % total);
  const c = comparisons[active];

  if (!c) return null;

  return (
    <section style={{
      background: "#000",
      padding: "0 0 80px",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Spacing top */}
      <div style={{ height: 80 }} />

      {/* ── Heading + description ── */}
      <div style={{ textAlign: "center", maxWidth: 900, margin: "0 auto", padding: "0 24px 32px" }}>
        <h2 style={{
          fontSize: "clamp(36px, 4.5vw, 52px)", fontWeight: 700,
          color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 20,
        }}>
          {section.title}
        </h2>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 720, margin: "0 auto" }}>
          {section.desc}
        </p>
      </div>

      {/* ── CTA button ── */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <a href={section.link} style={{
          display: "inline-block", padding: "14px 36px",
          borderRadius: 50, fontSize: 15, fontWeight: 600,
          color: "#00CFFF",
          background: "rgba(0,207,255,0.08)",
          border: "1px solid rgba(0,207,255,0.3)",
          textDecoration: "none",
          transition: "all 0.3s",
        }}>
          Thử PixelMind AI →
        </a>
      </div>

      {/* ── Comparison carousel — landing page size ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 20, maxWidth: 1300, margin: "0 auto", padding: "0 24px",
        position: "relative",
      }}>
        {/* Left arrow */}
        <button onClick={prev} style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)", border: "none",
          color: "#fff", cursor: "pointer", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        >
          <ChevronLeft size={22} />
        </button>

        {/* Side-by-side content — fixed height container */}
        <div style={{
          display: "flex", gap: 20, flex: 1,
          height: 780,
        }}>
          {/* LEFT: Original image (2/3) + Prompt box (1/3) */}
          <div style={{ flex: "0 0 40%", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Original image card — image with padding inside dark box */}
            <div style={{
              position: "relative", borderRadius: 20,
              background: "#151718", flex: "2 1 0",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20, overflow: "hidden",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.originalImg} alt="Original" style={{
                width: "100%", height: "100%", objectFit: "cover", display: "block",
                borderRadius: 12,
                transition: "opacity 0.4s ease",
              }} />
              {/* Floating pill */}
              <div style={{
                position: "absolute", top: 16, left: 16,
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)",
                borderRadius: 50, padding: "6px 14px",
                fontSize: 12, color: "#fff", fontWeight: 500,
              }}>
                Ảnh gốc
              </div>
            </div>
            {/* Prompt box — takes ~1/3 of column */}
            <div style={{
              background: "#151718", borderRadius: 20, padding: "24px 28px",
              flex: "1 1 0", display: "flex", flexDirection: "column",
              justifyContent: "flex-start", minHeight: 160,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "0.02em" }}>
                Prompt
              </div>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                {c.prompt}
              </div>
            </div>
          </div>

          {/* MIDDLE: Red >> arrow */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, fontSize: 32, color: "#ff3466", fontWeight: 700,
          }}>
            »
          </div>

          {/* RIGHT: Result image — fills full height */}
          <div style={{
            flex: "0 0 54%", position: "relative",
            borderRadius: 20, overflow: "hidden", background: "#151718",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.resultImg} alt="Result" style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              transition: "opacity 0.4s ease",
            }} />
            {/* Floating pill */}
            <div style={{
              position: "absolute", top: 16, left: 16,
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)",
              borderRadius: 50, padding: "6px 14px",
              fontSize: 12, color: "#fff", fontWeight: 500,
            }}>
              Kết quả
            </div>
          </div>
        </div>

        {/* Right arrow */}
        <button onClick={next} style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)", border: "none",
          color: "#fff", cursor: "pointer", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* ── Full-width teal divider line (deevid.ai) ── */}
      <div style={{
        width: "100%", height: 1, marginTop: 80,
        background: "linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.3) 30%, rgba(6,182,212,0.3) 70%, transparent 100%)",
      }} />
    </section>
  );
}

/* Self-contained: renders all 3 tool showcases */
function AllShowcases() {
  return (
    <>
      <SingleShowcase section={TOOL_SECTIONS[0]} />
      <ComparisonShowcase section={TOOL_SECTIONS[1]} />
      <SingleShowcase section={TOOL_SECTIONS[2]} />
    </>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION 5 — POPULAR TEMPLATES
   3-column grid of template cards
   ═══════════════════════════════════════════════════ */

const TEMPLATES = [
  { img: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80", title: "Thay áo thời trang", tag: "Fashion" },
  { img: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80", title: "Anime Style", tag: "Creative" },
  { img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80", title: "Sci-Fi City", tag: "Text to Image" },
  { img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", title: "Face Swap Pro", tag: "Editing" },
  { img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&q=80", title: "Phục hồi ảnh cũ", tag: "Restore" },
  { img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80", title: "Tranh vẽ → Ảnh", tag: "Creative" },
];

function PopularTemplates() {
  return (
    <section style={{ background: "#000", padding: "100px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h3 style={{
          fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700,
          color: "#fff", textAlign: "center", marginBottom: 48,
        }}>
          Popular Templates
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}>
          {TEMPLATES.map((t, i) => (
            <Link key={i} href="/studio" style={{ textDecoration: "none" }}>
              <div style={{
                borderRadius: 16, overflow: "hidden",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.3s",
                cursor: "pointer",
              }}>
                <div style={{ aspectRatio: "16/10", position: "relative", overflow: "hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.img} alt={t.title} style={{
                    width: "100%", height: "100%", objectFit: "cover", display: "block",
                    transition: "transform 0.4s ease",
                  }} />
                  <div style={{
                    position: "absolute", top: 12, left: 12,
                    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
                    borderRadius: 50, padding: "4px 10px",
                    fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                  }}>
                    {t.tag}
                  </div>
                </div>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{t.title}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: "rgba(6,182,212,0.8)",
                  }}>
                    Try it now →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link href="/studio" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 28px", borderRadius: 50,
            fontSize: 14, fontWeight: 700, color: "#06b6d4",
            background: "transparent",
            border: "1px solid rgba(6,182,212,0.3)",
            textDecoration: "none", transition: "all 0.3s",
          }}>
            Xem tất cả templates
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION 6 — AI MODELS 
   Grid of AI model logos (trust signals)
   ═══════════════════════════════════════════════════ */

const AI_MODELS = [
  { name: "Stable Diffusion", initial: "SD" },
  { name: "DALL·E", initial: "DE" },
  { name: "Flux", initial: "FX" },
  { name: "Midjourney", initial: "MJ" },
  { name: "ControlNet", initial: "CN" },
  { name: "IP Adapter", initial: "IP" },
  { name: "GFPGAN", initial: "GF" },
  { name: "Real-ESRGAN", initial: "RE" },
  { name: "SAM", initial: "SM" },
  { name: "CLIP", initial: "CL" },
];

function AIModelsSection() {
  return (
    <section style={{ background: "#000", padding: "100px 24px" }}>
      <div style={{
        maxWidth: 1000, margin: "0 auto",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 24, padding: "48px 40px",
      }}>
        <h3 style={{
          fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 700,
          color: "#fff", textAlign: "center", marginBottom: 12,
        }}>
          Powered by AI Models hàng đầu
        </h3>
        <p style={{
          fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center",
          marginBottom: 40, maxWidth: 600, margin: "0 auto 40px",
        }}>
          Tích hợp các model AI tiên tiến nhất để mang đến kết quả chất lượng cao.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
        }}>
          {AI_MODELS.map(model => (
            <div key={model.name} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: "20px 12px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              transition: "all 0.3s",
              cursor: "default",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.15))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.7)",
                letterSpacing: "-0.02em",
              }}>
                {model.initial}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)",
                textAlign: "center",
              }}>
                {model.name}
              </span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link href="/studio" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 28px", borderRadius: 50,
            fontSize: 14, fontWeight: 700, color: "#fff",
            background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
            textDecoration: "none", transition: "all 0.3s",
          }}>
            Tạo ảnh ngay
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION 7 — SAFETY
   ═══════════════════════════════════════════════════ */

function SafetySection() {
  return (
    <section style={{ background: "#000", padding: "80px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h3 style={{
          fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700,
          color: "#fff", textAlign: "center", marginBottom: 40,
        }}>
          An toàn là ưu tiên hàng đầu
        </h3>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            {
              icon: Lock, title: "Bảo mật dữ liệu",
              desc: "Ảnh của bạn được xử lý an toàn. Chúng tôi không chia sẻ dữ liệu với bất kỳ bên thứ ba nào.",
            },
            {
              icon: Shield, title: "Nội dung an toàn",
              desc: "Hệ thống phát hiện và ngăn chặn nội dung không phù hợp. Mọi ảnh tạo ra đều an toàn.",
            },
          ].map(item => (
            <div key={item.title} style={{
              flex: "1 1 300px", padding: 28, borderRadius: 16,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <item.icon size={24} style={{ color: "#06b6d4", marginBottom: 16 }} />
              <h4 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                {item.title}
              </h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION 8 — FAQ ACCORDION
   ═══════════════════════════════════════════════════ */

const FAQ_ITEMS = [
  { q: "PixelMind AI là gì?", a: "PixelMind AI là nền tảng chỉnh sửa ảnh bằng AI với 11 công cụ: thay áo, thay mặt, đổi nền, tạo ảnh từ văn bản và nhiều hơn nữa. Không cần kỹ năng thiết kế." },
  { q: "Tôi có thể dùng miễn phí không?", a: "Có! Bạn nhận 10 credits miễn phí khi đăng ký. Mỗi lần tạo ảnh tốn 10 credits. Bạn có thể mua thêm credits hoặc đăng ký gói tháng." },
  { q: "Ảnh của tôi có được bảo mật không?", a: "Tuyệt đối. Ảnh được xử lý trong môi trường an toàn và không bao giờ được chia sẻ với bên thứ ba. Bạn hoàn toàn sở hữu kết quả." },
  { q: "Có hỗ trợ API không?", a: "Có, PixelMind cung cấp REST API cho developers. Hỗ trợ xử lý quy mô lớn và dễ tích hợp vào ứng dụng của bạn." },
  { q: "Chất lượng ảnh đầu ra như thế nào?", a: "PixelMind sử dụng các model AI tiên tiến như Stable Diffusion, ControlNet, GFPGAN để đảm bảo kết quả chất lượng cao, tự nhiên." },
  { q: "Thanh toán bằng phương thức nào?", a: "Chúng tôi hỗ trợ PayPal (quốc tế) và MoMo (Việt Nam). Giao dịch được mã hóa và an toàn." },
];

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section style={{ background: "#000", padding: "80px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h3 style={{
          fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700,
          color: "#fff", textAlign: "center", marginBottom: 48,
        }}>
          FAQ
        </h3>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {FAQ_ITEMS.map((faq, i) => (
            <div key={i} style={{
              borderTop: i === 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}>
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                style={{
                  width: "100%", padding: "20px 0",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "transparent", border: "none", color: "#fff",
                  cursor: "pointer", fontSize: 15, fontWeight: 600, textAlign: "left",
                }}
              >
                {faq.q}
                <ChevronDown size={18} style={{
                  color: "rgba(255,255,255,0.4)", flexShrink: 0,
                  transition: "transform 0.3s",
                  transform: openIdx === i ? "rotate(180deg)" : "rotate(0deg)",
                }} />
              </button>
              <AnimatePresence>
                {openIdx === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: "hidden" }}
                  >
                    <p style={{
                      fontSize: 14, color: "rgba(255,255,255,0.45)",
                      lineHeight: 1.7, padding: "0 0 20px", margin: 0,
                    }}>
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION 9 — FINAL CTA 
   Colorful gradient glows + big heading + CTA button
   ═══════════════════════════════════════════════════ */

function FinalCTA() {
  return (
    <section style={{
      background: "#000", padding: "120px 24px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Gradient glow orbs — left/right */}
      <div style={{
        position: "absolute", top: "20%", left: "-5%",
        width: "40%", height: "80%",
        background: "radial-gradient(ellipse, rgba(251,146,60,0.12) 0%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "10%", right: "-5%",
        width: "40%", height: "80%",
        background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "5%", right: "20%",
        width: "30%", height: "60%",
        background: "radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <p style={{
          fontSize: 18, color: "rgba(255,255,255,0.5)", marginBottom: 16, fontWeight: 500,
        }}>
          Unlock Limitless Creativity!
        </p>
        <h2 style={{
          fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800,
          color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em",
          marginBottom: 40,
        }}>
          Dễ sử dụng và tạo ảnh nhanh chóng.<br />
          Bắt đầu tạo ảnh AI ngay hôm nay.
        </h2>

        <Link href="/studio" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "16px 40px", borderRadius: 50,
          fontSize: 16, fontWeight: 700, color: "#fff",
          background: "linear-gradient(135deg, #06b6d4, #0891b2)",
          boxShadow: "0 4px 30px rgba(6,182,212,0.4), 0 0 80px rgba(6,182,212,0.15)",
          textDecoration: "none", transition: "all 0.3s",
        }}>
          Thử miễn phí ngay
        </Link>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION 10 — FOOTER
   Multi-column dark footer
   ═══════════════════════════════════════════════════ */

function DeevidFooter() {
  return (
    <footer style={{
      background: "#000", borderTop: "1px solid rgba(255,255,255,0.06)",
      padding: "60px 24px 40px",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40,
      }}>
        {/* Brand */}
        <div>
          <h4 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            PixelMind AI
          </h4>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.7, maxWidth: 280 }}>
            Nền tảng chỉnh sửa ảnh AI hàng đầu với 11 công cụ mạnh mẽ. Tạo, chỉnh sửa và biến đổi ảnh chỉ trong vài giây.
          </p>
        </div>

        {/* Tools */}
        <div>
          <h5 style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            Công cụ
          </h5>
          {["Thay áo", "Thay mặt", "Đổi nền", "Tạo ảnh AI", "Anime", "Phục hồi ảnh"].map(l => (
            <Link key={l} href="/studio" style={{
              display: "block", fontSize: 13, color: "rgba(255,255,255,0.4)",
              textDecoration: "none", marginBottom: 10, transition: "color 0.2s",
            }}>
              {l}
            </Link>
          ))}
        </div>

        {/* Company */}
        <div>
          <h5 style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            Công ty
          </h5>
          {[
            { label: "Pricing", href: "/pricing" },
            { label: "Gallery", href: "/gallery" },
            { label: "Blog", href: "/blog" },
          ].map(l => (
            <Link key={l.label} href={l.href} style={{
              display: "block", fontSize: 13, color: "rgba(255,255,255,0.4)",
              textDecoration: "none", marginBottom: 10, transition: "color 0.2s",
            }}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Legal */}
        <div>
          <h5 style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            Pháp lý
          </h5>
          {["Terms of Service", "Privacy Policy", "Content Policy"].map(l => (
            <Link key={l} href="#" style={{
              display: "block", fontSize: 13, color: "rgba(255,255,255,0.4)",
              textDecoration: "none", marginBottom: 10, transition: "color 0.2s",
            }}>
              {l}
            </Link>
          ))}
        </div>
      </div>

      <div style={{
        maxWidth: 1200, margin: "40px auto 0",
        paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          © 2024 PixelMind AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════
   BLINK ANIMATION CSS 
   ═══════════════════════════════════════════════════ */
function BlinkStyle() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes blink {
        50% { opacity: 0; }
      }
      div::-webkit-scrollbar {
        display: none;
      }
    ` }} />
  );
}

/* ═══════════════════════════════════════════════════
   EXPORT — All deevid-style sections combined
   ═══════════════════════════════════════════════════ */
export {
  AIIntroSection,
  AllShowcases,
  PopularTemplates,
  AIModelsSection,
  SafetySection,
  FAQSection,
  FinalCTA,
  DeevidFooter,
  BlinkStyle,
};
