"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  suffix?: string;
  animate?: boolean;
  delay?: number;
}

export function StatCard({ label, value, icon: Icon, iconColor = "#a78bfa", iconBg = "rgba(167,139,250,0.1)", trend, suffix, animate = true, delay = 0 }: StatCardProps) {
  const isPositive = (trend?.value ?? 0) >= 0;

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 12 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ delay, duration: 0.3 }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "#111113", border: "1px solid #1f1f23" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: "#71717a" }}>{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
      </div>

      <div>
        <p className="text-2xl font-black text-white tabular-nums">
          {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
          {suffix && <span className="text-sm font-normal ml-1" style={{ color: "#52525b" }}>{suffix}</span>}
        </p>
        {trend && (
          <div className={cn("flex items-center gap-1 mt-1.5 text-xs font-medium", isPositive ? "text-emerald-400" : "text-red-400")}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{isPositive ? "+" : ""}{trend.value}% {trend.label}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
