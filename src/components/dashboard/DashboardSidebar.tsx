"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, Users, Briefcase, CreditCard,
  Cpu, BarChart3, Settings, LogOut, ChevronRight, Sparkles, BookOpen,
  ScrollText, PanelLeftClose, PanelLeft,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { hasMinRole, ROLE_LABELS, ROLE_COLORS, type UserRole } from "@/lib/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AdminNotificationBell } from "./AdminNotificationBell";
import { GlobalSearch } from "./GlobalSearch";
import { useDashboardStore } from "@/store/dashboardStore";

const NAV_ITEMS = [
  { href: "/dashboard",          label: "Tổng quan",       icon: LayoutDashboard, minRole: "USER"  as UserRole },
  { href: "/dashboard/jobs",     label: "Quản lý Jobs",    icon: Briefcase,       minRole: "STAFF" as UserRole },
  { href: "/dashboard/credits",  label: "Giao dịch",       icon: CreditCard,      minRole: "STAFF" as UserRole },
  { href: "/dashboard/users",    label: "Người dùng",      icon: Users,           minRole: "ADMIN" as UserRole },
  { href: "/dashboard/features", label: "Tính năng AI",    icon: Cpu,             minRole: "ADMIN" as UserRole },
  { href: "/dashboard/blogs",    label: "Quản lý Blog",    icon: BookOpen,        minRole: "ADMIN" as UserRole },
  { href: "/dashboard/audit",    label: "Nhật ký",         icon: ScrollText,      minRole: "ADMIN" as UserRole },
  { href: "/dashboard/stats",    label: "Thống kê",        icon: BarChart3,       minRole: "ADMIN" as UserRole },
  { href: "/dashboard/settings", label: "Cài đặt",         icon: Settings,        minRole: "USER"  as UserRole },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role ?? "USER") as UserRole;
  const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useDashboardStore();

  const visibleItems = NAV_ITEMS.filter(item => hasMinRole(role, item.minRole));
  const roleColor    = ROLE_COLORS[role] ?? ROLE_COLORS.USER;

  return (
    <aside
      className="flex flex-col min-h-screen border-r shrink-0 transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? 72 : 256,
        background: "#0c0c0e",
        borderColor: "#1f1f23",
      }}
    >
      {/* Logo + Toggle */}
      <div className="px-3 py-4 border-b flex items-center gap-2" style={{ borderColor: "#1f1f23" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}>
          <Sparkles size={14} className="text-white" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 min-w-0"
          >
            <p className="text-sm font-black text-white tracking-tight">PixelMind</p>
            <p className="text-[10px]" style={{ color: "#52525b" }}>Dashboard</p>
          </motion.div>
        )}
        {!collapsed && hasMinRole(role, "STAFF") && <AdminNotificationBell />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-zinc-800 shrink-0"
          title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          style={{ color: "#71717a" }}
        >
          {collapsed ? <PanelLeft size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <GlobalSearch />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "relative flex items-center rounded-xl transition-all group",
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                  active ? "text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                )}
                style={active ? { background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)" } : {}}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={16} className={cn("shrink-0", active ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
                    {active && <ChevronRight size={13} className="text-red-500" />}
                  </>
                )}
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50"
                    style={{ background: "#27272a", border: "1px solid #3f3f46" }}>
                    {item.label}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-2 border-t" style={{ borderColor: "#1f1f23" }}>
        <div className={cn("flex items-center rounded-xl mb-1", collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2.5")} style={{ background: "#18181b" }}>
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarImage src={session?.user?.image ?? ""} />
            <AvatarFallback className="text-[10px]" style={{ background: "#27272a" }}>
              {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{session?.user?.name ?? "User"}</p>
              <p className="text-[10px] truncate" style={{ color: "#52525b" }}>{session?.user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full", roleColor.bg, roleColor.text)}>
              {ROLE_LABELS[role]}
            </span>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/dashboard/login" })}
          className={cn("flex items-center rounded-xl w-full text-sm transition-colors", collapsed ? "justify-center px-0 py-2" : "gap-2.5 px-3 py-2")}
          style={{ color: "#71717a" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#71717a"; }}
          title={collapsed ? "Đăng xuất" : undefined}
        >
          <LogOut size={14} />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
