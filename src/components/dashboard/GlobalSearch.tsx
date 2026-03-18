"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, LayoutDashboard, Users, Briefcase, CreditCard,
  Cpu, BarChart3, Settings, BookOpen, ScrollText, X,
  ArrowRight,
} from "lucide-react";

interface SearchItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: typeof Search;
  category: string;
}

const PAGES: SearchItem[] = [
  { id: "overview",  label: "Tổng quan",       href: "/dashboard",          icon: LayoutDashboard, category: "Trang" },
  { id: "jobs",      label: "Quản lý Jobs",    href: "/dashboard/jobs",     icon: Briefcase,       category: "Trang" },
  { id: "credits",   label: "Giao dịch",       href: "/dashboard/credits",  icon: CreditCard,      category: "Trang" },
  { id: "users",     label: "Người dùng",      href: "/dashboard/users",    icon: Users,           category: "Trang" },
  { id: "features",  label: "Tính năng AI",    href: "/dashboard/features", icon: Cpu,             category: "Trang" },
  { id: "blogs",     label: "Quản lý Blog",    href: "/dashboard/blogs",    icon: BookOpen,        category: "Trang" },
  { id: "audit",     label: "Nhật ký",         href: "/dashboard/audit",    icon: ScrollText,      category: "Trang" },
  { id: "stats",     label: "Thống kê",        href: "/dashboard/stats",    icon: BarChart3,       category: "Trang" },
  { id: "settings",  label: "Cài đặt",         href: "/dashboard/settings", icon: Settings,        category: "Trang" },
];

const ACTIONS: SearchItem[] = [
  { id: "add-user",    label: "Thêm user mới",       href: "/dashboard/users",    icon: Users,      category: "Hành động", description: "Mở trang quản lý users" },
  { id: "add-feature", label: "Thêm tính năng AI",   href: "/dashboard/features", icon: Cpu,        category: "Hành động", description: "Mở trang quản lý features" },
  { id: "view-audit",  label: "Xem nhật ký hoạt động", href: "/dashboard/audit",  icon: ScrollText, category: "Hành động", description: "Audit log" },
  { id: "export-data", label: "Export dữ liệu",      href: "/dashboard/users",    icon: CreditCard, category: "Hành động", description: "Export CSV từ trang Users" },
];

const ALL_ITEMS = [...PAGES, ...ACTIONS];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter results
  const filtered = query.trim()
    ? ALL_ITEMS.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      (item.description ?? "").toLowerCase().includes(query.toLowerCase())
    )
    : ALL_ITEMS;

  // Reset selection when results change
  useEffect(() => setSelectedIdx(0), [query]);

  const navigate = useCallback((item: SearchItem) => {
    router.push(item.href);
    setOpen(false);
  }, [router]);

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIdx]) {
      navigate(filtered[selectedIdx]);
    }
  };

  // Group by category
  const grouped = filtered.reduce<Record<string, SearchItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  let flatIdx = 0;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all group w-full"
        style={{ background: "#111113", border: "1px solid #1f1f23", color: "#52525b" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#3f3f46"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1f1f23"; }}
      >
        <Search size={12} />
        <span className="flex-1 text-left">Tìm kiếm...</span>
        <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">⌘K</kbd>
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[520px] max-h-[60vh] rounded-2xl shadow-2xl z-50 overflow-hidden"
              style={{ background: "#111113", border: "1px solid #27272a" }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#1f1f23" }}>
                <Search size={16} style={{ color: "#52525b" }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Tìm trang, hành động..."
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="text-zinc-600 hover:text-white">
                    <X size={14} />
                  </button>
                )}
                <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-600">ESC</kbd>
              </div>

              {/* Results */}
              <div className="overflow-y-auto max-h-[calc(60vh-56px)] py-2">
                {filtered.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm" style={{ color: "#3f3f46" }}>
                    Không tìm thấy kết quả
                  </p>
                ) : (
                  Object.entries(grouped).map(([category, items]) => (
                    <div key={category}>
                      <p className="px-4 pt-2 pb-1 text-[9px] font-bold uppercase" style={{ color: "#3f3f46" }}>
                        {category}
                      </p>
                      {items.map(item => {
                        const thisIdx = flatIdx++;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => navigate(item)}
                            className="flex items-center gap-3 px-4 py-2.5 w-full text-left transition-all"
                            style={{
                              background: thisIdx === selectedIdx ? "rgba(220,38,38,0.08)" : "transparent",
                              color: thisIdx === selectedIdx ? "#fff" : "#a1a1aa",
                            }}
                            onMouseEnter={() => setSelectedIdx(thisIdx)}
                          >
                            <Icon
                              size={14}
                              className="shrink-0"
                              style={{ color: thisIdx === selectedIdx ? "#f87171" : "#52525b" }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.label}</p>
                              {item.description && (
                                <p className="text-[10px] truncate" style={{ color: "#52525b" }}>{item.description}</p>
                              )}
                            </div>
                            {thisIdx === selectedIdx && (
                              <ArrowRight size={12} style={{ color: "#f87171" }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t flex items-center gap-3" style={{ borderColor: "#1f1f23" }}>
                <div className="flex items-center gap-1 text-[9px]" style={{ color: "#3f3f46" }}>
                  <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono">↑↓</kbd> để di chuyển
                </div>
                <div className="flex items-center gap-1 text-[9px]" style={{ color: "#3f3f46" }}>
                  <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono">↵</kbd> để mở
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
