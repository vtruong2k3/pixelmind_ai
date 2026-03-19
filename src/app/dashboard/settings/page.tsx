"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader2, User, Mail, Camera, Save, CreditCard, Clock } from "lucide-react";
import { userService } from "@/services/userService";
import { QueryProvider } from "@/components/dashboard/QueryProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS, ROLE_COLORS, type UserRole } from "@/lib/roles";
import { toast } from "sonner";

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  free:    { bg: "rgba(113,113,122,0.15)", text: "#71717a" },
  starter: { bg: "rgba(96,165,250,0.15)",  text: "#60a5fa" },
  pro:     { bg: "rgba(167,139,250,0.15)", text: "#a78bfa" },
  max:     { bg: "rgba(250,204,21,0.15)",  text: "#facc15" },
};

const TYPE_COLORS: Record<string, string> = {
  spend: "#f87171", purchase: "#a78bfa", earn: "#34d399", bonus: "#facc15",
};

function SettingsInner() {
  const qc = useQueryClient();
  const { data: session, update } = useSession();
  const role = (session?.user?.role ?? "USER") as UserRole;
  const roleColor = ROLE_COLORS[role] ?? ROLE_COLORS.USER;
  const planInfo  = PLAN_COLORS[session?.user?.plan ?? "free"] ?? PLAN_COLORS.free;

  const [name, setName] = useState(session?.user?.name ?? "");

  const { data: creditData, isLoading: creditLoading } = useQuery({
    queryKey: ["user-credits"],
    queryFn:  () => userService.getCreditHistory({ limit: 10 }),
  });

  const updateMut = useMutation({
    mutationFn: () => userService.updateProfile({ name }),
    onSuccess: async () => {
      await update({ name });
      qc.invalidateQueries({ queryKey: ["user-dashboard"] });
      toast.success("Đã cập nhật thông tin");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-black text-white">Cài đặt tài khoản</h1>
        <p className="text-sm mt-0.5" style={{ color: "#71717a" }}>Quản lý thông tin cá nhân của bạn</p>
      </motion.div>

      {/* Profile Card */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: "#111113", border: "1px solid #1f1f23" }}>
        <h2 className="text-sm font-bold text-white mb-5">Thông tin cá nhân</h2>
        <div className="flex items-start gap-5 mb-5">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={session?.user?.image ?? ""} />
              <AvatarFallback className="text-lg font-black" style={{ background: "#27272a", color: "#a1a1aa" }}>
                {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1">
            <div className="flex gap-3 mb-1">
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${roleColor.bg} ${roleColor.text}`}>
                {ROLE_LABELS[role]}
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full"
                style={{ background: planInfo.bg, color: planInfo.text }}>
                {(session?.user?.plan ?? "free").toUpperCase()}
              </span>
            </div>
            <p className="text-xs" style={{ color: "#52525b" }}>{session?.user?.email}</p>
            {session?.user?.planExpiresAt && (
              <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: "#52525b" }}>
                <Clock size={10} /> Hết hạn: {new Date(session.user.planExpiresAt).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-black" style={{ color: "#facc15" }}>{session?.user?.credits ?? 0}</p>
            <p className="text-[10px]" style={{ color: "#52525b" }}>credits</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#a1a1aa" }}>Tên hiển thị</label>
            <div className="flex gap-2">
              <Input value={name} onChange={e => setName(e.target.value)}
                className="flex-1 bg-zinc-900 border-zinc-800 text-white" />
              <Button size="sm" onClick={() => updateMut.mutate()} disabled={updateMut.isPending || name === session?.user?.name}
                style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)", color: "#fff" }}>
                {updateMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#a1a1aa" }}>Email</label>
            <Input value={session?.user?.email ?? ""} disabled className="bg-zinc-900 border-zinc-800 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Credit History */}
      <div className="rounded-2xl p-6" style={{ background: "#111113", border: "1px solid #1f1f23" }}>
        <h2 className="text-sm font-bold text-white mb-4">Lịch sử giao dịch credits</h2>
        {creditLoading
          ? <div className="flex justify-center py-6"><Loader2 className="animate-spin" size={20} style={{ color: "#71717a" }} /></div>
          : (
            <div className="space-y-2.5">
              {(creditData?.transactions ?? []).map(tx => (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: (TYPE_COLORS[tx.type] ?? "#71717a") + "20" }}>
                    <CreditCard size={13} style={{ color: TYPE_COLORS[tx.type] ?? "#71717a" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{tx.description}</p>
                    <p className="text-[10px]" style={{ color: "#52525b" }}>
                      {new Date(tx.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <span className="text-sm font-black" style={{ color: tx.amount > 0 ? "#34d399" : "#f87171" }}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                </div>
              ))}
              {!creditData?.transactions?.length && (
                <p className="text-xs text-center py-4" style={{ color: "#52525b" }}>Chưa có giao dịch</p>
              )}
            </div>
          )
        }
      </div>
    </div>
  );
}

export default function DashboardSettingsPage() {
  return <SettingsInner />;
}
