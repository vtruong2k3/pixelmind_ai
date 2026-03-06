"use client";
import { Zap } from "lucide-react";
import type { AIFeature } from "@/types/ui";
import { FIcon } from "./icons";

interface FeaturePanelProps {
  features: AIFeature[];
  activeSlug: string;
  onSelect: (feature: AIFeature) => void;
}

export default function FeaturePanel({ features, activeSlug, onSelect }: FeaturePanelProps) {
  return (
    <aside
      className="shrink-0 overflow-y-auto py-4 px-3"
      style={{ width: "280px", background: "#0f0f0f", borderRight: "1px solid #1c1c1c" }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-widest px-2 mb-3"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        Chọn tính năng
      </p>

      {features.map((feature: AIFeature) => {
        const isActive = activeSlug === feature.slug;
        return (
          <button
            key={feature.slug}
            onClick={() => onSelect(feature)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left mb-0.5 transition-all"
            style={{
              background: isActive ? "rgba(180,167,214,0.1)" : "transparent",
              border:     isActive ? "1px solid rgba(180,167,214,0.18)" : "1px solid transparent",
              color:      isActive ? "var(--lavender)" : "rgba(255,255,255,0.55)",
            }}
          >
            {/* Icon */}
            <div
              className="flex items-center justify-center rounded-lg shrink-0"
              style={{
                width: "34px", height: "34px",
                background: isActive ? "rgba(180,167,214,0.15)" : "rgba(255,255,255,0.05)",
              }}
            >
              <FIcon slug={feature.slug} size={16} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{feature.name}</div>
              <div className="flex items-center gap-1 mt-0.5" style={{ opacity: 0.4 }}>
                <Zap size={9} />
                <span className="text-[10px]">
                  {feature.credits} credit{feature.credits > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </aside>
  );
}
