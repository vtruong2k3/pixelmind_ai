"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { AI_FEATURES, FEATURE_ICON_MAP } from "@/lib/features";
import { FIcon } from "./icons";
import type { AIFeature } from "@/types/ui";

interface TemplateCarouselProps {
  onSelectTemplate: (f: AIFeature) => void;
}

export default function TemplateCarousel({ onSelectTemplate }: TemplateCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 260;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div style={{ marginTop: 24 }}>
      {/* Header */}
      <div style={{ padding: "0 0 16px", textAlign: "center" }}>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
          Templates có sẵn
        </h3>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
          Chọn template để bắt đầu nhanh. Upload ảnh và nhận kết quả AI chất lượng cao.
        </p>
      </div>

      {/* Carousel */}
      <div style={{ position: "relative" }}>
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          style={{
            position: "absolute", left: -4, top: "50%", transform: "translateY(-50%)",
            zIndex: 10, width: 36, height: 36, borderRadius: "50%",
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          style={{
            position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)",
            zIndex: 10, width: 36, height: 36, borderRadius: "50%",
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <ChevronRight size={18} />
        </button>

        {/* Scrollable cards */}
        <div
          ref={scrollRef}
          style={{
            display: "flex", gap: 12, overflowX: "auto",
            scrollbarWidth: "none", padding: "8px 0",
          }}
        >
          {AI_FEATURES.map(feature => (
            <TemplateCard
              key={feature.slug}
              feature={feature}
              onSelect={() => onSelectTemplate(feature)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Template Card ── */
const GRADIENT_MAP: Record<string, string> = {
  insert_object: "linear-gradient(135deg, #667eea, #764ba2)",
  swap_swimsuit: "linear-gradient(135deg, #4facfe, #00f2fe)",
  swap_face: "linear-gradient(135deg, #fa709a, #fee140)",
  swap_shirt: "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  change_color: "linear-gradient(135deg, #ffecd2, #fcb69f)",
  extract_clothing: "linear-gradient(135deg, #a1c4fd, #c2e9fb)",
  to_anime: "linear-gradient(135deg, #f093fb, #f5576c)",
  drawing_to_photo: "linear-gradient(135deg, #43e97b, #38f9d7)",
  restore_photo: "linear-gradient(135deg, #fbc2eb, #a6c1ee)",
  swap_background: "linear-gradient(135deg, #89f7fe, #66a6ff)",
  text_to_image: "linear-gradient(135deg, #7c3aed, #a78bfa)",
};

function TemplateCard({ feature, onSelect }: { feature: AIFeature; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const gradient = GRADIENT_MAP[feature.slug] ?? "linear-gradient(135deg, #667eea, #764ba2)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: 200, minWidth: 200, height: 140,
        borderRadius: 14, overflow: "hidden",
        cursor: "pointer",
        flexShrink: 0,
        background: gradient,
        border: hovered ? "2px solid #7c3aed" : "2px solid transparent",
        transition: "border-color 0.2s, transform 0.2s",
        transform: hovered ? "scale(1.03)" : "scale(1)",
      }}
      onClick={onSelect}
    >
      {/* Feature icon + name */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "32px 14px 12px",
          background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FIcon slug={feature.slug} size={16} style={{ color: "#fff" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
            {feature.name}
          </span>
        </div>
      </div>

      {/* Hover overlay with Create button */}
      {hovered && (
        <div
          style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 10,
              background: "#7c3aed", color: "#fff",
              fontSize: 13, fontWeight: 700,
            }}
          >
            <Play size={14} fill="#fff" />
            Tạo
          </div>
        </div>
      )}
    </div>
  );
}
