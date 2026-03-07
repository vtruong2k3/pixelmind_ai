"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Loader2, Zap, Image, CreditCard, TrendingUp, Users, Briefcase,
  Activity, DollarSign,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

import { StatCard } from "@/components/dashboard/StatCard";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { hasMinRole, type UserRole } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import { QueryProvider } from "@/components/dashboard/QueryProvider";
import { useUserDashboard, useAdminStats } from "@/hook/useDashboard";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#34d399", PROCESSING: "#60a5fa", QUEUED: "#facc15", FAILED: "#f87171",
};

const TYPE_COLORS: Record<string, { bg: string; label: string }> = {
  spend:    { bg: "#f87171", label: "Chi" },
  earn:     { bg: "#34d399", label: "Nhận" },
  purchase: { bg: "#a78bfa", label: "Mua" },
  bonus:    { bg: "#facc15", label: "Bonus" },
};

// Custom tooltip for area chart
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-2xl"
      style={{ background: "#18181b", border: "1px solid #27272a" }}>
      <p className="text-[11px] font-bold mb-2" style={{ color: "#a1a1aa" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "#71717a" }}>{p.name}:</span>
          <span className="font-bold text-white">{Number(p.value).toLocaleString("vi-VN")}</span>
        </div>
      ))}
    </div>
  );
};

function OverviewInner() {
  const { data: session } = useSession();
  const role    = ((session?.user as any)?.role ?? "USER") as UserRole;
  const isAdmin = hasMinRole(role, "ADMIN");

  const { data: userData, isLoading: uLoading } = useUserDashboard();
  const { data: adminData, isLoading: aLoading } = useAdminStats();

  if (uLoading || (isAdmin && aLoading)) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-red-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-black text-white">
          Xin chào, <span style={{ background: "linear-gradient(135deg,#dc2626,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {session?.user?.name?.split(" ").pop() ?? "bạn"}
          </span> 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "#71717a" }}>
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </motion.div>

      {/* ─── ADMIN VIEW ──────────────────────── */}
      {isAdmin && adminData && (
        <>
          {/* Admin stat cards - 5 stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard label="Tổng người dùng"    value={adminData.overview.totalUsers}        icon={Users}      iconColor="#a78bfa" iconBg="rgba(167,139,250,0.1)" delay={0} />
            <StatCard label="Tổng jobs"           value={adminData.overview.totalJobs}         icon={Briefcase}  iconColor="#60a5fa" iconBg="rgba(96,165,250,0.1)"  delay={0.05} />
            <StatCard label="Users tháng này"     value={adminData.overview.newUsersThisMonth} icon={TrendingUp}  iconColor="#34d399" iconBg="rgba(52,211,153,0.1)"  delay={0.1} />
            <StatCard label="Jobs tháng này"      value={adminData.overview.newJobsThisMonth}  icon={Activity}   iconColor="#facc15" iconBg="rgba(250,204,21,0.1)"  delay={0.15} />
            <StatCard
              label="Tổng credits mua"
              value={(adminData.overview.totalRevenue ?? 0).toLocaleString("vi-VN")}
              icon={DollarSign}
              iconColor="#34d399"
              iconBg="rgba(52,211,153,0.1)"
              suffix=" cr"
              delay={0.2}
            />
          </div>

          {/* 30-day Area Chart */}
          {adminData.chartDays && adminData.chartDays.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl p-6 mb-6"
              style={{ background: "#111113", border: "1px solid #1f1f23" }}
            >
              <h3 className="text-sm font-bold text-white mb-5">Hoạt động 30 ngày qua</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={adminData.chartDays} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gJobs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCredits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#52525b", fontSize: 10 }}
                    axisLine={false} tickLine={false}
                    interval={4}
                  />
                  <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: "#71717a", paddingTop: 12 }}
                    iconType="circle" iconSize={8}
                  />
                  <Area type="monotone" dataKey="users"   name="Users mới"      stroke="#a78bfa" fill="url(#gUsers)"   strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="jobs"    name="Jobs tạo ra"    stroke="#60a5fa" fill="url(#gJobs)"    strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="credits" name="Credits tiêu"   stroke="#f87171" fill="url(#gCredits)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Job status + Plan distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl p-6" style={{ background: "#111113", border: "1px solid #1f1f23" }}>
              <h3 className="text-sm font-bold text-white mb-4">Trạng thái Jobs</h3>
              {adminData.jobStatus && (
                <DonutChart
                  data={Object.entries(adminData.jobStatus)
                    .filter(([, v]) => (v as number) > 0)
                    .map(([k, v]) => ({ label: k, value: v as number, color: STATUS_COLORS[k] ?? "#71717a" }))}
                  size={150}
                  centerValue={Object.values(adminData.jobStatus).reduce((s, v) => s + (v as number), 0)}
                  centerLabel="tổng"
                  showLegend
                />
              )}
            </div>
            <div className="rounded-2xl p-6" style={{ background: "#111113", border: "1px solid #1f1f23" }}>
              <h3 className="text-sm font-bold text-white mb-4">Phân bố gói đăng ký</h3>
              <DonutChart
                data={(adminData.planDistribution ?? []).map((p: any, i: number) => ({
                  label: p.plan.toUpperCase(), value: p.count,
                  color: ["#a78bfa","#60a5fa","#34d399","#facc15"][i % 4],
                }))}
                size={150}
                centerValue={adminData.overview.totalUsers}
                centerLabel="users"
                showLegend
              />
            </div>
          </div>

          {/* Top Features */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: "#111113", border: "1px solid #1f1f23" }}>
            <h3 className="text-sm font-bold text-white mb-4">Top tính năng được dùng nhiều</h3>
            <div className="space-y-2.5">
              {(adminData.featureUsage ?? []).slice(0, 7).map((f: any, i: number) => {
                const max = adminData.featureUsage[0]?.count || 1;
                return (
                  <div key={f.slug} className="flex items-center gap-3">
                    <span className="text-xs w-4 text-center font-bold" style={{ color: "#52525b" }}>{i + 1}</span>
                    <span className="text-xs text-white w-36 truncate">{f.name}</span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "#27272a" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(f.count / max) * 100}%`, background: "linear-gradient(90deg,#dc2626,#7c3aed)" }} />
                    </div>
                    <span className="text-xs font-bold w-12 text-right tabular-nums" style={{ color: "#a1a1aa" }}>
                      {f.count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ─── USER VIEW (always shown) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Credits còn lại"  value={(session?.user as any)?.credits ?? 0}    icon={Zap}        iconColor="#facc15" iconBg="rgba(250,204,21,0.1)"   delay={isAdmin ? 0.3 : 0} />
        <StatCard label="Tổng ảnh đã tạo"  value={userData?.stats.totalJobs ?? 0}           icon={Image}      iconColor="#a78bfa" iconBg="rgba(167,139,250,0.1)"  delay={isAdmin ? 0.35 : 0.05} />
        <StatCard label="Jobs tháng này"   value={userData?.stats.jobsThisMonth ?? 0}       icon={Briefcase}  iconColor="#60a5fa" iconBg="rgba(96,165,250,0.1)"   delay={isAdmin ? 0.4 : 0.1} />
        <StatCard label="Credits đã dùng"  value={userData?.stats.creditsThisMonth ?? 0}    icon={CreditCard} iconColor="#f87171" iconBg="rgba(248,113,113,0.1)"  delay={isAdmin ? 0.45 : 0.15} />
      </div>

      {/* Recent jobs + transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent jobs */}
        <div className="rounded-2xl p-6" style={{ background: "#111113", border: "1px solid #1f1f23" }}>
          <h3 className="text-sm font-bold text-white mb-4">Ảnh gần đây của tôi</h3>
          <div className="space-y-2.5">
            {(userData?.recentJobs ?? []).map(job => (
              <div key={job.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg shrink-0 overflow-hidden" style={{ background: "#27272a" }}>
                  {job.outputUrl && <img src={job.outputUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{job.featureName}</p>
                  <p className="text-[10px]" style={{ color: "#52525b" }}>
                    {new Date(job.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <Badge className="text-[9px] h-5 shrink-0" style={{
                  background: (STATUS_COLORS[job.status] ?? "#71717a") + "20",
                  color: STATUS_COLORS[job.status] ?? "#71717a",
                  border: `1px solid ${(STATUS_COLORS[job.status] ?? "#71717a")}40`,
                }}>
                  {job.status}
                </Badge>
              </div>
            ))}
            {!userData?.recentJobs?.length && (
              <p className="text-xs text-center py-4" style={{ color: "#52525b" }}>Chưa có ảnh nào</p>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="rounded-2xl p-6" style={{ background: "#111113", border: "1px solid #1f1f23" }}>
          <h3 className="text-sm font-bold text-white mb-4">Giao dịch gần đây</h3>
          <div className="space-y-2.5">
            {(userData?.recentTransactions ?? []).map(tx => {
              const typeInfo = TYPE_COLORS[tx.type] ?? { bg: "#71717a", label: tx.type };
              return (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: typeInfo.bg + "20" }}>
                    <CreditCard size={12} style={{ color: typeInfo.bg }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{tx.description}</p>
                    <p className="text-[10px]" style={{ color: "#52525b" }}>
                      {new Date(tx.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <span className="text-xs font-black tabular-nums" style={{ color: tx.amount > 0 ? "#34d399" : "#f87171" }}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("vi-VN")}
                    <span className="text-[9px] ml-0.5 font-normal" style={{ color: "#52525b" }}> cr</span>
                  </span>
                </div>
              );
            })}
            {!userData?.recentTransactions?.length && (
              <p className="text-xs text-center py-4" style={{ color: "#52525b" }}>Chưa có giao dịch</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <OverviewInner />;
}
