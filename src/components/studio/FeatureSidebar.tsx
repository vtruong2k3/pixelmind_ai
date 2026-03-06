"use client";
import Link from "next/link";
import { History } from "lucide-react";
import { CATEGORIES } from "@/lib/features";
import { CatIcon } from "./icons";
import type { FeatureCategory } from "@/types/ui";

interface FeatureSidebarProps {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

export default function FeatureSidebar({ activeCategory, onCategoryChange }: FeatureSidebarProps) {
  return (
    <aside
      className="flex flex-col items-center py-3 gap-1.5 shrink-0"
      style={{ width: "64px", background: "#0a0a0a", borderRight: "1px solid #1c1c1c" }}
    >
      {CATEGORIES.map((cat: FeatureCategory) => (
        <button
          key={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          title={cat.label}
          className="flex flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all"
          style={{
            width: "48px", height: "48px",
            background: activeCategory === cat.id ? "rgba(180,167,214,0.12)" : "transparent",
            color: activeCategory === cat.id ? "var(--lavender)" : "rgba(255,255,255,0.3)",
            border: activeCategory === cat.id ? "1px solid rgba(180,167,214,0.2)" : "1px solid transparent",
          }}
        >
          <CatIcon id={cat.id} size={18} />
          <span>{cat.label.split(" ")[0].slice(0, 4)}</span>
        </button>
      ))}

      <div className="mt-auto">
        <Link href="/history" title="Lịch sử">
          <div
            className="flex flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer hover:text-white/50"
            style={{ width: "48px", height: "48px", color: "rgba(255,255,255,0.25)", border: "1px solid transparent" }}
          >
            <History size={18} />
            <span>Lịch sử</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
