"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, Shield, Gift, Ban, Crown, Clock,
  Briefcase, CreditCard, TrendingUp, TrendingDown,
  CheckCircle2, AlertCircle, Zap, UserCog, RefreshCw,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminService } from "@/services/adminService";
import { ROLE_LABELS, ROLE_COLORS, type UserRole } from "@/lib/roles";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  COMPLETED:  { bg: "rgba(52,211,153,0.12)",  text: "#34d399", label: "Hoàn thành" },
  PROCESSING: { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa", label: "Đang xử lý" },
  QUEUED:     { bg: "rgba(250,204,21,0.12)",  text: "#facc15", label: "Chờ xử lý" },
  FAILED:     { bg: "rgba(248,113,113,0.12)", text: "#f87171", label: "Thất bại"   },
};

const TX_COLORS: Record<string, { text: string; label: string }> = {
  spend:    { text: "#f87171", label: "Chi tiêu" },
  purchase: { text: "#a78bfa", label: "Mua" },
  earn:     { text: "#34d399", label: "Nhận" },
  bonus:    { text: "#facc15", label: "Bonus" },
};

const PLAN_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  free:    { label: "FREE",    color: "#71717a", icon: "⚪" },
  starter: { label: "STARTER", color: "#60a5fa", icon: "🔵" },
  pro:     { label: "PRO",     color: "#a78bfa", icon: "💜" },
  max:     { label: "MAX",     color: "#facc15", icon: "👑" },
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [tab, setTab] = useState<"info" | "jobs" | "transactions">("info");
  const [giftAmount, setGiftAmount] = useState(0);
  const [giftDesc, setGiftDesc] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-user-detail", id],
    queryFn: () => adminService.getUser(id),
    staleTime: 30_000,
  });

  const updateMut = useMutation({
    mutationFn: (payload: Parameters<typeof adminService.updateUser>[1]) =>
      adminService.updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-user-detail", id] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Đã cập nhật");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-red-500" size={28} />
      </div>
    );
  }

  const user = data?.user;
  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-zinc-500">Không tìm thấy user</p>
      </div>
    );
  }

  const roleColor = ROLE_COLORS[user.role as UserRole] ?? ROLE_COLORS.USER;
  const planCfg = PLAN_CONFIG[user.plan] ?? PLAN_CONFIG.free;
  const planExpired = user.planExpiresAt && new Date(user.planExpiresAt) < new Date();

  const TABS = [
    { id: "info", label: "Thông tin", icon: UserCog },
    { id: "jobs", label: `Jobs (${user.jobs?.length ?? 0})`, icon: Briefcase },
    { id: "transactions", label: `Giao dịch (${user.creditTransactions?.length ?? 0})`, icon: CreditCard },
  ] as const;

  return (
    <div className="p-8 max-w-[1100px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <Button size="sm" variant="ghost" onClick={() => router.push("/dashboard/users")}
          className="h-8 px-2 text-zinc-500 hover:text-white">
          <ArrowLeft size={14} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            {user.name ?? "Không tên"}
            {user.isBanned && (
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                <Ban size={9} className="inline mr-0.5" /> BỊ KHÓA
              </span>
            )}
          </h1>
          <p className="text-xs" style={{ color: "#52525b" }}>{user.email} · ID: {user.id}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}
          style={{ borderColor: "#27272a", color: "#a1a1aa", background: "#18181b" }}>
          <RefreshCw size={13} className="mr-1.5" /> Refresh
        </Button>
      </motion.div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl p-6 mb-5" style={{ background: "#111113", border: "1px solid #1f1f23" }}
      >
        <div className="flex items-start gap-5">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback className="text-lg font-black bg-zinc-800 text-zinc-400">
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            {user.isBanned && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                <Ban size={11} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${roleColor.bg} ${roleColor.text}`}>
                {ROLE_LABELS[user.role as UserRole]}
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full"
                style={{ background: `${planCfg.color}18`, color: planCfg.color, border: `1px solid ${planCfg.color}30` }}>
                {planCfg.icon} {planCfg.label}
              </span>
              {planExpired && (
                <span className="text-[9px] text-red-400 font-semibold">HẾT HẠN</span>
              )}
            </div>
            {user.planExpiresAt && (
              <p className="text-[10px] flex items-center gap-1 mb-1" style={{ color: "#52525b" }}>
                <Clock size={10} /> Hạn plan: {new Date(user.planExpiresAt).toLocaleDateString("vi-VN")}
              </p>
            )}
            <p className="text-[10px]" style={{ color: "#3f3f46" }}>
              Tham gia: {new Date(user.createdAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black" style={{ color: "#facc15" }}>{user.credits?.toLocaleString("vi-VN") ?? 0}</p>
            <p className="text-[10px]" style={{ color: "#52525b" }}>credits</p>
          </div>
        </div>

        {/* Ban reason */}
        {user.isBanned && user.banReason && (
          <div className="mt-4 rounded-xl p-3" style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.12)" }}>
            <p className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "#f87171" }}>
              <Ban size={10} /> Lý do khóa:
            </p>
            <p className="text-xs text-red-300 mt-1">{user.banReason}</p>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <Button size="sm" variant="outline"
            onClick={() => {
              updateMut.mutate({ isBanned: !user.isBanned, banReason: user.isBanned ? null : "Admin action" });
            }}
            disabled={updateMut.isPending}
            className={`text-xs ${user.isBanned ? 'text-green-400 border-green-500/30 hover:bg-green-500/10' : 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10'}`}
          >
            <Ban size={11} className="mr-1" /> {user.isBanned ? "Mở khóa" : "Khóa"}
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "#0f0f11" }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all"
              style={active
                ? { background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.25)" }
                : { color: "#71717a", border: "1px solid transparent" }
              }>
              <Icon size={12} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "info" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Gift credits */}
          <div className="rounded-2xl p-5" style={{ background: "#111113", border: "1px solid #1f1f23" }}>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
              <Gift size={13} className="text-yellow-400" /> Tặng / Trừ credits
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Input type="number" value={giftAmount} onChange={e => setGiftAmount(parseInt(e.target.value) || 0)}
                placeholder="Số credits" className="bg-zinc-900 border-zinc-800 text-white text-sm" />
              <Input value={giftDesc} onChange={e => setGiftDesc(e.target.value)}
                placeholder="Lý do..." className="bg-zinc-900 border-zinc-800 text-white text-sm" />
              <Button
                onClick={() => {
                  if (!giftDesc) return toast.error("Cần nhập lý do");
                  updateMut.mutate({ creditAmount: giftAmount, creditDescription: giftDesc });
                  setGiftAmount(0); setGiftDesc("");
                }}
                disabled={updateMut.isPending || giftAmount === 0}
                style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}
                className="text-white font-bold text-xs"
              >
                {giftAmount > 0 ? `+${giftAmount}` : giftAmount < 0 ? String(giftAmount) : "0"} credits
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {tab === "jobs" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1f1f23" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "#111113", borderBottom: "1px solid #1f1f23" }}>
                  {["Tính năng", "Status", "Credits", "Ngày tạo"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#71717a" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(user.jobs ?? []).map((job: any, i: number) => {
                  const sc = STATUS_COLORS[job.status] ?? { bg: "#27272a", text: "#71717a", label: job.status };
                  return (
                    <tr key={job.id} style={{ background: i % 2 === 0 ? "#0c0c0e" : "#0f0f11", borderBottom: "1px solid #1a1a1d" }}>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-white">{job.featureName}</p>
                        <p className="text-[9px] font-mono" style={{ color: "#3f3f46" }}>{job.id.slice(0, 8)}...</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                          style={{ background: sc.bg, color: sc.text }}>{sc.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold" style={{ color: "#facc15" }}>{job.creditUsed}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: "#71717a" }}>
                          {new Date(job.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!user.jobs || user.jobs.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "#52525b" }}>Chưa có job nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {tab === "transactions" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1f1f23" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "#111113", borderBottom: "1px solid #1f1f23" }}>
                  {["Loại", "Số lượng", "Mô tả", "Thời gian"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#71717a" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(user.creditTransactions ?? []).map((tx: any, i: number) => {
                  const tc = TX_COLORS[tx.type] ?? { text: "#71717a", label: tx.type };
                  return (
                    <tr key={tx.id} style={{ background: i % 2 === 0 ? "#0c0c0e" : "#0f0f11", borderBottom: "1px solid #1a1a1d" }}>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                          style={{ background: `${tc.text}18`, color: tc.text }}>{tc.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-black"
                          style={{ color: tx.amount > 0 ? "#34d399" : "#f87171" }}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: "#a1a1aa" }}>{tx.description}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: "#71717a" }}>
                          {new Date(tx.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!user.creditTransactions || user.creditTransactions.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "#52525b" }}>Chưa có giao dịch nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
