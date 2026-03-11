"use client";
// src/components/layout/NotificationBell.tsx
// Notification bell icon shown in Navbar for logged-in users.
// Polls /api/notifications every 5 seconds when the tab is visible.
// Shows a badge with unread count and a dropdown with recent job completions.

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, XCircle, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  status: "COMPLETED" | "FAILED";
  outputUrl: string | null;
  updatedAt: string;
  feature: { name: string; slug: string };
}

const POLL_INTERVAL = 5000; // 5 giây

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const lastSeenRef = useRef<string>(
    typeof window !== "undefined"
      ? localStorage.getItem("notif_last_seen") ?? new Date(0).toISOString()
      : new Date(0).toISOString()
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getToastedIds = () => {
    try {
      if (typeof window === "undefined") return new Set<string>();
      const stored = localStorage.getItem("notif_toasted_ids");
      if (stored) return new Set<string>(JSON.parse(stored));
    } catch {}
    return new Set<string>();
  };

  const saveToastedIds = (ids: Set<string>) => {
    try {
      // Giữ lại 50 ID gần nhất để tránh phình to localStorage
      const arr = Array.from(ids).slice(-50);
      localStorage.setItem("notif_toasted_ids", JSON.stringify(arr));
    } catch {}
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const { notifications: data } = (await res.json()) as { notifications: Notification[] };

      const storedStr = localStorage.getItem("notif_toasted_ids");
      const toasted = getToastedIds();

      if (!storedStr) {
        // Lần đầu mở app: im lặng lưu các ID hiện tại để không spam toast cũ
        data.forEach((n) => toasted.add(n.id));
        saveToastedIds(toasted);
      } else {
        let hasNew = false;
        
        const newlyDone = data.filter((n) => !toasted.has(n.id) && n.status === "COMPLETED");
        const newlyFailed = data.filter((n) => !toasted.has(n.id) && n.status === "FAILED");

        if (newlyDone.length > 0) {
          newlyDone.forEach((n) => {
            toast.success(`✅ Ảnh "${n.feature.name}" đã hoàn thành!`, {
              action: { label: "Xem", onClick: () => window.location.href = "/history" },
            });
            toasted.add(n.id);
          });
          hasNew = true;
        }

        if (newlyFailed.length > 0) {
          newlyFailed.forEach((n) => {
            toast.error(`Ảnh "${n.feature.name}" thất bại`);
            toasted.add(n.id);
          });
          hasNew = true;
        }

        if (hasNew) saveToastedIds(toasted);
      }

      setNotifications(data);

      // Tính unread = số job sau lastSeen
      const lastSeen = lastSeenRef.current;
      const unreadCount = data.filter((n) => n.updatedAt > lastSeen).length;
      setUnread(unreadCount);
    } catch {
      // silent fail — notification polling không critical
    }
  }, []);

  // Poll khi tab visible
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      if (!document.hidden) fetchNotifications();
    }, POLL_INTERVAL);

    const onVisible = () => { if (!document.hidden) fetchNotifications(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchNotifications]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    setOpen((o) => !o);
    // Mark tất cả đã đọc
    const now = new Date().toISOString();
    lastSeenRef.current = now;
    localStorage.setItem("notif_last_seen", now);
    setUnread(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell size={16} className="text-gray-500" />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-black text-white px-1"
            style={{ background: "#ef4444" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ background: "#fff", border: "1px solid #f0f0f0" }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900">Thông báo</p>
            <span className="text-[10px] text-gray-400">24 giờ qua</span>
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-gray-300">
              <Bell size={28} />
              <p className="text-xs">Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  {/* Thumbnail */}
                  <div
                    className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                    style={{ background: "#f4f4f5" }}
                  >
                    {n.outputUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.outputUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={16} className="text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{n.feature.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(n.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      {" · "}
                      {new Date(n.updatedAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>

                  {/* Status icon */}
                  {n.status === "COMPLETED" ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-red-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-50">
            <Link
              href="/history"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold flex items-center justify-center gap-1"
              style={{ color: "#7c3aed" }}
            >
              Xem toàn bộ lịch sử →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
