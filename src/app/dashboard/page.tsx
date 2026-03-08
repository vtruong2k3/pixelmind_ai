"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Loader2, Zap, Image, CreditCard, TrendingUp, Users, Briefcase,
  Activity, DollarSign, Crown, UserPlus, ShoppingBag,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

import { StatCard } from "@/components/dashboard/StatCard";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { hasMinRole, type UserRole } from "@/lib/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdminStats } from "@/hook/useDashboard";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#34d399", PROCESSING: "#60a5fa", QUEUED: "#facc15", FAILED: "#f87171",
};

const PLAN_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  free:    { color: "#71717a", label: "FREE",    icon: "⚪" },
  starter: { color: "#60a5fa", label: "STARTER", icon: "🔵" },
  pro:     { color: "#a78bfa", label: "PRO",     icon: "💜" },
  max:     { color: "#facc15", label: "MAX",     icon: "👑" },
};

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
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
          <span className="font-bold text-white">
            {p.dataKey === "revenue"
              ? `$${Number(p.value).toLocaleString("en-US", { minimumFractionDigits: 0 })}`
              : Number(p.value).toLocaleString("vi-VN")}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
function OverviewInner() {
  const { data: session } = useSession();
  const role    = ((session?.user as any)?.role ?? "USER") as UserRole;
  const isAdmin = hasMinRole(role, "ADMIN");

  const { data: adminData, isLoading: aLoading } = useAdminStats();

  if (isAdmin && aLoading) {
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
          Xin chào,{" "}
          <span style={{ background: "linear-gradient(135deg,#dc2626,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {session?.user?.name?.split(" ").pop() ?? "bạn"}
          </span>{" "}👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "#71717a" }}>
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </motion.div>

      {isAdmin && adminData && (
        <>
          {/* ── 5 Stat Cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard label="Tổng người dùng"  value={adminData.overview.totalUsers}        icon={Users}      iconColor="#a78bfa" iconBg="rgba(167,139,250,0.1)" delay={0}    />
            <StatCard label="Tổng jobs"         value={adminData.overview.totalJobs}         icon={Briefcase}  iconColor="#60a5fa" iconBg="rgba(96,165,250,0.1)"  delay={0.05} />
            <StatCard label="Users tháng này"   value={adminData.overview.newUsersThisMonth} icon={TrendingUp} iconColor="#34d399" iconBg="rgba(52,211,153,0.1)"  delay={0.1}  />
            <StatCard label="Jobs tháng này"    value={adminData.overview.newJobsThisMonth}  icon={Activity}   iconColor="#facc15" iconBg="rgba(250,204,21,0.1)"  delay={0.15} />
            {/* Doanh thu hôm nay — cùng style StatCard */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: "#111113", border: "1px solid #1f1f23" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold" style={{ color: "#71717a" }}>Doanh thu hôm nay</p>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(52,211,153,0.1)" }}>
                  <DollarSign size={15} style={{ color: "#34d399" }} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-white tabular-nums">
                  ${(adminData.overview.todayRevenueUSD ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] mt-1.5" style={{ color: "#52525b" }}>
                  Tháng: <span className="text-emerald-400 font-semibold">${(adminData.overview.monthRevenueUSD ?? 0).toLocaleString("en-US")}</span>
                  {" · "}Tổng: <span style={{ color: "#a1a1aa" }}>${(adminData.overview.totalRevenueUSD ?? 0).toLocaleString("en-US")}</span>
                </p>
              </div>
            </motion.div>
          </div>

          {/* ── Area Chart ───────────────────────────────────────────── */}
          {adminData.chartDays?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl p-6 mb-6"
              style={{ background: "#111113", border: "1px solid #1f1f23" }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-white">Hoạt động 30 ngày qua</h3>
                <div className="flex items-center gap-1.5 text-[10px] rounded-lg px-2.5 py-1"
                  style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <DollarSign size={10} style={{ color: "#34d399" }} />
                  <span style={{ color: "#34d399" }}>
                    Tháng: ${(adminData.overview.monthRevenueUSD ?? 0).toLocaleString("en-US")}
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={adminData.chartDays} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.3} /><stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gJobs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.3} /><stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#34d399" stopOpacity={0.4} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#71717a", paddingTop: 12 }} iconType="circle" iconSize={8} />
                  <Area type="monotone" dataKey="users"   name="Users mới"       stroke="#a78bfa" fill="url(#gUsers)"   strokeWidth={2}   dot={false} />
                  <Area type="monotone" dataKey="jobs"    name="Jobs tạo ra"      stroke="#60a5fa" fill="url(#gJobs)"    strokeWidth={2}   dot={false} />
                  <Area type="monotone" dataKey="revenue" name="Doanh thu ($USD)" stroke="#34d399" fill="url(#gRevenue)" strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* ── Donut charts ─────────────────────────────────────────── */}
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
                  color: ["#a78bfa", "#60a5fa", "#34d399", "#facc15"][i % 4],
                }))}
                size={150}
                centerValue={adminData.overview.totalUsers}
                centerLabel="users"
                showLegend
              />
            </div>
          </div>

          {/* ── Top Features ─────────────────────────────────────────── */}
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

          {/* ── 2 Bảng thông báo mới ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Bảng 1: Users đăng ký hôm nay */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid #1f1f23" }}
            >
              <div className="flex items-center justify-between px-5 py-4"
                style={{ background: "#111113", borderBottom: "1px solid #1f1f23" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(167,139,250,0.15)" }}>
                    <UserPlus size={12} style={{ color: "#a78bfa" }} />
                  </div>
                  <h3 className="text-sm font-bold text-white">User mới hôm nay</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>
                  {adminData.todayNewUsers?.length ?? 0} người
                </span>
              </div>

              {!adminData.todayNewUsers?.length ? (
                <div className="px-5 py-10 text-center" style={{ background: "#0c0c0e" }}>
                  <p className="text-xs" style={{ color: "#3f3f46" }}>Chưa có user mới hôm nay</p>
                </div>
              ) : (
                <table className="w-full" style={{ background: "#0c0c0e" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1a1a1d" }}>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold" style={{ color: "#52525b" }}>Người dùng</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold" style={{ color: "#52525b" }}>Gói</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold" style={{ color: "#52525b" }}>Giờ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData.todayNewUsers.map((u, i) => {
                      const planCfg = PLAN_CONFIG[u.plan] ?? PLAN_CONFIG.free;
                      return (
                        <tr key={u.id}
                          style={{ borderBottom: "1px solid #141416", background: i % 2 === 0 ? "#0c0c0e" : "#0e0e10" }}>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={u.image ?? ""} />
                                <AvatarFallback className="text-[9px] bg-zinc-800 text-zinc-400">
                                  {u.name?.[0]?.toUpperCase() ?? "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-white truncate max-w-[120px]">{u.name ?? "—"}</p>
                                <p className="text-[9px] truncate max-w-[120px]" style={{ color: "#52525b" }}>{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[9px] font-bold" style={{ color: planCfg.color }}>
                              {planCfg.icon} {planCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[10px] tabular-nums" style={{ color: "#52525b" }}>
                              {new Date(u.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </motion.div>

            {/* Bảng 2: Người dùng mua gói gần đây */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid #1f1f23" }}
            >
              <div className="flex items-center justify-between px-5 py-4"
                style={{ background: "#111113", borderBottom: "1px solid #1f1f23" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(250,204,21,0.12)" }}>
                    <Crown size={12} style={{ color: "#facc15" }} />
                  </div>
                  <h3 className="text-sm font-bold text-white">Nâng cấp gói gần đây</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(250,204,21,0.1)", color: "#facc15" }}>
                  10 gần nhất
                </span>
              </div>

              {!adminData.recentPurchases?.length ? (
                <div className="px-5 py-10 text-center" style={{ background: "#0c0c0e" }}>
                  <p className="text-xs" style={{ color: "#3f3f46" }}>Chưa có giao dịch nào</p>
                </div>
              ) : (
                <table className="w-full" style={{ background: "#0c0c0e" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1a1a1d" }}>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold" style={{ color: "#52525b" }}>Người dùng</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold" style={{ color: "#52525b" }}>Gói</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold" style={{ color: "#52525b" }}>Credits</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold" style={{ color: "#52525b" }}>Số tiền</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold" style={{ color: "#52525b" }}>Ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData.recentPurchases.map((tx, i) => {
                      const planCfg = PLAN_CONFIG[tx.plan] ?? PLAN_CONFIG.free;
                      return (
                        <tr key={tx.id}
                          style={{ borderBottom: "1px solid #141416", background: i % 2 === 0 ? "#0c0c0e" : "#0e0e10" }}>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={tx.user.image ?? ""} />
                                <AvatarFallback className="text-[9px] bg-zinc-800 text-zinc-400">
                                  {tx.user.name?.[0]?.toUpperCase() ?? "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-white truncate max-w-[110px]">{tx.user.name ?? "—"}</p>
                                <p className="text-[9px] truncate max-w-[110px]" style={{ color: "#52525b" }}>{tx.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[10px] font-bold uppercase" style={{ color: planCfg.color }}>
                              {planCfg.icon} {planCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[10px] font-bold tabular-nums" style={{ color: "#facc15" }}>
                              +{tx.credits.toLocaleString("vi-VN")}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[10px] font-bold tabular-nums text-emerald-400">
                              ${(tx as any).usdAmount > 0 ? (tx as any).usdAmount.toLocaleString("en-US") : "0"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[9px] tabular-nums" style={{ color: "#52525b" }}>
                              {new Date(tx.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </motion.div>

          </div>
        </>
      )}

      {/* Non-admin fallback */}
      {!isAdmin && (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm" style={{ color: "#52525b" }}>Bạn không có quyền xem trang này.</p>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <OverviewInner />;
}
