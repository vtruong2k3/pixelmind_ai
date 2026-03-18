"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DateRange = {
  label: string;
  days: number;
};

const PRESETS: DateRange[] = [
  { label: "7 ngày", days: 7 },
  { label: "14 ngày", days: 14 },
  { label: "30 ngày", days: 30 },
  { label: "90 ngày", days: 90 },
];

export function DateRangePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (days: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = PRESETS.find(p => p.days === value) ?? PRESETS[2];

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(!open)}
        className="h-8 text-xs gap-1.5 font-semibold"
        style={{ borderColor: "#27272a", color: "#a1a1aa", background: "#18181b" }}
      >
        <Calendar size={11} />
        {active.label}
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 top-10 rounded-xl shadow-xl z-50 py-1 min-w-[120px]"
          style={{ background: "#18181b", border: "1px solid #27272a" }}
        >
          {PRESETS.map(p => (
            <button
              key={p.days}
              onClick={() => { onChange(p.days); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between"
              style={{
                color: p.days === value ? "#f87171" : "#a1a1aa",
                background: p.days === value ? "rgba(220,38,38,0.08)" : "transparent",
              }}
              onMouseEnter={e => { if (p.days !== value) (e.target as HTMLElement).style.background = "#27272a"; }}
              onMouseLeave={e => { if (p.days !== value) (e.target as HTMLElement).style.background = "transparent"; }}
            >
              <span className="font-semibold">{p.label}</span>
              {p.days === value && <span className="text-[8px]">✓</span>}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
