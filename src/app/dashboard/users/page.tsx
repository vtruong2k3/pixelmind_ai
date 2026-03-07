"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, Loader2, RefreshCw, Shield, Trash2, CreditCard,
  ChevronLeft, ChevronRight, Filter,
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

const PLAN_COLORS: Record<string, string> = { free: "#71717a", starter: "#60a5fa", pro: "#a78bfa", max: "#facc15" };

export default function DashboardUsersPage() {
  const qc = useQueryClient();

  // ── Zustand: filter persist khi navigate giữa pages ──────────────────────
  const { usersFilter, setUsersFilter } = useDashboardStore();
  const { search, role: roleF, plan: planF, page } = usersFilter;

  const setSearch = (v: string) => setUsersFilter({ search: v, page: 1 });
  const setRoleF  = (v: string) => setUsersFilter({ role: v,   page: 1 });
  const setPlanF  = (v: string) => setUsersFilter({ plan: v,   page: 1 });

  // Local state: chỉ cho edit dialog (ephemeral)
  const [editing,    setEditing]    = useState<AdminUser | null>(null);
  const [newRole,    setNewRole]    = useState("");
  const [giftAmount, setGiftAmount] = useState(0);
  const [giftDesc,   setGiftDesc]   = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", page, search, roleF, planF],
    queryFn:  () => adminService.getUsers({
      page, limit: 20,
      search: search || undefined,
      role:   roleF  || undefined,
      plan:   planF  || undefined,
    }),
    staleTime: 60_000, // 1 phút — navigate về không re-fetch
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => adminService.updateUser(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Đã cập nhật"); setEditing(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Đã xóa user"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (u: AdminUser) => {
    setEditing(u); setNewRole(u.role); setGiftAmount(0); setGiftDesc("");
  };

  const handleSave = () => {
    if (!editing) return;
    const payload: any = {};
    if (newRole !== editing.role) payload.role = newRole;
    if (giftAmount !== 0 && giftDesc) { payload.creditAmount = giftAmount; payload.creditDescription = giftDesc; }
    if (Object.keys(payload).length === 0) return setEditing(null);
    updateMut.mutate({ id: editing.id, payload });
  };

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Quản lý Người dùng</h1>
          <p className="text-sm mt-0.5" style={{ color: "#71717a" }}>{data?.total ?? 0} người dùng</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} style={{ borderColor: "#27272a", color: "#a1a1aa", background: "#18181b" }}>
          <RefreshCw size={13} className="mr-1.5" /> Refresh
        </Button>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#52525b" }} />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên, email..." className="pl-9 h-9 text-sm bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600" />
        </div>
        <Select value={roleF || "all"} onValueChange={v => setRoleF(v === "all" ? "" : v)}>
          <SelectTrigger className="w-36 h-9 text-sm bg-zinc-900 border-zinc-800 text-white">
            <Filter size={12} className="mr-1.5 text-zinc-500" /><SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {["all","USER","STAFF","ADMIN"].map(r => (
              <SelectItem key={r} value={r} className="text-zinc-300">
                {r === "all" ? "Tất cả role" : ROLE_LABELS[r as UserRole]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={planF || "all"} onValueChange={v => setPlanF(v === "all" ? "" : v)}>
          <SelectTrigger className="w-36 h-9 text-sm bg-zinc-900 border-zinc-800 text-white">
            <SelectValue placeholder="Gói" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {["all","free","starter","pro","max"].map(p => (
              <SelectItem key={p} value={p} className="text-zinc-300">
                {p === "all" ? "Tất cả gói" : p.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1f1f23" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "#111113", borderBottom: "1px solid #1f1f23" }}>
              {["Người dùng","Role","Gói","Credits","Jobs","Ngày tham gia",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#71717a" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#0c0c0e" : "#0f0f11" }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded" style={{ background: "#27272a", width: `${40+j*10}%` }} /></td>
                    ))}
                  </tr>
                ))
              : (data?.users ?? []).map((u, i) => {
                  const roleColor = ROLE_COLORS[u.role as UserRole] ?? ROLE_COLORS.USER;
                  return (
                    <tr key={u.id} style={{ background: i % 2 === 0 ? "#0c0c0e" : "#0f0f11", borderBottom: "1px solid #1f1f23" }}
                      className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={u.image ?? ""} />
                            <AvatarFallback className="text-[10px] bg-zinc-800 text-zinc-400">{u.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-semibold text-white">{u.name ?? "—"}</p>
                            <p className="text-[10px]" style={{ color: "#52525b" }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full ${roleColor.bg} ${roleColor.text}`}>
                          {ROLE_LABELS[u.role as UserRole] ?? u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold uppercase" style={{ color: PLAN_COLORS[u.plan] ?? "#71717a" }}>{u.plan}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-black text-white">{u.credits.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-zinc-400">{u._count?.jobs ?? 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: "#71717a" }}>{new Date(u.createdAt).toLocaleDateString("vi-VN")}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(u)}
                            className="h-7 px-2 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800">
                            <Shield size={11} className="mr-1" /> Sửa
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate(u.id)}
                            className="h-7 px-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10">
                            <Trash2 size={11} />
                          </Button>
                        </div>
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
              onClick={() => setUsersFilter({ page: Math.max(1, page - 1) })} disabled={page <= 1}
              style={{ borderColor: "#27272a", background: "#18181b", color: "#a1a1aa" }}>
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
              const p = data.totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
              if (p > data.totalPages) return null;
              return (
                <Button key={p} size="sm" variant="outline"
                  onClick={() => setUsersFilter({ page: p })}
                  style={{
                    borderColor: p === page ? "#dc2626" : "#27272a",
                    background:  p === page ? "rgba(220,38,38,0.15)" : "#18181b",
                    color:       p === page ? "#f87171" : "#a1a1aa",
                    minWidth: 32,
                  }}>
                  {p}
                </Button>
              );
            })}
            <Button size="sm" variant="outline"
              onClick={() => setUsersFilter({ page: Math.min(data.totalPages, page + 1) })} disabled={page >= data.totalPages}
              style={{ borderColor: "#27272a", background: "#18181b", color: "#a1a1aa" }}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={o => { if (!o) setEditing(null); }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-black">Chỉnh sửa: {editing?.name ?? editing?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold mb-1.5 block text-zinc-400">Vai trò</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {(["USER","STAFF","ADMIN"] as UserRole[]).map(r => (
                    <SelectItem key={r} value={r} className="text-zinc-300">{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-zinc-400">Tặng/trừ credits</label>
                <Input type="number" value={giftAmount} onChange={e => setGiftAmount(parseInt(e.target.value)||0)}
                  className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-zinc-400">Lý do</label>
                <Input value={giftDesc} onChange={e => setGiftDesc(e.target.value)}
                  placeholder="vd: Thưởng..." className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => setEditing(null)}>Hủy</Button>
              <Button className="flex-1 text-white font-bold" onClick={handleSave} disabled={updateMut.isPending}
                style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}>
                {updateMut.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
