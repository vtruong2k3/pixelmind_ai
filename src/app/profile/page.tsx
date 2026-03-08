"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import {
  Zap, CreditCard, ImageIcon, ArrowUpRight, ArrowDownRight,
  Shield, LogOut, History, Sparkles, TrendingUp, Loader2,
} from "lucide-react";
import { userService, type UserDashboardData } from "@/services/userService";

const PLAN_STYLES: Record<string, { bg: string; color: string; border: string; label: string; shadow?: string }> = {
  free:    { bg: "linear-gradient(135deg,#f1f5f9,#e2e8f0)", color: "#64748b", border: "#cbd5e1", label: "Free",        shadow: "0 1px 6px rgba(100,116,139,0.15)" },
  starter: { bg: "linear-gradient(135deg,#06b6d4,#0891b2)", color: "#fff",    border: "transparent", label: "Starter ⚡", shadow: "0 2px 10px rgba(6,182,212,0.4)" },
  pro:     { bg: "linear-gradient(135deg,#a855f7,#7c3aed,#6d28d9)", color: "#fff", border: "transparent", label: "Pro ✦",    shadow: "0 2px 12px rgba(168,85,247,0.5)" },
  max:     { bg: "linear-gradient(135deg,#f59e0b,#d97706,#b45309)", color: "#fff", border: "transparent", label: "Max 👑",   shadow: "0 2px 12px rgba(245,158,11,0.5)" },
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  // ── React Query: cache profile data 1 phút ────────────────────────────────
  const { data, isLoading } = useQuery<UserDashboardData>({
    queryKey: ["user-dashboard"],
    queryFn: () => userService.getDashboard(),
    staleTime: 60_000,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-48">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 text-violet-500 animate-spin" />
          <p className="text-sm text-gray-400">Đang tải hồ sơ...</p>
        </div>
      </div>
    </div>
  );

  const user = data?.user;
  const credits = (session?.user as any)?.credits ?? user?.credits ?? 0;
  const plan = user?.plan ?? "free";
  const userName = user?.name ?? "Người dùng";
  const userInitial = userName[0]?.toUpperCase() ?? "U";
  const planStyle = PLAN_STYLES[plan.toLowerCase()] ?? PLAN_STYLES.free;

  return (
    <div className="min-h-screen" style={{ background: "#f7f7f9" }}>
      <Navbar />

      {/* Cover Banner */}
      <div className="w-full relative" style={{ height: "180px", background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 45%, #4f46e5 100%)" }}>
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                width: `${60 + i * 30}px`, height: `${60 + i * 30}px`,
                background: "rgba(255,255,255,0.15)",
                top: `${[10, 50, -20, 30, 60, 20][i]}%`,
                left: `${[5, 20, 50, 70, 85, 95][i]}%`,
                transform: "translate(-50%,-50%)",
              }} />
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Profile Card */}
        <div className="relative -mt-16 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                {user?.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={user.image} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-md" />
                  : (
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-md"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                      {userInitial}
                    </div>
                  )}
                {isAdmin && (
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow"
                    style={{ background: "#f59e0b" }}>
                    <Shield size={12} color="white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-black text-gray-900 tracking-tight">{userName}</h1>
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mono"
                      style={{ background: "#fef3c7", color: "#d97706" }}>Admin</span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase mono"
                    style={{ background: planStyle.bg, color: planStyle.color, border: `1px solid ${planStyle.border}`, boxShadow: planStyle.shadow }}>
                    {planStyle.label}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{user?.email}</p>
                <p className="text-xs text-gray-300 mono mt-1">
                  Thành viên từ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <Link href="/studio"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}>
                  <Sparkles size={13} /> Tạo ảnh
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors border border-gray-200">
                  <LogOut size={13} /> Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            {
              icon: <Zap size={20} />,
              iconBg: "linear-gradient(135deg,#7c3aed,#a78bfa)",
              label: "Credits còn lại",
              value: isAdmin ? "∞" : credits.toLocaleString(),
              sub: isAdmin ? "Không giới hạn" : "Nạp thêm →",
              href: !isAdmin ? "/pricing" : undefined,
            },
            {
              icon: <ImageIcon size={20} />,
              iconBg: "linear-gradient(135deg,#059669,#34d399)",
              label: "Ảnh đã tạo",
              value: (data?.stats.totalJobs ?? 0).toLocaleString(),
              sub: "kể từ khi đăng ký",
            },
            {
              icon: <TrendingUp size={20} />,
              iconBg: "linear-gradient(135deg,#dc2626,#f87171)",
              label: "Credits đã dùng",
              value: (data?.stats.totalCreditsUsed ?? 0).toLocaleString(),
              sub: "tổng cộng",
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: stat.iconBg }}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-black text-gray-900 mono tracking-tight">{stat.value}</p>
                <p className="text-xs font-semibold text-gray-600 mt-0.5">{stat.label}</p>
                {stat.href ? (
                  <Link href={stat.href} className="text-xs font-bold flex items-center gap-1 mt-1" style={{ color: "#7c3aed" }}>
                    {stat.sub} <ArrowUpRight size={10} />
                  </Link>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/pricing"
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-violet-100 shadow-sm hover:-translate-y-0.5 transition-all group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#ede9fe" }}>
              <CreditCard size={17} style={{ color: "#7c3aed" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Nạp Credits</p>
              <p className="text-xs text-gray-400">Mua thêm credits</p>
            </div>
            <ArrowUpRight size={15} className="ml-auto text-gray-300 group-hover:text-violet-500 transition-colors" />
          </Link>
          <Link href="/history"
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:-translate-y-0.5 transition-all group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#f0fdf4" }}>
              <History size={17} style={{ color: "#059669" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Lịch sử</p>
              <p className="text-xs text-gray-400">Ảnh đã tạo</p>
            </div>
            <ArrowUpRight size={15} className="ml-auto text-gray-300 group-hover:text-green-500 transition-colors" />
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-10 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Lịch sử giao dịch</h2>
              <p className="text-xs text-gray-400 mt-0.5">Credits nạp &amp; sử dụng</p>
            </div>
            <Link href="/pricing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: "#ede9fe", color: "#7c3aed" }}>
              <Zap size={11} /> Nạp credits
            </Link>
          </div>

          {!data?.recentTransactions?.length ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f3f0ff" }}>
                <Zap size={22} style={{ color: "#a78bfa" }} />
              </div>
              <p className="text-sm text-gray-400">Chưa có giao dịch nào.</p>
              <Link href="/studio" className="text-sm font-bold px-4 py-2 rounded-xl text-white"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                Tạo ảnh ngay →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.recentTransactions.map(tx => (
                <div key={tx.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={tx.amount > 0 ? { background: "rgba(52,211,153,0.12)" } : { background: "rgba(248,113,113,0.12)" }}>
                    {tx.amount > 0
                      ? <ArrowUpRight size={15} style={{ color: "#34d399" }} />
                      : <ArrowDownRight size={15} style={{ color: "#f87171" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{tx.description}</p>
                    <p className="text-xs text-gray-400 mono">{new Date(tx.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <span className={`font-black mono text-sm ${tx.amount > 0 ? "text-emerald-500" : "text-red-400"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
