"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Users, ImageIcon,
  Zap, LogOut, BarChart2, Settings,
  Shield, Home, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { group: "Dashboard", items: [
    { label: "Tổng quan",     href: "/admin",          icon: LayoutDashboard },
    { label: "Thống kê sâu",  href: "/admin/stats",    icon: BarChart2 },
  ]},
  { group: "Quản lý", items: [
    { label: "Người dùng",    href: "/admin/users",    icon: Users },
    { label: "Jobs / Images", href: "/admin/jobs",     icon: ImageIcon },
    { label: "Giao dịch",     href: "/admin/credits",  icon: Zap },
  ]},
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <aside
      className="w-60 min-h-screen flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto"
      style={{ background: "#0a0a0b", borderRight: "1px solid #1f1f23" }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid #1f1f23" }}>
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }}>
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-tight">Admin Panel</p>
            <p className="text-[9px] uppercase tracking-widest" style={{ color: "#52525b" }}>PixelMind AI</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 flex-1 space-y-4">
        {NAV.map(group => (
          <div key={group.group}>
            <p className="text-[9px] font-bold uppercase tracking-widest px-2 mb-1.5" style={{ color: "#3f3f46" }}>
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "text-white font-bold"
                        : "hover:text-white transition-colors"
                    )}
                    style={isActive
                      ? { background: "rgba(220,38,38,0.15)", color: "#fff" }
                      : { color: "#71717a" }
                    }
                  >
                    <item.icon size={15} style={{ color: isActive ? "#f87171" : "#52525b" }} />
                    {item.label}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#ef4444" }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ borderTop: "1px solid #1f1f23" }} className="pt-4">
          <p className="text-[9px] font-bold uppercase tracking-widest px-2 mb-1.5" style={{ color: "#3f3f46" }}>
            Khác
          </p>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: "#71717a" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#71717a")}
          >
            <Home size={15} style={{ color: "#52525b" }} />
            Trang chính
          </Link>
        </div>
      </nav>

      {/* Admin info + Logout */}
      <div className="px-3 pb-5" style={{ borderTop: "1px solid #1f1f23" }}>
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-3 mb-2">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name ?? ""} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }}>
                {(user.name ?? "A")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name ?? "Admin"}</p>
              <p className="text-[10px] truncate" style={{ color: "#52525b" }}>{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ color: "#71717a" }}
          onMouseEnter={e => {
            e.currentTarget.style.color = "#f87171";
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "#71717a";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut size={15} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
