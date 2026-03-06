"use client";

import { useState, useEffect, useRef } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface AdminChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  type?: "bar" | "line";
  showLabels?: boolean;
}

export function AdminChart({
  data, color = "#6d28d9", height = 120, type = "bar", showLabels = true
}: AdminChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  const width = 600;
  const padLeft = 0;
  const padBottom = showLabels ? 24 : 4;
  const chartH = height - padBottom;
  const barW = (width - padLeft) / data.length;

  if (type === "line") {
    const pts = data.map((d, i) => {
      const x = padLeft + i * barW + barW / 2;
      const y = chartH - (d.value / max) * chartH * 0.85 + 4;
      return `${x},${y}`;
    });
    const area = [
      `${padLeft + barW / 2},${chartH}`,
      ...pts,
      `${padLeft + (data.length - 1) * barW + barW / 2},${chartH}`,
    ].join(" ");

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={`lg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area */}
        <polygon points={area} fill={`url(#lg-${color.replace("#", "")})`} />
        {/* Line */}
        <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {data.map((d, i) => {
          const x = padLeft + i * barW + barW / 2;
          const y = chartH - (d.value / max) * chartH * 0.85 + 4;
          return <circle key={i} cx={x} cy={y} r="3" fill={color} stroke="white" strokeWidth="1.5" />;
        })}
        {/* Labels */}
        {showLabels && data.map((d, i) => {
          if (data.length > 20 && i % 5 !== 0) return null;
          const x = padLeft + i * barW + barW / 2;
          return (
            <text key={i} x={x} y={height - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{d.label}</text>
          );
        })}
      </svg>
    );
  }

  // Bar chart
  const gap = 2;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const x = padLeft + i * barW + gap;
        const bw = barW - gap * 2;
        const bh = Math.max(2, (d.value / max) * chartH * 0.85);
        const y = chartH - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx="3" fill={color} opacity="0.85" />
            {showLabels && data.length <= 20 && (
              <text x={x + bw / 2} y={height - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{d.label}</text>
            )}
            {showLabels && data.length > 20 && i % 5 === 0 && (
              <text x={x + bw / 2} y={height - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{d.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
