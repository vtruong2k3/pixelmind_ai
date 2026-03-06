"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users, ImageIcon, Zap, TrendingUp,
  ArrowUpRight, Clock, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminChart } from "@/components/admin/AdminChart";
import { adminService, type AdminOverviewData } from "@/services/adminService";

const PLAN_COLORS: Record<string, string> = {
  free: "#64748b", starter: "#06b6d4", pro: "#a855f7", max: "#f59e0b",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free", starter: "Starter ⚡", pro: "Pro ✦", max: "Max 👑",
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"users" | "jobs" | "credits">("users");

  useEffect(() => {
    adminService
      .getStats()
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin" style={{ color: "#ef4444" }} />
          <p className="text-sm" style={{ color: "#71717a" }}>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const ov = data?.overview ?? { totalUsers:0, totalJobs:0, newUsersThisMonth:0, newJobsThisMonth:0, totalCreditsEarned:0, creditsEarnedAllTime:0 };
  const js = data?.jobStatus ?? { done: 0, pending: 0, processing: 0, failed: 0 };

  const chartData = (data?.chartDays ?? []).map(d => ({
    label: d.label,
    value: chartMode === "users" ? d.users : chartMode === "jobs" ? d.jobs : d.creditsEarned,
  }));

  const totalJobs = js.done + js.pending + js.processing + js.failed;

  return (
    <div className="p-8 max-w-[1300px]">
      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#52525b" }}>
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-3xl font-black text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#71717a" }}>Tổng quan hệ thống PixelMind AI</p>
      </motion.header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Tổng người dùng", value: (ov.totalUsers ?? 0).toLocaleString(),
            sub: `+${ov.newUsersThisMonth ?? 0} tháng này`,
            icon: <Users size={18} />, color: "#6d28d9",
          },
          {
            label: "Tổng jobs", value: (ov.totalJobs ?? 0).toLocaleString(),
            sub: `+${ov.newJobsThisMonth ?? 0} tháng này`,
            icon: <ImageIcon size={18} />, color: "#0891b2",
          },
          {
            label: "Credits bán ra (tổng)", value: (ov.creditsEarnedAllTime ?? 0).toLocaleString(),
            sub: `Từ giao dịch purchase`,
            icon: <Zap size={18} />, color: "#d97706",
          },
          {
            label: "Credits bán (tháng này)", value: (ov.totalCreditsEarned ?? 0).toLocaleString(),
            sub: "30 ngày qua",
            icon: <TrendingUp size={18} />, color: "#059669",
          },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <AdminStatCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* Chart + Job Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: "#18181b", border: "1px solid #27272a" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white">Biểu đồ 30 ngày qua</h3>
            <div className="flex gap-1">
              {(["users", "jobs", "credits"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setChartMode(m)}
                  className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all"
                  style={chartMode === m
                    ? { background: "#ef4444", color: "#fff" }
                    : { background: "#27272a", color: "#71717a" }}
                >
                  {m === "users" ? "Users" : m === "jobs" ? "Jobs" : "Credits"}
                </button>
              ))}
            </div>
          </div>
          <AdminChart
            data={chartData}
            color={chartMode === "users" ? "#6d28d9" : chartMode === "jobs" ? "#0891b2" : "#d97706"}
            height={140}
            type="bar"
          />
        </motion.div>

        {/* Job Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl p-6"
          style={{ background: "#18181b", border: "1px solid #27272a" }}
        >
          <h3 className="text-sm font-bold text-white mb-5">Trạng thái Jobs</h3>
          <div className="space-y-3">
            {[
              { label: "Thành công", count: js.done, color: "#34d399", icon: <CheckCircle2 size={14} /> },
              { label: "Đang xử lý", count: js.processing, color: "#60a5fa", icon: <Loader2 size={14} /> },
              { label: "Chờ xử lý", count: js.pending, color: "#facc15", icon: <Clock size={14} /> },
              { label: "Thất bại", count: js.failed, color: "#f87171", icon: <XCircle size={14} /> },
            ].map(row => (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-xs" style={{ color: row.color }}>
                    {row.icon}
                    <span className="text-white font-medium">{row.label}</span>
                  </div>
                  <span className="text-xs font-black text-white">{row.count.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full w-full" style={{ background: "#27272a" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: totalJobs ? `${(row.count / totalJobs * 100).toFixed(1)}%` : "0%",
                      background: row.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #27272a" }}>
            <p className="text-xs" style={{ color: "#52525b" }}>Tổng cộng</p>
            <p className="text-xl font-black text-white">{totalJobs.toLocaleString()} jobs</p>
          </div>
        </motion.div>
      </div>

      {/* Feature Usage + Plan Distribution + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Feature Usage */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl p-6"
          style={{ background: "#18181b", border: "1px solid #27272a" }}
        >
          <h3 className="text-sm font-bold text-white mb-4">Top tính năng sử dụng</h3>
          {(data?.featureUsage ?? []).length > 0 ? (
            <div className="space-y-3">
              {(data?.featureUsage ?? []).map((f, i) => {
                const max = data!.featureUsage[0].count;
                const pct = Math.round((f.count / max) * 100);
                const colors = ["#6d28d9", "#0891b2", "#059669", "#d97706", "#dc2626"];
                return (
                  <div key={f.slug}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white font-medium truncate">{f.name}</span>
                      <span style={{ color: "#71717a" }}>{f.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full w-full" style={{ background: "#27272a" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-center py-6" style={{ color: "#52525b" }}>Chưa có dữ liệu</p>
          )}
        </motion.div>

        {/* Plan Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-2xl p-6"
          style={{ background: "#18181b", border: "1px solid #27272a" }}
        >
          <h3 className="text-sm font-bold text-white mb-4">Phân bổ gói dùng</h3>
          {(data?.planDistribution ?? []).length > 0 ? (
            <div className="space-y-3">
              {(data?.planDistribution ?? []).map((p) => {
                const total = (data?.planDistribution ?? []).reduce((acc, x) => acc + x.count, 0);
                const pct = Math.round((p.count / total) * 100);
                return (
                  <div key={p.plan}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold" style={{ color: PLAN_COLORS[p.plan] ?? "#fff" }}>
                        {PLAN_LABELS[p.plan] ?? p.plan}
                      </span>
                      <span style={{ color: "#71717a" }}>{p.count.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full w-full" style={{ background: "#27272a" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PLAN_COLORS[p.plan] ?? "#6d28d9" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-center py-6" style={{ color: "#52525b" }}>Chưa có dữ liệu</p>
          )}
        </motion.div>

        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "#18181b", border: "1px solid #27272a" }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #27272a" }}>
            <h3 className="text-sm font-bold text-white">Users mới nhất</h3>
            <Link href="/admin/users" className="text-xs font-bold flex items-center gap-1" style={{ color: "#ef4444" }}>
              Xem tất cả <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "#27272a" }}>
            {(data?.recentUsers ?? []).slice(0, 5).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                {u.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.image} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0"
                    style={{ background: "linear-gradient(135deg,#6d28d9,#4f46e5)" }}>
                    {(u.name ?? u.email)[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{u.name ?? "—"}</p>
                  <p className="text-[10px] truncate" style={{ color: "#52525b" }}>{u.email}</p>
                </div>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0"
                  style={{
                    background: PLAN_COLORS[u.plan] + "22",
                    color: PLAN_COLORS[u.plan] ?? "#fff"
                  }}>
                  {u.plan}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Jobs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#18181b", border: "1px solid #27272a" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #27272a" }}>
          <h3 className="text-sm font-bold text-white">Jobs gần đây</h3>
          <Link href="/admin/jobs" className="text-xs font-bold flex items-center gap-1" style={{ color: "#ef4444" }}>
            Xem tất cả <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid #27272a" }}>
                {["User", "Tính năng", "Chất lượng", "Trạng thái", "Credits", "Thời gian"].map(h => (
                  <th key={h} className="text-left px-6 py-3 font-semibold" style={{ color: "#52525b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.recentJobs ?? []).map((job: any) => (
                <tr key={job.id} style={{ borderBottom: "1px solid #1f1f23" }}>
                  <td className="px-6 py-3">
                    <div>
                      <p className="text-white font-medium">{job.user?.name ?? "—"}</p>
                      <p style={{ color: "#52525b" }}>{job.user?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-white">{job.featureName}</td>
                  <td className="px-6 py-3">
                    <span className="uppercase font-bold" style={{ color: job.quality === "hd" ? "#facc15" : "#71717a" }}>
                      {job.quality}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{
                      background:
                        job.status === "done" ? "rgba(52,211,153,0.12)" :
                        job.status === "failed" ? "rgba(248,113,113,0.12)" :
                        job.status === "processing" ? "rgba(96,165,250,0.12)" : "rgba(250,204,21,0.12)",
                      color:
                        job.status === "done" ? "#34d399" :
                        job.status === "failed" ? "#f87171" :
                        job.status === "processing" ? "#60a5fa" : "#facc15",
                    }}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-bold" style={{ color: "#facc15" }}>-{job.creditUsed}</td>
                  <td className="px-6 py-3" style={{ color: "#52525b" }}>
                    {new Date(job.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
