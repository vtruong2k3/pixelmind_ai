interface AdminStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; label: string };
}

export function AdminStatCard({ label, value, sub, icon, color, trend }: AdminStatCardProps) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#18181b", border: "1px solid #27272a" }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "22" }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: trend.value >= 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
              color: trend.value >= 0 ? "#34d399" : "#f87171",
            }}
          >
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: "#a1a1aa" }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "#52525b" }}>{sub}</p>}
      </div>
    </div>
  );
}
