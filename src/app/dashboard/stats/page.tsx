"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, Users, Briefcase, Zap, DollarSign, BarChart3 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";

import { StatCard } from "@/components/dashboard/StatCard";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { useAdminStats } from "@/hook/useDashboard";
import { hasMinRole, type UserRole } from "@/lib/roles";

const CHART_COLORS = ["#a78bfa", "#60a5fa", "#34d399", "#facc15", "#f87171", "#fb923c", "#e879f9"];

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#34d399", PROCESSING: "#60a5fa", QUEUED: "#facc15", FAILED: "#f87171",
};

const AreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-2xl" style={{ background: "#18181b", border: "1px solid #27272a" }}>
      <p className="text-[11px] font-bold mb-2" style={{ color: "#a1a1aa" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs mb-0.5">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span style={{ color: "#71717a" }}>{p.name}:</span>
          <span className="font-bold text-white">{Number(p.value).toLocaleString("vi-VN")}</span>
        </div>
      ))}
    </div>
  );
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-2xl" style={{ background: "#18181b", border: "1px solid #27272a" }}>
      <p className="text-[11px] font-bold text-white mb-1">{label}</p>
      <p className="text-xs" style={{ color: "#a78bfa" }}>
        {Number(payload[0]?.value).toLocaleString("vi-VN")} lượt dùng
      </p>
    </div>
  );
};

function StatsInner() {
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "USER") as UserRole;
  const isAdmin = hasMinRole(role, "ADMIN");

  const { data, isLoading } = useAdminStats();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-zinc-500 text-sm">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-red-500" size={32} />
      </div>
    );
  }

  const featureBarData = (data?.featureUsage ?? []).slice(0, 10).map((f: any) => ({
    name: f.name.length > 18 ? f.name.slice(0, 16) + "…" : f.name,
    fullName: f.name,
    count: f.count,
  }));

  const totalJobs = Object.values(data?.jobStatus ?? {}).reduce((s, v) => s + (v as number), 0);
  const completedJobs = (data?.jobStatus as Record<string, number> | undefined)?.COMPLETED ?? 0;
  const successRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : "0";

  return (
    <div className="p-8 max-w-[1400px]">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <BarChart3 size={22} className="text-violet-400" />
          Thống kê hệ thống
        </h1>
        <p className="text-sm mt-1" style={{ color: "#71717a" }}>Tổng quan hiệu suất & tăng trưởng trong 30 ngày qua</p>
      </motion.div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Tổng người dùng"   value={data?.overview.totalUsers ?? 0}          icon={Users}       iconColor="#a78bfa" iconBg="rgba(167,139,250,0.1)" delay={0} />
        <StatCard label="Tổng jobs"          value={data?.overview.totalJobs ?? 0}           icon={Briefcase}   iconColor="#60a5fa" iconBg="rgba(96,165,250,0.1)"  delay={0.05} />
        <StatCard label="Users tháng này"    value={data?.overview.newUsersThisMonth ?? 0}   icon={TrendingUp}  iconColor="#34d399" iconBg="rgba(52,211,153,0.1)"  delay={0.1} />
        <StatCard label="Jobs tháng này"     value={data?.overview.newJobsThisMonth ?? 0}    icon={Zap}         iconColor="#facc15" iconBg="rgba(250,204,21,0.1)"  delay={0.15} />
        <StatCard
          label="Tổng credits mua"
          value={(data?.overview.totalRevenueUSD ?? 0).toLocaleString("vi-VN")}
          icon={DollarSign}
          iconColor="#34d399"
          iconBg="rgba(52,211,153,0.1)"
          suffix=" cr"
          delay={0.2}
        />
      </div>

      {/* 30-day Area Chart - Users */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="rounded-2xl p-6 mb-5" style={{ background: "#111113", border: "1px solid #1f1f23" }}
      >
        <h3 className="text-sm font-bold text-white mb-1">Tăng trưởng 30 ngày</h3>
        <p className="text-[11px] mb-5" style={{ color: "#52525b" }}>Users mới, Jobs tạo ra và Credits tiêu theo ngày</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data?.chartDays ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gJ" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<AreaTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#71717a", paddingTop: 12 }} iconType="circle" iconSize={8} />
            <Area type="monotone" dataKey="users"   name="Users mới"    stroke="#a78bfa" fill="url(#gU)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="jobs"    name="Jobs tạo ra"  stroke="#60a5fa" fill="url(#gJ)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="credits" name="Credits tiêu" stroke="#f87171" fill="url(#gC)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top Features Bar Chart + Donut Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Top Features Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl p-6" style={{ background: "#111113", border: "1px solid #1f1f23" }}
        >
          <h3 className="text-sm font-bold text-white mb-1">Top tính năng AI</h3>
          <p className="text-[11px] mb-5" style={{ color: "#52525b" }}>Lượt sử dụng theo tính năng (top 10)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={featureBarData} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="count" name="Lượt dùng" radius={[0, 4, 4, 0]}>
                {featureBarData.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Right column: Job status + Success rate */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="flex flex-col gap-4"
        >
          <div className="rounded-2xl p-5 flex-1" style={{ background: "#111113", border: "1px solid #1f1f23" }}>
            <h3 className="text-sm font-bold text-white mb-4">Trạng thái Jobs</h3>
            <DonutChart
              data={Object.entries(data?.jobStatus ?? {})
                .filter(([, v]) => (v as number) > 0)
                .map(([k, v]) => ({ label: k, value: v as number, color: STATUS_COLORS[k] ?? "#71717a" }))}
              size={130}
              centerValue={`${successRate}%`}
              centerLabel="thành công"
              showLegend
            />
          </div>

          <div className="rounded-2xl p-5" style={{ background: "#111113", border: "1px solid #1f1f23" }}>
            <h3 className="text-sm font-bold text-white mb-4">Gói đăng ký</h3>
            <DonutChart
              data={(data?.planDistribution ?? []).map((p: any, i: number) => ({
                label: p.plan.toUpperCase(), value: p.count,
                color: ["#a78bfa", "#60a5fa", "#34d399", "#facc15"][i % 4],
              }))}
              size={130}
              centerValue={data?.overview.totalUsers ?? 0}
              centerLabel="users"
              showLegend
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function DashboardStatsPage() {
  return <StatsInner />;
}
