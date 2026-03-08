"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Loader2, RefreshCw, Shield, Trash2,
  ChevronLeft, ChevronRight, Filter, ChevronsLeft, ChevronsRight,
  Crown, ArrowUpDown, ArrowUp, ArrowDown, CalendarDays, X,
  AlertTriangle, Gift, UserCog, Package, ChevronDown,
} from "lucide-react";
import { adminService, type AdminUser } from "@/services/adminService";
import { ROLE_LABELS, ROLE_COLORS, type UserRole } from "@/lib/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useDashboardStore } from "@/store/dashboardStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  free:    { label: "FREE",    color: "#71717a", bg: "rgba(113,113,122,0.12)", border: "rgba(113,113,122,0.25)", icon: "⚪" },
  starter: { label: "STARTER", color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.25)",  icon: "🔵" },
  pro:     { label: "PRO",     color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)", icon: "💜" },
  max:     { label: "MAX",     color: "#facc15", bg: "rgba(250,204,21,0.12)",  border: "rgba(250,204,21,0.25)",  icon: "👑" },
};

const PLAN_LIST = ["free", "starter", "pro", "max"] as const;

// ─── Helper Functions ──────────────────────────────────────────────────────────

function getPlanStatus(plan: string, planExpiresAt: string | null): "active" | "expired" | "free" {
  if (plan === "free") return "free";
  if (!planExpiresAt) return "active"; // paid plan without expiry
  return new Date(planExpiresAt) > new Date() ? "active" : "expired";
}

function getDaysLeft(planExpiresAt: string | null): number | null {
  if (!planExpiresAt) return null;
  const diff = new Date(planExpiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function toInputDate(isoString: string | null): string {
  if (!isoString) return "";
  return isoString.slice(0, 10); // "YYYY-MM-DD"
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlanBadge({ plan, planExpiresAt }: { plan: string; planExpiresAt: string | null }) {
  const cfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
  const status = getPlanStatus(plan, planExpiresAt);
  const daysLeft = getDaysLeft(planExpiresAt);

  return (
    <div className="space-y-0.5">
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
        style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        {cfg.icon} {cfg.label}
      </span>
      {plan !== "free" && planExpiresAt && (
        <p className="text-[9px] pl-0.5" style={{ color: status === "expired" ? "#f87171" : status === "active" && daysLeft! <= 7 ? "#fb923c" : "#52525b" }}>
          {status === "expired"
            ? "⚠ Đã hết hạn"
            : daysLeft! <= 0
            ? "Hết hạn hôm nay"
            : `còn ${daysLeft} ngày`}
        </p>
      )}
    </div>
  );
}

function SortIcon({ field, sortBy, order }: { field: string; sortBy: string; order: string }) {
  if (sortBy !== field) return <ArrowUpDown size={11} className="opacity-30" />;
  return order === "asc" ? <ArrowUp size={11} className="text-red-400" /> : <ArrowDown size={11} className="text-red-400" />;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type SortField = "createdAt" | "credits" | "jobs";

export default function DashboardUsersPage() {
  const qc = useQueryClient();

  const { usersFilter, setUsersFilter } = useDashboardStore();
  const { search, role: roleF, plan: planF, page } = usersFilter;

  // Sort state (local — không cần persist)
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Dialog states
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editTab, setEditTab] = useState<"info" | "plan">("info");
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  // Tab "Thông tin" state
  const [newRole, setNewRole]       = useState("");
  const [giftAmount, setGiftAmount] = useState(0);
  const [giftDesc, setGiftDesc]     = useState("");

  // Tab "Gói" state
  const [newPlan, setNewPlan]           = useState("");
  const [newExpiry, setNewExpiry]       = useState("");

  const setSearch = (v: string) => setUsersFilter({ search: v, page: 1 });
  const setRoleF  = (v: string) => setUsersFilter({ role: v,   page: 1 });
  const setPlanF  = (v: string) => setUsersFilter({ plan: v,   page: 1 });

  function handleSort(field: SortField) {
    if (sortBy === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("desc"); }
  }

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", page, search, roleF, planF, sortBy, sortOrder],
    queryFn:  () => adminService.getUsers({
      page, limit: 20,
      search:  search  || undefined,
      role:    roleF   || undefined,
      plan:    planF   || undefined,
      order:   sortOrder,
    }),
    staleTime: 60_000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof adminService.updateUser>[1] }) =>
      adminService.updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Đã cập nhật thành công");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Đã xóa người dùng");
      setConfirmDelete(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Dialog handlers ───────────────────────────────────────────────────────
  function openEdit(u: AdminUser) {
    setEditing(u);
    setEditTab("info");
    setNewRole(u.role);
    setGiftAmount(0);
    setGiftDesc("");
    setNewPlan(u.plan);
    setNewExpiry(toInputDate(u.planExpiresAt));
  }

  function handleSaveInfo() {
    if (!editing) return;
    const payload: Parameters<typeof adminService.updateUser>[1] = {};
    if (newRole !== editing.role) payload.role = newRole;
    if (giftAmount !== 0 && giftDesc) {
      payload.creditAmount      = giftAmount;
      payload.creditDescription = giftDesc;
    }
    if (Object.keys(payload).length === 0) return setEditing(null);
    updateMut.mutate({ id: editing.id, payload });
  }

  function handleSavePlan() {
    if (!editing) return;
    const payload: Parameters<typeof adminService.updateUser>[1] = {};
    if (newPlan !== editing.plan) payload.plan = newPlan;

    // Calculate planExpiresAt
    if (newPlan === "free") {
      payload.planExpiresAt = null;
    } else if (newExpiry) {
      // Set to end of the chosen day in Vietnam timezone (UTC+7)
      const d = new Date(newExpiry + "T23:59:59+07:00");
      payload.planExpiresAt = d.toISOString();
    }

    if (Object.keys(payload).length === 0) return setEditing(null);
    updateMut.mutate({ id: editing.id, payload });
  }

  // ── Sorted data (for client-side sort by jobs count) ─────────────────────
  const users = useMemo(() => {
    if (!data?.users) return [];
    if (sortBy === "jobs") {
      return [...data.users].sort((a, b) => {
        const va = a._count?.jobs ?? 0;
        const vb = b._count?.jobs ?? 0;
        return sortOrder === "asc" ? va - vb : vb - va;
      });
    }
    return data.users; // createdAt and credits order handled by API
  }, [data?.users, sortBy, sortOrder]);

  // ── Pagination helpers ────────────────────────────────────────────────────
  const totalPages = data?.totalPages ?? 1;
  const pageStart  = data ? (data.page - 1) * 20 + 1 : 0;
  const pageEnd    = data ? Math.min(data.page * 20, data.total) : 0;

  const pageNumbers = useMemo(() => {
    if (!data) return [];
    const total = data.totalPages;
    const cur   = data.page;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(cur - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i);
  }, [data]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-[1440px]">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Quản lý Người dùng</h1>
          <p className="text-sm mt-0.5" style={{ color: "#71717a" }}>
            {isLoading ? "Đang tải..." : `${data?.total?.toLocaleString("vi-VN") ?? 0} người dùng`}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}
          style={{ borderColor: "#27272a", color: "#a1a1aa", background: "#18181b" }}>
          <RefreshCw size={13} className="mr-1.5" /> Refresh
        </Button>
      </motion.div>

      {/* ── Plan summary bar ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-4 gap-3 mb-5">
        {PLAN_LIST.map(p => {
          const cfg = PLAN_CONFIG[p];
          return (
            <button key={p} onClick={() => setPlanF(planF === p ? "" : p)}
              className="rounded-xl px-4 py-3 text-left transition-all cursor-pointer"
              style={{
                background: planF === p ? cfg.bg : "#0f0f11",
                border: `1px solid ${planF === p ? cfg.border : "#1f1f23"}`,
              }}>
              <p className="text-[10px] font-bold uppercase" style={{ color: cfg.color }}>{cfg.icon} {cfg.label}</p>
              <p className="text-xs font-black text-white mt-0.5">
                {isLoading ? "—" : "Click để lọc"}
              </p>
            </button>
          );
        })}
      </motion.div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#52525b" }} />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên, email..." className="pl-9 h-9 text-sm bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={13} />
            </button>
          )}
        </div>
        <Select value={roleF || "all"} onValueChange={v => setRoleF(v === "all" ? "" : v)}>
          <SelectTrigger className="w-36 h-9 text-sm bg-zinc-900 border-zinc-800 text-white">
            <Filter size={12} className="mr-1.5 text-zinc-500" /><SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {["all", "USER", "STAFF", "ADMIN"].map(r => (
              <SelectItem key={r} value={r} className="text-zinc-300">
                {r === "all" ? "Tất cả role" : ROLE_LABELS[r as UserRole]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={planF || "all"} onValueChange={v => setPlanF(v === "all" ? "" : v)}>
          <SelectTrigger className="w-36 h-9 text-sm bg-zinc-900 border-zinc-800 text-white">
            <Crown size={12} className="mr-1.5 text-zinc-500" /><SelectValue placeholder="Gói" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {["all", ...PLAN_LIST].map(p => (
              <SelectItem key={p} value={p} className="text-zinc-300">
                {p === "all" ? "Tất cả gói" : PLAN_CONFIG[p]?.label ?? p.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || roleF || planF) && (
          <Button size="sm" variant="ghost" onClick={() => { setSearch(""); setRoleF(""); setPlanF(""); }}
            className="h-9 text-xs text-zinc-500 hover:text-white">
            <X size={12} className="mr-1" /> Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1f1f23" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "#111113", borderBottom: "1px solid #1f1f23" }}>
              {/* Người dùng */}
              <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#71717a" }}>
                Người dùng
              </th>
              {/* Role */}
              <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#71717a" }}>
                Role
              </th>
              {/* Gói */}
              <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#71717a" }}>
                Gói
              </th>
              {/* Credits — sortable */}
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("credits")}
                  className="flex items-center gap-1 text-xs font-semibold hover:text-white transition-colors"
                  style={{ color: sortBy === "credits" ? "#f4f4f5" : "#71717a" }}
                >
                  Credits <SortIcon field="credits" sortBy={sortBy} order={sortOrder} />
                </button>
              </th>
              {/* Jobs — sortable */}
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("jobs")}
                  className="flex items-center gap-1 text-xs font-semibold hover:text-white transition-colors"
                  style={{ color: sortBy === "jobs" ? "#f4f4f5" : "#71717a" }}
                >
                  Jobs <SortIcon field="jobs" sortBy={sortBy} order={sortOrder} />
                </button>
              </th>
              {/* Ngày tham gia — sortable */}
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-1 text-xs font-semibold hover:text-white transition-colors"
                  style={{ color: sortBy === "createdAt" ? "#f4f4f5" : "#71717a" }}
                >
                  Tham gia <SortIcon field="createdAt" sortBy={sortBy} order={sortOrder} />
                </button>
              </th>
              {/* Actions */}
              <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#71717a" }} />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#0c0c0e" : "#0f0f11" }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 rounded animate-pulse" style={{ background: "#1f1f23", width: `${45 + j * 8}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              : users.map((u, i) => {
                  const roleColor = ROLE_COLORS[u.role as UserRole] ?? ROLE_COLORS.USER;
                  const planStatus = getPlanStatus(u.plan, u.planExpiresAt);
                  return (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      style={{
                        background: i % 2 === 0 ? "#0c0c0e" : "#0f0f11",
                        borderBottom: "1px solid #1a1a1d",
                      }}
                      className="hover:bg-zinc-900/60 transition-colors"
                    >
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarImage src={u.image ?? ""} />
                            <AvatarFallback className="text-[11px] bg-zinc-800 text-zinc-400">
                              {u.name?.[0]?.toUpperCase() ?? "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate max-w-[160px]">{u.name ?? "—"}</p>
                            <p className="text-[10px] truncate max-w-[160px]" style={{ color: "#52525b" }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full ${roleColor.bg} ${roleColor.text}`}>
                          {ROLE_LABELS[u.role as UserRole] ?? u.role}
                        </span>
                      </td>
                      {/* Plan */}
                      <td className="px-4 py-3">
                        <PlanBadge plan={u.plan} planExpiresAt={u.planExpiresAt} />
                        {planStatus === "expired" && (
                          <span className="text-[8px] text-red-400/70 font-medium">HẾT HẠN</span>
                        )}
                      </td>
                      {/* Credits */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-black text-white">{u.credits.toLocaleString("vi-VN")}</span>
                        <span className="text-[9px] ml-1" style={{ color: "#52525b" }}>cr</span>
                      </td>
                      {/* Jobs */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-zinc-400">{(u._count?.jobs ?? 0).toLocaleString("vi-VN")}</span>
                      </td>
                      {/* Joined */}
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: "#71717a" }}>
                          {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(u)}
                            className="h-7 px-2.5 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800">
                            <UserCog size={11} className="mr-1" /> Sửa
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(u)}
                            className="h-7 px-2 text-red-500/60 hover:text-red-400 hover:bg-red-500/10">
                            <Trash2 size={11} />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "#52525b" }}>
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {data && data.totalPages > 0 && (
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <p className="text-xs" style={{ color: "#71717a" }}>
            Hiển thị{" "}
            <span className="text-white font-bold">{pageStart.toLocaleString("vi-VN")}</span>
            {" – "}
            <span className="text-white font-bold">{pageEnd.toLocaleString("vi-VN")}</span>
            {" của "}
            <span className="text-white font-bold">{data.total.toLocaleString("vi-VN")}</span>
            {" kết quả · Trang "}
            <span className="text-white font-bold">{data.page}</span>
            {" / "}
            <span className="text-white font-bold">{data.totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            {/* First */}
            <Button size="sm" variant="outline" onClick={() => setUsersFilter({ page: 1 })} disabled={page <= 1}
              style={{ borderColor: "#27272a", background: "#18181b", color: "#a1a1aa" }} className="h-8 w-8 p-0">
              <ChevronsLeft size={13} />
            </Button>
            {/* Prev */}
            <Button size="sm" variant="outline" onClick={() => setUsersFilter({ page: Math.max(1, page - 1) })} disabled={page <= 1}
              style={{ borderColor: "#27272a", background: "#18181b", color: "#a1a1aa" }} className="h-8 w-8 p-0">
              <ChevronLeft size={13} />
            </Button>

            {/* Page numbers */}
            {pageNumbers[0] > 1 && (
              <>
                <Button size="sm" variant="outline" onClick={() => setUsersFilter({ page: 1 })}
                  style={{ borderColor: "#27272a", background: "#18181b", color: "#a1a1aa", minWidth: 32 }} className="h-8 text-xs">1</Button>
                {pageNumbers[0] > 2 && <span className="text-zinc-600 text-xs px-0.5">…</span>}
              </>
            )}
            {pageNumbers.map(p => (
              <Button key={p} size="sm" variant="outline" onClick={() => setUsersFilter({ page: p })}
                style={{
                  borderColor: p === page ? "#dc2626" : "#27272a",
                  background:  p === page ? "rgba(220,38,38,0.15)" : "#18181b",
                  color:       p === page ? "#f87171" : "#a1a1aa",
                  minWidth: 32,
                }} className="h-8 text-xs font-semibold">
                {p}
              </Button>
            ))}
            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="text-zinc-600 text-xs px-0.5">…</span>}
                <Button size="sm" variant="outline" onClick={() => setUsersFilter({ page: totalPages })}
                  style={{ borderColor: "#27272a", background: "#18181b", color: "#a1a1aa", minWidth: 32 }} className="h-8 text-xs">{totalPages}</Button>
              </>
            )}

            {/* Next */}
            <Button size="sm" variant="outline" onClick={() => setUsersFilter({ page: Math.min(totalPages, page + 1) })} disabled={page >= totalPages}
              style={{ borderColor: "#27272a", background: "#18181b", color: "#a1a1aa" }} className="h-8 w-8 p-0">
              <ChevronRight size={13} />
            </Button>
            {/* Last */}
            <Button size="sm" variant="outline" onClick={() => setUsersFilter({ page: totalPages })} disabled={page >= totalPages}
              style={{ borderColor: "#27272a", background: "#18181b", color: "#a1a1aa" }} className="h-8 w-8 p-0">
              <ChevronsRight size={13} />
            </Button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          EDIT DIALOG
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!editing} onOpenChange={o => { if (!o) setEditing(null); }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-black">
              Chỉnh sửa: {editing?.name ?? editing?.email}
            </DialogTitle>
            {editing && (
              <p className="text-[10px] mt-0.5" style={{ color: "#52525b" }}>
                ID: {editing.id}
              </p>
            )}
          </DialogHeader>

          {editing && (
            <>
              {/* ── Mini user card ─── */}
              <div className="flex items-center gap-3 p-3 rounded-xl mb-1" style={{ background: "#0f0f11", border: "1px solid #1f1f23" }}>
                <Avatar className="w-9 h-9">
                  <AvatarImage src={editing.image ?? ""} />
                  <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">{editing.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{editing.name ?? "Không có tên"}</p>
                  <p className="text-[10px]" style={{ color: "#52525b" }}>{editing.email}</p>
                </div>
                <div className="text-right">
                  <PlanBadge plan={editing.plan} planExpiresAt={editing.planExpiresAt} />
                </div>
              </div>

              {/* ── Tabs ─── */}
              <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ background: "#0f0f11" }}>
                {([
                  { id: "info", label: "Thông tin", icon: UserCog },
                  { id: "plan", label: "Gói nâng cấp", icon: Package },
                ] as const).map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setEditTab(tab.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={editTab === tab.id
                        ? { background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.25)" }
                        : { color: "#71717a", border: "1px solid transparent" }
                      }
                    >
                      <Icon size={12} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {/* ── Tab: Thông tin ─────────────────────────────────── */}
                {editTab === "info" && (
                  <motion.div key="info"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                    className="space-y-4">
                    {/* Role */}
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block text-zinc-400">
                        <Shield size={11} className="inline mr-1" />Vai trò
                      </label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {(["USER", "STAFF", "ADMIN"] as UserRole[]).map(r => (
                            <SelectItem key={r} value={r} className="text-zinc-300">{ROLE_LABELS[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Credits gift */}
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block text-zinc-400">
                        <Gift size={11} className="inline mr-1" />Tặng / Trừ credits
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Input type="number" value={giftAmount} onChange={e => setGiftAmount(parseInt(e.target.value) || 0)}
                            placeholder="0 (dương/âm)" className="bg-zinc-900 border-zinc-800 text-white text-sm h-9" />
                          <p className="text-[9px] mt-1" style={{ color: "#52525b" }}>
                            {giftAmount > 0 ? `➕ +${giftAmount}` : giftAmount < 0 ? `➖ ${giftAmount}` : "Giữ nguyên"}
                            {" – Sau: "}
                            <span className="text-white font-bold">{(editing.credits + giftAmount).toLocaleString("vi-VN")}</span>
                          </p>
                        </div>
                        <Input value={giftDesc} onChange={e => setGiftDesc(e.target.value)}
                          placeholder="Lý do..." className="bg-zinc-900 border-zinc-800 text-white text-sm h-9" />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs"
                        onClick={() => setEditing(null)}>Hủy</Button>
                      <Button className="flex-1 text-white font-bold text-xs" onClick={handleSaveInfo} disabled={updateMut.isPending}
                        style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}>
                        {updateMut.isPending ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null}
                        Lưu thay đổi
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ── Tab: Gói nâng cấp ─────────────────────────────── */}
                {editTab === "plan" && (
                  <motion.div key="plan"
                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                    className="space-y-4">
                    {/* Plan picker */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block text-zinc-400">
                        <Crown size={11} className="inline mr-1" />Chọn gói
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {PLAN_LIST.map(p => {
                          const cfg = PLAN_CONFIG[p];
                          const selected = newPlan === p;
                          return (
                            <button key={p} onClick={() => {
                              setNewPlan(p);
                              if (p === "free") setNewExpiry("");
                              else if (!newExpiry) setNewExpiry(addDays(30));
                            }}
                              className="py-3 rounded-xl text-xs font-bold transition-all"
                              style={{
                                color: cfg.color,
                                background: selected ? cfg.bg : "#0f0f11",
                                border: `1px solid ${selected ? cfg.border : "#27272a"}`,
                              }}>
                              <div className="text-lg mb-1">{cfg.icon}</div>
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Expiry date */}
                    {newPlan !== "free" && (
                      <div>
                        <label className="text-xs font-semibold mb-1.5 block text-zinc-400">
                          <CalendarDays size={11} className="inline mr-1" />Ngày hết hạn
                        </label>
                        <input
                          type="date"
                          value={newExpiry}
                          min={new Date().toISOString().slice(0, 10)}
                          onChange={e => setNewExpiry(e.target.value)}
                          className="w-full rounded-lg px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 text-white"
                          style={{ colorScheme: "dark" }}
                        />
                        {/* Quick presets */}
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {[
                            { label: "7 ngày",  days: 7  },
                            { label: "30 ngày", days: 30 },
                            { label: "90 ngày", days: 90 },
                            { label: "1 năm",   days: 365 },
                          ].map(preset => (
                            <button key={preset.days} onClick={() => setNewExpiry(addDays(preset.days))}
                              className="text-[10px] px-2 py-1 rounded-lg transition-colors"
                              style={{ background: "#18181b", border: "1px solid #27272a", color: "#71717a" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#e4e4e7"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#71717a"; }}>
                              +{preset.label}
                            </button>
                          ))}
                          {editing.planExpiresAt && new Date(editing.planExpiresAt) > new Date() && (
                            <button onClick={() => {
                              const current = new Date(editing.planExpiresAt!);
                              const extended = new Date(current);
                              extended.setDate(extended.getDate() + 30);
                              setNewExpiry(extended.toISOString().slice(0, 10));
                            }}
                              className="text-[10px] px-2 py-1 rounded-lg transition-colors"
                              style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa" }}>
                              +30 ngày từ hiện tại
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reset to free */}
                    {editing.plan !== "free" && (
                      <button
                        onClick={() => { setNewPlan("free"); setNewExpiry(""); }}
                        className="w-full text-xs py-2 rounded-xl transition-colors"
                        style={{ background: "#18181b", border: "1px solid #27272a", color: "#52525b" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#52525b"; }}
                      >
                        <X size={11} className="inline mr-1" /> Reset về Free
                      </button>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs"
                        onClick={() => setEditing(null)}>Hủy</Button>
                      <Button className="flex-1 text-white font-bold text-xs" onClick={handleSavePlan} disabled={updateMut.isPending}
                        style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}>
                        {updateMut.isPending ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null}
                        Lưu gói
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          CONFIRM DELETE DIALOG
      ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!confirmDelete} onOpenChange={o => { if (!o) setConfirmDelete(null); }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-black flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-400" /> Xác nhận xóa
            </DialogTitle>
          </DialogHeader>
          {confirmDelete && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#0f0f11", border: "1px solid #1f1f23" }}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={confirmDelete.image ?? ""} />
                  <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">{confirmDelete.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-semibold text-white">{confirmDelete.name ?? "—"}</p>
                  <p className="text-[10px]" style={{ color: "#52525b" }}>{confirmDelete.email}</p>
                </div>
              </div>
              <p className="text-xs" style={{ color: "#71717a" }}>
                Hành động này sẽ xóa vĩnh viễn người dùng cùng toàn bộ dữ liệu liên quan.{" "}
                <span className="text-red-400 font-semibold">Không thể hoàn tác.</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-400 hover:text-white text-xs"
                  onClick={() => setConfirmDelete(null)}>Hủy</Button>
                <Button className="flex-1 text-white font-bold text-xs bg-red-600 hover:bg-red-500"
                  onClick={() => deleteMut.mutate(confirmDelete.id)} disabled={deleteMut.isPending}>
                  {deleteMut.isPending ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Trash2 size={12} className="mr-1.5" />}
                  Xóa vĩnh viễn
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
