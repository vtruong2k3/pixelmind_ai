"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Search, Loader2, RefreshCw, ChevronLeft, ChevronRight, Filter, Zap } from "lucide-react";
import { adminService } from "@/services/adminService";
import { staffService } from "@/services/staffService";
import { hasMinRole, type UserRole } from "@/lib/roles";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { CreditCard, TrendingDown, TrendingUp, Gift } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";

const TYPE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  spend:    { bg: "rgba(248,113,113,0.12)", text: "#f87171", label: "Chi tiêu" },
  purchase: { bg: "rgba(167,139,250,0.12)", text: "#a78bfa", label: "Mua"     },
  earn:     { bg: "rgba(52,211,153,0.12)",  text: "#34d399", label: "Nhận"    },
  bonus:    { bg: "rgba(250,204,21,0.12)",  text: "#facc15", label: "Bonus"   },
};

export default function DashboardCreditsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const role    = ((session?.user as any)?.role ?? "USER") as UserRole;
  const isAdmin = hasMinRole(role, "ADMIN");
  const isStaff = hasMinRole(role, "STAFF");
  const qc      = useQueryClient();

  // ── Zustand: filter persist khi navigate giữa pages ──────────────────────
  const { creditsFilter, setCreditsFilter } = useDashboardStore();
  const { type: typeF, search, page } = creditsFilter;

  const setTypeF  = (v: string) => setCreditsFilter({ type: v,   page: 1 });
  const setSearch = (v: string) => setCreditsFilter({ search: v, page: 1 });

  // ── Local state: modal/gift form (chỉ sống trong session này) ─────────────
  const [modal,     setModal]     = useState(false);
  const [gUserQ,    setGUserQ]    = useState("");
  const [gUsers,    setGUsers]    = useState<any[]>([]);
  const [gUser,     setGUser]     = useState<any | null>(null);
  const [gAmount,   setGAmount]   = useState(100);
  const [gDesc,     setGDesc]     = useState("");
  const [searching, setSearching] = useState(false);

  // ── React Query: list giao dịch ───────────────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-credits", page, typeF, search],
    queryFn:  () => adminService.getTransactions({ page, type: typeF, search, limit: 20 }),
    staleTime: 60_000, // 1 phút — navigate về trang không re-fetch
    enabled: sessionStatus !== "loading" && isAdmin,
  });

  const giftMut = useMutation({
    mutationFn: () => isAdmin
      ? adminService.giftCredits(gUser.id, gAmount, gDesc)
      : staffService.giftCredits({ userId: gUser.id, amount: gAmount, description: gDesc }),
    onSuccess: (r) => {
      toast.success(`Đã tặng ${gAmount} credits cho ${r.user.name ?? r.user.email}`);
      qc.invalidateQueries({ queryKey: ["admin-credits"] });
      setModal(false); setGUser(null); setGUserQ(""); setGAmount(100); setGDesc("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const searchUsers = async (q: string) => {
    setGUserQ(q);
    if (q.length < 2) { setGUsers([]); return; }
    setSearching(true);
    try { setGUsers(await adminService.searchUsers(q)); }
    finally { setSearching(false); }
  };

  const summary = data?.summary;

  if (sessionStatus === "loading") {
    return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-red-500" size={28} /></div>;
  }
  if (!isStaff) {
    return <div className="flex items-center justify-center h-96"><p className="text-zinc-500 text-sm">Bạn không có quyền truy cập.</p></div>;
  }

  return (
    <div className="p-8 max-w-[1400px]">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Giao dịch Credits</h1>
          <p className="text-sm mt-0.5" style={{ color: "#71717a" }}>{data?.total ?? 0} giao dịch</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()} style={{ borderColor: "#27272a", color: "#a1a1aa", background: "#18181b" }}>
            <RefreshCw size={13} className="mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setModal(true)}
            style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)", color: "#fff" }}>
            <Gift size={13} className="mr-1.5" /> Tặng credits
          </Button>
        </div>
      </motion.div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard label="Tổng mua"   value={summary.totalPurchased} icon={CreditCard}  iconColor="#a78bfa" iconBg="rgba(167,139,250,0.1)" delay={0} />
          <StatCard label="Tổng chi"   value={summary.totalSpent}    icon={TrendingDown} iconColor="#f87171" iconBg="rgba(248,113,113,0.1)" delay={0.05} />
          <StatCard label="Tổng nhận"  value={summary.totalEarned}   icon={TrendingUp}   iconColor="#34d399" iconBg="rgba(52,211,153,0.1)"  delay={0.1} />
          <StatCard label="Tổng bonus" value={summary.totalBonus}    icon={Zap}          iconColor="#facc15" iconBg="rgba(250,204,21,0.1)"  delay={0.15} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#52525b" }} />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo user..." className="pl-9 h-9 text-sm bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600" />
        </div>
        <Select value={typeF || "all"} onValueChange={v => setTypeF(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40 h-9 text-sm bg-zinc-900 border-zinc-800 text-white">
            <Filter size={12} className="mr-1.5 text-zinc-500" /><SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all" className="text-zinc-300">Tất cả</SelectItem>
            {Object.entries(TYPE_STYLE).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-zinc-300">{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1f1f23" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "#111113", borderBottom: "1px solid #1f1f23" }}>
              {["User","Loại","Số lượng","Mô tả","Thời gian"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#71717a" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#0c0c0e" : "#0f0f11" }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded" style={{ background: "#27272a", width: `${40+j*8}%` }} /></td>
                    ))}
                  </tr>
                ))
              : (data?.transactions ?? []).map((tx: any, i: number) => {
                  const ts = TYPE_STYLE[tx.type] ?? { bg: "#27272a", text: "#71717a", label: tx.type };
                  return (
                    <tr key={tx.id} style={{ background: i % 2 === 0 ? "#0c0c0e" : "#0f0f11", borderBottom: "1px solid #1f1f23" }}
                      className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={tx.user?.image ?? ""} />
                            <AvatarFallback className="text-[9px] bg-zinc-800">{tx.user?.name?.[0] ?? "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-semibold text-white">{tx.user?.name ?? "—"}</p>
                            <p className="text-[10px]" style={{ color: "#52525b" }}>{tx.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full"
                          style={{ background: ts.bg, color: ts.text }}>{ts.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-black" style={{ color: tx.amount > 0 ? "#34d399" : "#f87171" }}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
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
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: "#71717a" }}>
            Trang <span className="text-white font-bold">{data.page}</span>/{data.totalPages}
            &nbsp;·&nbsp;<span className="text-white font-bold">{data.total.toLocaleString("vi-VN")}</span> kết quả
          </p>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline"
              onClick={() => setCreditsFilter({ page: Math.max(1, page - 1) })} disabled={page <= 1}
              style={{ borderColor: "#27272a", background: "#18181b", color: "#a1a1aa" }}>
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
              const p = data.totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
              if (p > data.totalPages) return null;
              return (
                <Button key={p} size="sm" variant="outline"
                  onClick={() => setCreditsFilter({ page: p })}
                  style={{
                    borderColor: p === page ? "#dc2626" : "#27272a",
                    background: p === page ? "rgba(220,38,38,0.15)" : "#18181b",
                    color: p === page ? "#f87171" : "#a1a1aa",
                    minWidth: 32,
                  }}>
                  {p}
                </Button>
              );
            })}
            <Button size="sm" variant="outline"
              onClick={() => setCreditsFilter({ page: Math.min(data.totalPages, page + 1) })} disabled={page >= data.totalPages}
              style={{ borderColor: "#27272a", background: "#18181b", color: "#a1a1aa" }}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Gift Credits Modal */}
      <Dialog open={modal} onOpenChange={o => { if (!o) setModal(false); }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-black">Tặng Credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold mb-1.5 block text-zinc-400">Tìm user</label>
              <div className="relative">
                <Input value={gUser ? `${gUser.name ?? ""} (${gUser.email})` : gUserQ}
                  onChange={e => { setGUser(null); searchUsers(e.target.value); }}
                  placeholder="Nhập tên hoặc email..." className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600" />
                {searching && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-500" />}
              </div>
              {gUsers.length > 0 && !gUser && (
                <div className="mt-1 rounded-lg border border-zinc-800 overflow-hidden">
                  {gUsers.map(u => (
                    <button key={u.id} onClick={() => { setGUser(u); setGUsers([]); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-zinc-800 transition-colors">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={u.image ?? ""} />
                        <AvatarFallback className="text-[9px] bg-zinc-700">{u.name?.[0] ?? "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-semibold text-white">{u.name ?? "—"}</p>
                        <p className="text-[10px]" style={{ color: "#52525b" }}>{u.email}</p>
                      </div>
                      <span className="ml-auto text-xs font-bold" style={{ color: "#facc15" }}>{u.credits} cr</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-zinc-400">
                  Số credits {!isAdmin && <span style={{ color: "#52525b" }}>(max 500)</span>}
                </label>
                <Input type="number" value={gAmount} onChange={e => setGAmount(parseInt(e.target.value)||0)}
                  max={isAdmin ? undefined : 500} className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-zinc-400">Lý do</label>
                <Input value={gDesc} onChange={e => setGDesc(e.target.value)}
                  placeholder="vd: Thưởng..." className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-400" onClick={() => setModal(false)}>Hủy</Button>
              <Button className="flex-1 text-white font-bold" disabled={!gUser || !gDesc || giftMut.isPending}
                onClick={() => giftMut.mutate()}
                style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}>
                {giftMut.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Zap size={14} className="mr-1.5" />}
                Tặng ngay
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
