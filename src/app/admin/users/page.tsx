"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search, ChevronLeft, ChevronRight, Edit3,
  Trash2, Loader2, X, Check, Users
} from "lucide-react";
import { adminService, type AdminUser } from "@/services/adminService";

const PLANS = ["all", "free", "starter", "pro", "max"];
const PLAN_COLORS: Record<string, string> = {
  free: "#64748b", starter: "#06b6d4", pro: "#a855f7", max: "#f59e0b",
};

function UserEditModal({ user, onClose, onSaved }: {
  user: AdminUser;
  onClose: () => void;
  onSaved: (u: AdminUser) => void;
}) {
  const [credits, setCredits] = useState(user.credits);
  const [plan, setPlan] = useState(user.plan);
  const [planExpiresAt, setPlanExpiresAt] = useState(
    user.planExpiresAt ? new Date(user.planExpiresAt).toISOString().slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminService.updateUser(user.id, {
        credits: Number(credits),
        plan,
        planExpiresAt: planExpiresAt || null,
      });
      onSaved(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl w-full max-w-md p-6"
        style={{ background: "#18181b", border: "1px solid #27272a" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-black text-white">Sửa thông tin người dùng</h2>
          <button onClick={onClose}><X size={18} style={{ color: "#71717a" }} /></button>
        </div>
        {/* User info */}
        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ background: "#0a0a0b" }}>
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white"
              style={{ background: "linear-gradient(135deg,#6d28d9,#4f46e5)" }}>
              {(user.name ?? user.email)[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-white">{user.name ?? "—"}</p>
            <p className="text-xs" style={{ color: "#52525b" }}>{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#a1a1aa" }}>Credits</label>
            <input
              type="number"
              value={credits}
              onChange={e => setCredits(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{ background: "#0a0a0b", border: "1px solid #27272a" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#a1a1aa" }}>Gói</label>
            <div className="grid grid-cols-4 gap-2">
              {["free", "starter", "pro", "max"].map(p => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className="py-2 rounded-xl text-xs font-bold capitalize transition-all"
                  style={plan === p
                    ? { background: PLAN_COLORS[p], color: "#fff" }
                    : { background: "#0a0a0b", color: "#52525b", border: "1px solid #27272a" }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {plan !== "free" && (
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#a1a1aa" }}>Ngày hết hạn gói</label>
              <input
                type="date"
                value={planExpiresAt}
                onChange={e => setPlanExpiresAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: "#0a0a0b", border: "1px solid #27272a", colorScheme: "dark" }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "#27272a", color: "#a1a1aa" }}
          >
            Hủy
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
            style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers({ page, limit: 20, search, plan, sort, order });
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, plan, sort, order]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa user này?")) return;
    setDeletingId(id);
    try {
      await adminService.deleteUser(id);
      fetchUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (field: string) => {
    if (sort === field) setOrder(o => o === "asc" ? "desc" : "asc");
    else { setSort(field); setOrder("desc"); }
    setPage(1);
  };

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users size={22} style={{ color: "#ef4444" }} /> Quản lý người dùng
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#71717a" }}>
            {total.toLocaleString()} người dùng trong hệ thống
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#52525b" }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm email, tên..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: "#18181b", border: "1px solid #27272a" }}
          />
        </div>
        {/* Plan filter */}
        <div className="flex gap-1">
          {PLANS.map(p => (
            <button
              key={p}
              onClick={() => { setPlan(p); setPage(1); }}
              className="px-3 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all"
              style={plan === p
                ? { background: PLAN_COLORS[p] ?? "#ef4444", color: "#fff" }
                : { background: "#18181b", color: "#71717a", border: "1px solid #27272a" }}
            >
              {p === "all" ? "Tất cả" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #27272a" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "#18181b", borderBottom: "1px solid #27272a" }}>
                {[
                  { label: "Người dùng", field: "name" },
                  { label: "Gói", field: null },
                  { label: "Credits", field: "credits" },
                  { label: "Jobs", field: null },
                  { label: "Ngày tham gia", field: "createdAt" },
                  { label: "Hành động", field: null },
                ].map(col => (
                  <th
                    key={col.label}
                    className="text-left px-5 py-3.5 font-semibold select-none"
                    style={{ color: "#52525b", cursor: col.field ? "pointer" : "default" }}
                    onClick={() => col.field && handleSort(col.field)}
                  >
                    {col.label}
                    {col.field === sort && <span className="ml-1">{order === "desc" ? "↓" : "↑"}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <Loader2 size={24} className="animate-spin mx-auto" style={{ color: "#ef4444" }} />
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: "#52525b" }}>
                  Không tìm thấy người dùng nào
                </td></tr>
              ) : users.map(u => (
                <tr
                  key={u.id}
                  style={{ borderBottom: "1px solid #1f1f23", background: "#0a0a0b" }}
                  className="hover:bg-[#18181b] transition-colors"
                >
                  {/* User */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                          style={{ background: "linear-gradient(135deg,#6d28d9,#4f46e5)" }}>
                          {(u.name ?? u.email)[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate max-w-[160px]">{u.name ?? "—"}</p>
                        <p className="truncate max-w-[160px]" style={{ color: "#52525b" }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Plan */}
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                      style={{ background: (PLAN_COLORS[u.plan] ?? "#64748b") + "22", color: PLAN_COLORS[u.plan] ?? "#64748b" }}>
                      {u.plan}
                    </span>
                    {u.planExpiresAt && (
                      <p className="text-[9px] mt-0.5" style={{ color: "#52525b" }}>
                        HH: {new Date(u.planExpiresAt).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                  </td>
                  {/* Credits */}
                  <td className="px-5 py-3.5 font-black" style={{ color: "#facc15" }}>
                    {u.credits.toLocaleString()}
                  </td>
                  {/* Jobs */}
                  <td className="px-5 py-3.5 text-white">{u._count?.jobs ?? 0}</td>
                  {/* Join date */}
                  <td className="px-5 py-3.5" style={{ color: "#71717a" }}>
                    {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditUser(u)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: "rgba(109,40,217,0.15)", color: "#a78bfa" }}
                        title="Sửa"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingId === u.id}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}
                        title="Xóa"
                      >
                        {deletingId === u.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #1f1f23", background: "#0a0a0b" }}>
          <p className="text-xs" style={{ color: "#52525b" }}>
            Trang {page}/{totalPages} · {total.toLocaleString()} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg disabled:opacity-30 transition-colors"
              style={{ background: "#18181b", color: "#a1a1aa" }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg disabled:opacity-30 transition-colors"
              style={{ background: "#18181b", color: "#a1a1aa" }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <UserEditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={updated => {
            setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
            setEditUser(null);
          }}
        />
      )}
    </div>
  );
}
