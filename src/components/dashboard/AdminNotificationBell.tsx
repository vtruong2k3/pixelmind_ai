"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, AlertTriangle, ShoppingBag, UserPlus,
  AlertCircle, ChevronRight, X,
} from "lucide-react";
import api from "@/services/api";

interface NotifData {
  alerts: {
    level: "normal" | "warning" | "critical";
    failedJobsCount: number;
    failedLastHour: number;
    newPurchasesCount: number;
    newUsersCount: number;
    queuedCount: number;
  };
  failedJobs: { id: string; featureName: string; errorMsg: string | null; updatedAt: string; user: { name: string | null; email: string } }[];
  newPurchases: { id: string; amount: number; description: string; createdAt: string; user: { name: string | null; email: string } }[];
  newUsers: { id: string; name: string | null; email: string; plan: string; createdAt: string }[];
}

const LEVEL_COLORS = {
  normal:   { ring: "rgba(52,211,153,0.4)", dot: "#34d399" },
  warning:  { ring: "rgba(250,204,21,0.4)", dot: "#facc15" },
  critical: { ring: "rgba(248,113,113,0.5)", dot: "#f87171" },
};

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"failed" | "purchases" | "users">("failed");
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data } = await api.get<NotifData>("/admin/notifications");
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalCount = (data?.alerts.failedJobsCount ?? 0) + (data?.alerts.newPurchasesCount ?? 0) + (data?.alerts.newUsersCount ?? 0);
  const level = data?.alerts.level ?? "normal";
  const lc = LEVEL_COLORS[level];

  const TABS = [
    { id: "failed" as const, label: "Lỗi", count: data?.alerts.failedJobsCount ?? 0, icon: AlertCircle, color: "#f87171" },
    { id: "purchases" as const, label: "Mua", count: data?.alerts.newPurchasesCount ?? 0, icon: ShoppingBag, color: "#a78bfa" },
    { id: "users" as const, label: "Mới", count: data?.alerts.newUsersCount ?? 0, icon: UserPlus, color: "#34d399" },
  ];

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-zinc-800"
        style={{ background: open ? "#27272a" : "transparent" }}
      >
        <Bell size={16} style={{ color: open ? "#fff" : "#71717a" }} />
        {totalCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1"
            style={{ background: lc.dot, boxShadow: `0 0 8px ${lc.ring}` }}
          >
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-11 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
            style={{ background: "#111113", border: "1px solid #1f1f23" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#1f1f23" }}>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Bell size={12} /> Thông báo
                {level !== "normal" && (
                  <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full"
                    style={{ background: `${lc.dot}20`, color: lc.dot }}>
                    {level === "critical" ? "Nghiêm trọng" : "Cảnh báo"}
                  </span>
                )}
              </span>
              <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Alert banner */}
            {level !== "normal" && (
              <div className="px-4 py-2" style={{ background: `${lc.dot}08`, borderBottom: `1px solid ${lc.dot}15` }}>
                <p className="text-[10px] flex items-center gap-1" style={{ color: lc.dot }}>
                  <AlertTriangle size={10} />
                  {data?.alerts.failedLastHour} jobs lỗi trong 1 giờ qua
                  {(data?.alerts.queuedCount ?? 0) > 0 && ` · ${data?.alerts.queuedCount} đang chờ`}
                </p>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: "#1f1f23" }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-all"
                  style={tab === t.id
                    ? { color: t.color, borderBottom: `2px solid ${t.color}`, background: `${t.color}08` }
                    : { color: "#52525b", borderBottom: "2px solid transparent" }
                  }>
                  <t.icon size={10} /> {t.label}
                  {t.count > 0 && (
                    <span className="ml-0.5 text-[8px] font-black px-1 py-0.5 rounded-full"
                      style={{ background: `${t.color}18`, color: t.color }}>{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="max-h-64 overflow-y-auto">
              {tab === "failed" && (
                (data?.failedJobs ?? []).length === 0
                  ? <EmptyState text="Không có jobs lỗi" />
                  : (data?.failedJobs ?? []).map(j => (
                    <NotifItem key={j.id}
                      title={j.featureName}
                      subtitle={j.user.name ?? j.user.email}
                      detail={j.errorMsg?.slice(0, 60) ?? "Không rõ lỗi"}
                      time={j.updatedAt}
                      color="#f87171"
                    />
                  ))
              )}
              {tab === "purchases" && (
                (data?.newPurchases ?? []).length === 0
                  ? <EmptyState text="Chưa có giao dịch mới" />
                  : (data?.newPurchases ?? []).map(p => (
                    <NotifItem key={p.id}
                      title={p.user.name ?? p.user.email}
                      subtitle={p.description}
                      detail={`+${p.amount} credits`}
                      time={p.createdAt}
                      color="#a78bfa"
                    />
                  ))
              )}
              {tab === "users" && (
                (data?.newUsers ?? []).length === 0
                  ? <EmptyState text="Chưa có user mới" />
                  : (data?.newUsers ?? []).map(u => (
                    <NotifItem key={u.id}
                      title={u.name ?? "Không tên"}
                      subtitle={u.email}
                      detail={u.plan.toUpperCase()}
                      time={u.createdAt}
                      color="#34d399"
                    />
                  ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotifItem({ title, subtitle, detail, time, color }: {
  title: string; subtitle: string; detail: string; time: string; color: string;
}) {
  const ago = getTimeAgo(time);
  return (
    <div className="px-4 py-2.5 hover:bg-zinc-900/50 transition-colors border-b" style={{ borderColor: "#1a1a1d" }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-white truncate max-w-[180px]">{title}</p>
        <span className="text-[9px] shrink-0" style={{ color: "#3f3f46" }}>{ago}</span>
      </div>
      <p className="text-[10px] truncate" style={{ color: "#52525b" }}>{subtitle}</p>
      <p className="text-[10px] font-semibold mt-0.5" style={{ color }}>{detail}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="px-4 py-8 text-center text-xs" style={{ color: "#3f3f46" }}>{text}</p>;
}

function getTimeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins}p`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
