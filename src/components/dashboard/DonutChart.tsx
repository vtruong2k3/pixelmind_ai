"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DonutSlice { label: string; value: number; color: string; }

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string | number;
  showLegend?: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg px-3 py-2 shadow-xl"
      style={{ background: "#18181b", border: "1px solid #27272a" }}>
      <p className="text-xs font-semibold text-white">{d.name}</p>
      <p className="text-xs" style={{ color: d.payload.color }}>
        {d.value.toLocaleString("vi-VN")} ({((d.payload.pct ?? 0)).toFixed(1)}%)
      </p>
    </div>
  );
};

export function DonutChart({
  data,
  size = 160,
  centerLabel,
  centerValue,
  showLegend = true,
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const enriched = data.map(d => ({ ...d, pct: (d.value / total) * 100 }));

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <div style={{ width: size, height: size, flexShrink: 0, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={enriched}
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="85%"
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              animationBegin={0}
              animationDuration={800}
            >
              {enriched.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text overlay */}
        {centerValue !== undefined && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <p className="text-lg font-black text-white leading-none">
              {typeof centerValue === "number"
                ? centerValue.toLocaleString("vi-VN")
                : centerValue}
            </p>
            {centerLabel && (
              <p className="text-[10px] mt-0.5" style={{ color: "#71717a" }}>
                {centerLabel}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          {enriched.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: s.color }}
              />
              <span className="text-xs truncate" style={{ color: "#a1a1aa" }}>
                {s.label}
              </span>
              <span className="text-xs font-bold text-white ml-auto pl-3 tabular-nums">
                {s.value.toLocaleString("vi-VN")}
              </span>
              <span className="text-[10px] tabular-nums" style={{ color: "#52525b" }}>
                {s.pct.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
