"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard, Users, Briefcase, CreditCard,
  Cpu, BarChart3, Settings, LogOut, ChevronRight, Sparkles
} from "lucide-react";
import { signOut } from "next-auth/react";
import { hasMinRole, ROLE_LABELS, ROLE_COLORS, type UserRole } from "@/lib/roles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",          label: "Tổng quan",       icon: LayoutDashboard, minRole: "USER"  as UserRole },
  { href: "/dashboard/jobs",     label: "Quản lý Jobs",    icon: Briefcase,       minRole: "STAFF" as UserRole },
  { href: "/dashboard/credits",  label: "Giao dịch",       icon: CreditCard,      minRole: "STAFF" as UserRole },
  { href: "/dashboard/users",    label: "Người dùng",      icon: Users,           minRole: "ADMIN" as UserRole },
  { href: "/dashboard/features", label: "Tính năng AI",    icon: Cpu,             minRole: "ADMIN" as UserRole },
  { href: "/dashboard/stats",    label: "Thống kê",        icon: BarChart3,       minRole: "ADMIN" as UserRole },
  { href: "/dashboard/settings", label: "Cài đặt",         icon: Settings,        minRole: "USER"  as UserRole },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role ?? "USER") as UserRole;

  const visibleItems = NAV_ITEMS.filter(item => hasMinRole(role, item.minRole));
  const roleColor    = ROLE_COLORS[role] ?? ROLE_COLORS.USER;

  return (
    <aside className="flex flex-col w-64 min-h-screen border-r"
      style={{ background: "#0c0c0e", borderColor: "#1f1f23" }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b flex items-center gap-3" style={{ borderColor: "#1f1f23" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}>
          <Sparkles size={14} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-black text-white tracking-tight">PixelMind</p>
          <p className="text-[10px]" style={{ color: "#52525b" }}>Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map(item => {
          const Icon    = item.icon;
          const active  = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  active ? "text-white" : "text-zinc-400 hover:text-white"
                )}
                style={active ? { background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.2)" } : {}}
                whileHover={!active ? { x: 2 } : {}}
              >
                <Icon size={16} className={active ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={13} className="text-red-500" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t" style={{ borderColor: "#1f1f23" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1" style={{ background: "#18181b" }}>
          <Avatar className="w-7 h-7">
            <AvatarImage src={session?.user?.image ?? ""} />
            <AvatarFallback className="text-[10px]" style={{ background: "#27272a" }}>
              {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{session?.user?.name ?? "User"}</p>
            <p className="text-[10px] truncate" style={{ color: "#52525b" }}>{session?.user?.email}</p>
          </div>
          <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full", roleColor.bg, roleColor.text)}>
            {ROLE_LABELS[role]}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-sm transition-colors"
          style={{ color: "#71717a" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#71717a"; }}
        >
          <LogOut size={14} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
