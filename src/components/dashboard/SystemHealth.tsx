"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity, Database, Cloud, Cpu, AlertCircle,
  CheckCircle2, Clock, Loader2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

interface HealthData {
  services: {
    service: string;
    status: "ok" | "error";
    latencyMs: number;
    detail?: string;
  }[];
  queue: {
    queued: number;
    processing: number;
    failedLast24h: number;
  };
  checkedAt: string;
}

const SERVICE_ICONS: Record<string, typeof Database> = {
  "PostgreSQL": Database,
  "ChainHub AI": Cpu,
  "R2 Storage": Cloud,
};

export function SystemHealth() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-health"],
    queryFn: async () => {
      const { data } = await api.get<HealthData>("/admin/health");
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000, // Auto-refresh every 60s
  });

  const allOk = data?.services.every(s => s.status === "ok");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl p-5"
      style={{ background: "#111113", border: "1px solid #1f1f23" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={15} style={{ color: allOk ? "#34d399" : "#f87171" }} />
          <h3 className="text-sm font-bold text-white">Trạng thái hệ thống</h3>
          {data && (
            <span
              className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
              style={{
                background: allOk ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                color: allOk ? "#34d399" : "#f87171",
              }}
            >
              {allOk ? "Hoạt động" : "Có lỗi"}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-7 px-2 text-zinc-500 hover:text-white"
        >
          <RefreshCw size={11} className={isFetching ? "animate-spin" : ""} />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={18} className="animate-spin text-zinc-600" />
        </div>
      ) : data ? (
        <div className="space-y-3">
          {/* Services */}
          <div className="grid grid-cols-3 gap-2">
            {data.services.map((s) => {
              const Icon = SERVICE_ICONS[s.service] ?? Activity;
              const isOk = s.status === "ok";
              return (
                <div
                  key={s.service}
                  className="rounded-xl px-3 py-2.5 transition-all"
                  style={{
                    background: isOk ? "rgba(52,211,153,0.05)" : "rgba(248,113,113,0.08)",
                    border: `1px solid ${isOk ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.2)"}`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {isOk
                      ? <CheckCircle2 size={10} style={{ color: "#34d399" }} />
                      : <AlertCircle size={10} style={{ color: "#f87171" }} />}
                    <span className="text-[10px] font-semibold text-white">{s.service}</span>
                  </div>
                  <p className="text-[9px]" style={{ color: isOk ? "#52525b" : "#f87171" }}>
                    {isOk ? `${s.latencyMs}ms` : s.detail ?? "Error"}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Queue stats */}
          <div className="flex items-center gap-4 pt-2 border-t" style={{ borderColor: "#1f1f23" }}>
            <div className="flex items-center gap-1.5">
              <Clock size={10} style={{ color: "#facc15" }} />
              <span className="text-[10px]" style={{ color: "#a1a1aa" }}>
                Chờ xử lý: <span className="font-bold text-white">{data.queue.queued}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Loader2 size={10} style={{ color: "#60a5fa" }} />
              <span className="text-[10px]" style={{ color: "#a1a1aa" }}>
                Đang xử lý: <span className="font-bold text-white">{data.queue.processing}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertCircle size={10} style={{ color: "#f87171" }} />
              <span className="text-[10px]" style={{ color: "#a1a1aa" }}>
                Lỗi 24h: <span className="font-bold" style={{ color: data.queue.failedLast24h > 0 ? "#f87171" : "#71717a" }}>
                  {data.queue.failedLast24h}
                </span>
              </span>
            </div>
          </div>

          {/* Last checked */}
          <p className="text-[9px] text-right" style={{ color: "#3f3f46" }}>
            Cập nhật: {new Date(data.checkedAt).toLocaleTimeString("vi-VN")}
          </p>
        </div>
      ) : null}
    </motion.div>
  );
}
