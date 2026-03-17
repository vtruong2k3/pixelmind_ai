"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { AI_FEATURES, FEATURE_PROMPTS } from "@/lib/features";
import { FIcon } from "./icons";
import type { AIFeature } from "@/types/ui";

/* ──────────────────────────────────────────────
 * Templates Grid — shows existing features with
 * their pre-built prompts as clickable cards
 * ──────────────────────────────────────────────*/

interface TemplatesGridProps {
  onSelectTemplate: (f: AIFeature, prompt: string) => void;
}

const GRADIENT_MAP: Record<string, string> = {
  insert_object:    "linear-gradient(135deg, #667eea, #764ba2)",
  swap_swimsuit:    "linear-gradient(135deg, #4facfe, #00f2fe)",
  swap_face:        "linear-gradient(135deg, #fa709a, #fee140)",
  swap_shirt:       "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  change_color:     "linear-gradient(135deg, #ffecd2, #fcb69f)",
  extract_clothing: "linear-gradient(135deg, #a1c4fd, #c2e9fb)",
  to_anime:         "linear-gradient(135deg, #f093fb, #f5576c)",
  drawing_to_photo: "linear-gradient(135deg, #43e97b, #38f9d7)",
  restore_photo:    "linear-gradient(135deg, #fbc2eb, #a6c1ee)",
  swap_background:  "linear-gradient(135deg, #89f7fe, #66a6ff)",
  text_to_image:    "linear-gradient(135deg, #7c3aed, #a78bfa)",
};

export default function TemplatesGrid({ onSelectTemplate }: TemplatesGridProps) {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
          Chọn template có sẵn
        </h3>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
          Click template để tự động điền prompt AI. Upload ảnh rồi nhấn &quot;Tạo ảnh&quot;.
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 12,
      }}>
        {AI_FEATURES.map(feature => {
          const prompt = FEATURE_PROMPTS[feature.slug] ?? "";
          return (
            <TemplateCard
              key={feature.slug}
              feature={feature}
              prompt={prompt}
              onSelect={() => onSelectTemplate(feature, prompt)}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Template Card ── */
function TemplateCard({
  feature, prompt, onSelect,
}: {
  feature: AIFeature;
  prompt: string;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const gradient = GRADIENT_MAP[feature.slug] ?? "linear-gradient(135deg, #667eea, #764ba2)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        background: "#161B20",
        border: hovered ? "1px solid #7c3aed" : "1px solid rgba(255,255,255,0.06)",
        transition: "border-color 0.2s, transform 0.2s",
        transform: hovered ? "scale(1.02)" : "scale(1)",
      }}
    >
      {/* Gradient header */}
      <div style={{ height: 80, background: gradient, position: "relative" }}>
        <div style={{
          position: "absolute", top: 12, left: 12,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <FIcon slug={feature.slug} size={16} style={{ color: "#fff" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
            {feature.name}
          </span>
        </div>

        {/* Credits badge */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          fontSize: 10, fontWeight: 700,
          padding: "2px 8px", borderRadius: 8,
          background: "rgba(0,0,0,0.4)", color: "#fff",
          backdropFilter: "blur(4px)",
        }}>
          {feature.credits} credits
        </div>

        {/* Hover overlay */}
        {hovered && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 10,
              background: "#7c3aed", color: "#fff",
              fontSize: 12, fontWeight: 700,
            }}>
              <Play size={12} fill="#fff" />
              Sử dụng
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{ padding: "12px 12px 14px" }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
          {feature.desc}
        </p>
        {prompt && (
          <p style={{
            fontSize: 11, color: "rgba(255,255,255,0.25)",
            lineHeight: 1.4,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            Prompt: {prompt}
          </p>
        )}
        {feature.imageCount > 0 && (
          <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
            📷 Cần {feature.imageCount} ảnh
          </div>
        )}
      </div>
    </div>
  );
}
