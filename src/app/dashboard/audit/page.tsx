"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ScrollText, Search, Loader2, ChevronLeft, ChevronRight,
  Filter, Shield, Ban, Trash2, Gift, Zap, Pencil, Eye,
  UserCog, BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/services/api";

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  ban_user:       { label: "Khóa user",       color: "#f87171", icon: Ban },
  unban_user:     { label: "Mở khóa user",    color: "#34d399", icon: Ban },
  delete_user:    { label: "Xóa user",         color: "#ef4444", icon: Trash2 },
  update_role:    { label: "Đổi role",         color: "#60a5fa", icon: Shield },
  gift_credits:   { label: "Tặng credits",     color: "#facc15", icon: Gift },
  delete_job:     { label: "Xóa job",           color: "#f87171", icon: Trash2 },
  retry_job:      { label: "Retry job",         color: "#60a5fa", icon: Zap },
  toggle_feature: { label: "Toggle feature",    color: "#a78bfa", icon: Zap },
  create_feature: { label: "Tạo feature",       color: "#34d399", icon: Zap },
  delete_feature: { label: "Xóa feature",       color: "#f87171", icon: Trash2 },
  update_feature: { label: "Sửa feature",       color: "#facc15", icon: Pencil },
  publish_blog:   { label: "Publish blog",      color: "#34d399", icon: BookOpen },
  delete_blog:    { label: "Xóa blog",           color: "#f87171", icon: Trash2 },
  update_user:    { label: "Cập nhật user",     color: "#60a5fa", icon: UserCog },
};

interface AuditEntry {
  id: string;
  action: string;
  actorId: string;
  actorEmail: string;
  targetType: string;
  targetId: string | null;
  targetLabel: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit", { page, action, search }],
    queryFn: async () => {
      const params: any = { page, limit: 30 };
      if (action !== "all") params.action = action;
      if (search) params.search = search;
      const { data } = await api.get("/admin/audit", { params });
      return data as { logs: AuditEntry[]; total: number; page: number; totalPages: number };
    },
    staleTime: 15_000,
  });

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-black text-white flex items-center gap-2 mb-1">
          <ScrollText size={18} className="text-violet-400" /> Nhật ký hoạt động
        </h1>
        <p className="text-xs mb-6" style={{ color: "#52525b" }}>
          Theo dõi mọi hành động quản trị — {data?.total ?? 0} bản ghi
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#52525b" }} />
          <Input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo email, tên..."
            className="pl-9 bg-zinc-900/50 border-zinc-800 text-white text-sm h-9"
          />
        </div>
        <Select value={action} onValueChange={v => { setAction(v); setPage(1); }}>
          <SelectTrigger className="w-44 bg-zinc-900/50 border-zinc-800 text-white text-sm h-9">
            <Filter size={12} className="mr-1.5 text-zinc-500" />
            <SelectValue placeholder="Tất cả hành động" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all" className="text-zinc-300 text-sm">Tất cả</SelectItem>
            {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key} className="text-zinc-300 text-sm">
                {cfg.label}
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
              {["Hành động", "Người thực hiện", "Đối tượng", "Chi tiết", "Thời gian"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#71717a" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12">
                <Loader2 className="animate-spin mx-auto text-red-500" size={20} />
              </td></tr>
            ) : (data?.logs ?? []).length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-sm" style={{ color: "#3f3f46" }}>
                Chưa có nhật ký nào
              </td></tr>
            ) : (data?.logs ?? []).map((log, i) => {
              const cfg = ACTION_CONFIG[log.action] ?? { label: log.action, color: "#71717a", icon: Eye };
              const Icon = cfg.icon;
              return (
                <tr key={log.id} style={{ background: i % 2 === 0 ? "#0c0c0e" : "#0f0f11", borderBottom: "1px solid #1a1a1d" }}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded-full w-fit"
                      style={{ background: `${cfg.color}15`, color: cfg.color }}>
                      <Icon size={10} /> {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-white">{log.actorEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{log.targetType}</span>
                      {log.targetLabel && (
                        <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[160px]">{log.targetLabel}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {log.details ? (
                      <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                        {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(", ")}
                      </p>
                    ) : (
                      <span className="text-[10px] text-zinc-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs" style={{ color: "#71717a" }}>
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="h-7 px-2 text-zinc-500 hover:text-white">
            <ChevronLeft size={13} />
          </Button>
          <span className="text-xs" style={{ color: "#71717a" }}>
            {page} / {data.totalPages}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
            className="h-7 px-2 text-zinc-500 hover:text-white">
            <ChevronRight size={13} />
          </Button>
        </div>
      )}
    </div>
  );
}
