"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Copy, RefreshCw, Loader2, ExternalLink,
  Image as ImageIcon, Cpu, Clock, AlertCircle, CheckCircle2,
  Zap, Info,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/services/api";

interface JobDetailData {
  id: string;
  featureName: string;
  featureSlug: string;
  status: string;
  quality: string;
  creditUsed: number;
  outputUrl: string | null;
  errorMsg: string | null;
  promptUsed?: string;
  inputUrls?: string[];
  chainhubTaskId?: string;
  width?: number;
  height?: number;
  orientation?: string;
  createdAt: string;
  user?: { id: string; name: string | null; email: string; image: string | null };
}

const STATUS_CFG: Record<string, { bg: string; text: string; label: string; icon: typeof CheckCircle2 }> = {
  COMPLETED:  { bg: "rgba(52,211,153,0.12)",  text: "#34d399", label: "Hoàn thành", icon: CheckCircle2 },
  PROCESSING: { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa", label: "Đang xử lý", icon: Loader2 },
  QUEUED:     { bg: "rgba(250,204,21,0.12)",  text: "#facc15", label: "Chờ xử lý",  icon: Clock },
  FAILED:     { bg: "rgba(248,113,113,0.12)", text: "#f87171", label: "Thất bại",   icon: AlertCircle },
};

export function JobDetailDialog({
  job,
  open,
  onOpenChange,
}: {
  job: JobDetailData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();

  const retryMut = useMutation({
    mutationFn: async (jobId: string) => {
      const { data } = await api.post(`/admin/jobs/${jobId}/retry`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Đã tạo job mới: ${data.newJobId}`);
      qc.invalidateQueries({ predicate: (q) => ["admin-jobs", "staff-jobs"].includes(q.queryKey[0] as string) });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? e.message),
  });

  if (!job) return null;

  const sc = STATUS_CFG[job.status] ?? STATUS_CFG.QUEUED;
  const StatusIcon = sc.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-black flex items-center gap-2">
            <Info size={14} className="text-violet-400" /> Chi tiết Job
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Status + Feature */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">{job.featureName}</p>
              <p className="text-[10px] font-mono" style={{ color: "#52525b" }}>
                ID: {job.id}
              </p>
            </div>
            <span
              className="flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full"
              style={{ background: sc.bg, color: sc.text }}
            >
              <StatusIcon size={10} className={job.status === "PROCESSING" ? "animate-spin" : ""} />
              {sc.label}
            </span>
          </div>

          {/* User info */}
          {job.user && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: "#0f0f11", border: "1px solid #1f1f23" }}>
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">
                {job.user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{job.user.name ?? "—"}</p>
                <p className="text-[10px]" style={{ color: "#52525b" }}>{job.user.email}</p>
              </div>
            </div>
          )}

          {/* Params */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Chất lượng", value: job.quality?.toUpperCase() ?? "SD", icon: Zap, color: "#facc15" },
              { label: "Credits", value: String(job.creditUsed), icon: Zap, color: "#a78bfa" },
              { label: "Kích thước", value: job.width && job.height ? `${job.width}×${job.height}` : "—", icon: ImageIcon, color: "#60a5fa" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl px-3 py-2" style={{ background: "#0f0f11", border: "1px solid #1f1f23" }}>
                <p className="text-[9px] font-semibold mb-1" style={{ color: "#52525b" }}>{item.label}</p>
                <p className="text-xs font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Prompt */}
          {job.promptUsed && (
            <div className="rounded-xl p-3" style={{ background: "#0f0f11", border: "1px solid #1f1f23" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold" style={{ color: "#71717a" }}>Prompt đã dùng</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(job.promptUsed!); toast.success("Đã copy prompt"); }}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  <Copy size={11} />
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                {job.promptUsed}
              </p>
            </div>
          )}

          {/* Input images */}
          {job.inputUrls && job.inputUrls.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold mb-2" style={{ color: "#71717a" }}>Ảnh đầu vào ({job.inputUrls.length})</p>
              <div className="flex gap-2">
                {job.inputUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="w-20 h-20 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-colors shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Input ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Output image */}
          {job.outputUrl && (
            <div>
              <p className="text-[10px] font-semibold mb-2" style={{ color: "#71717a" }}>Kết quả</p>
              <a href={job.outputUrl} target="_blank" rel="noopener noreferrer"
                className="block w-full rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={job.outputUrl} alt="Output" className="w-full max-h-64 object-contain bg-zinc-900" />
              </a>
            </div>
          )}

          {/* Error message */}
          {job.errorMsg && (
            <div className="rounded-xl p-3" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}>
              <p className="text-[10px] font-semibold mb-1 flex items-center gap-1" style={{ color: "#f87171" }}>
                <AlertCircle size={10} /> Lỗi
              </p>
              <p className="text-[11px] text-red-300">{job.errorMsg}</p>
            </div>
          )}

          {/* ChainHub ID */}
          {job.chainhubTaskId && (
            <p className="text-[9px] font-mono" style={{ color: "#3f3f46" }}>
              ChainHub Task: {job.chainhubTaskId}
            </p>
          )}

          {/* Timestamp */}
          <p className="text-[10px]" style={{ color: "#52525b" }}>
            Tạo lúc: {new Date(job.createdAt).toLocaleString("vi-VN")}
          </p>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-400 hover:text-white text-xs"
              onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            {job.status === "FAILED" && (
              <Button
                className="flex-1 text-white font-bold text-xs"
                onClick={() => retryMut.mutate(job.id)}
                disabled={retryMut.isPending}
                style={{ background: "linear-gradient(135deg,#dc2626,#7c3aed)" }}
              >
                {retryMut.isPending ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <RefreshCw size={13} className="mr-1.5" />}
                Retry Job
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
