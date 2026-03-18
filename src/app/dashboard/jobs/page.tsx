"use client";

import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Search, Loader2, RefreshCw, Trash2, ChevronLeft, ChevronRight, Filter, Image as ImageIcon, AlertTriangle, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminService } from "@/services/adminService";
import { staffService } from "@/services/staffService";
import { JobDetailDialog } from "@/components/dashboard/jobs/JobDetailDialog";

import { hasMinRole, type UserRole } from "@/lib/roles";
import { StatCard } from "@/components/dashboard/StatCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, CheckCircle2, Clock, AlertCircle, Loader } from "lucide-react";
import { toast } from "sonner";
import { useDashboardStore } from "@/store/dashboardStore";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  COMPLETED:  { bg: "rgba(52,211,153,0.12)",  text: "#34d399", label: "Hoàn thành" },
  PROCESSING: { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa", label: "Đang xử lý" },
  QUEUED:     { bg: "rgba(250,204,21,0.12)",  text: "#facc15", label: "Chờ xử lý" },
  FAILED:     { bg: "rgba(248,113,113,0.12)", text: "#f87171", label: "Thất bại"   },
};

export default function DashboardJobsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const role    = ((session?.user as any)?.role ?? "USER") as UserRole;
  const isAdmin = hasMinRole(role, "ADMIN");
  const isStaff = hasMinRole(role, "STAFF");
  const qc      = useQueryClient();

  const [confirmDeleteJob, setConfirmDeleteJob] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // ── Zustand filter state (persist filter khi navigate giữa pages) ──
  const { jobsFilter, setJobsFilter } = useDashboardStore();
  const { status, quality, search, page } = jobsFilter;

  const setStatus  = (v: string) => setJobsFilter({ status: v,  page: 1 });
  const setQuality = (v: string) => setJobsFilter({ quality: v, page: 1 });
  const setSearch  = (v: string) => setJobsFilter({ search: v,  page: 1 });
  const setPage    = (fn: (p: number) => number) => setJobsFilter({ page: fn(page) });

  const params = { page, search, status, quality, limit: 20 };

  const { data, isLoading, refetch } = useQuery({
    queryKey: [isAdmin ? "admin-jobs" : "staff-jobs", params],
    queryFn:   isAdmin ? () => adminService.getJobs(params) : () => staffService.getJobs(params),
    // staleTime 1 phút — khi navigate về trang này trong 1 phút không re-fetch
    staleTime: 60_000,
    enabled: sessionStatus !== "loading" && isStaff,
  });

  const deleteMut = useMutation({
    mutationFn: (jobId: string) => adminService.deleteJob(jobId),

    // Xóa khỏi cache NGAY LẬP TỨC (không chờ server)
    onMutate: async (jobId: string) => {
      const predicate = (q: any) => ["admin-jobs", "staff-jobs"].includes(q.queryKey[0]);
      await qc.cancelQueries({ predicate });
      qc.setQueriesData<any>({ predicate }, (old: any) => {
        if (!old?.jobs) return old;
        return { ...old, jobs: old.jobs.filter((j: any) => j.id !== jobId), total: (old.total ?? 1) - 1 };
      });
    },

    onSuccess: () => {
      // Sync lại từ server sau khi API hoàn thành
      qc.invalidateQueries({ predicate: (q) => ["admin-jobs", "staff-jobs"].includes(q.queryKey[0] as string) });
      toast.success("Đã xóa job");
      setConfirmDeleteJob(null);
    },

    // Nếu API lỗi → rollback bằng cách fetch lại từ server
    onError: (e: any) => {
      qc.invalidateQueries({ predicate: (q) => ["admin-jobs", "staff-jobs"].includes(q.queryKey[0] as string) });
      toast.error(e.message ?? "Xóa thất bại");
      setConfirmDeleteJob(null);
    },
  });

  const syncMut = useMutation({
    mutationFn: () => adminService.syncJobs(50),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
      qc.invalidateQueries({ queryKey: ["staff-jobs"] });
      toast.success(`${res.message} — ${res.stats.completed} xong, ${res.stats.failed} thất bại, ${res.stats.queued} cập nhật status`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusMap = data?.statusSummary ?? {};

  // Chờ session load hoặc kiểm tra quyền
  if (sessionStatus === "loading") {
    return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-red-500" size={28} /></div>;
  }
  if (!isStaff) {
    return <div className="flex items-center justify-center h-96"><p className="text-zinc-500 text-sm">Bạn không có quyền truy cập.</p></div>;
  }

  return (
    <div className="p-8 max-w-[1400px]">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Quản lý Jobs</h1>
          <p className="text-sm mt-0.5" style={{ color: "#71717a" }}>{data?.total ?? 0} jobs tổng cộng</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={() => syncMut.mutate()} disabled={syncMut.isPending}
              title="Đồng bộ status từ ChainHub vào DB"
              style={{ borderColor: "#facc1540", color: "#facc15", background: "#18181b" }}>
              {syncMut.isPending ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <RefreshCw size={13} className="mr-1.5" />}
              Sync Status
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => refetch()} style={{ borderColor: "#27272a", color: "#a1a1aa", background: "#18181b" }}>
            <RefreshCw size={13} className="mr-1.5" /> Refresh
          </Button>
        </div>
      </motion.div>

      {/* Status summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Hoàn thành" value={statusMap["COMPLETED"] ?? 0}  icon={CheckCircle2} iconColor="#34d399" iconBg="rgba(52,211,153,0.1)"  delay={0} />
        <StatCard label="Đang xử lý" value={statusMap["PROCESSING"] ?? 0} icon={Loader}        iconColor="#60a5fa" iconBg="rgba(96,165,250,0.1)"  delay={0.05} />
        <StatCard label="Chờ xử lý"  value={statusMap["QUEUED"] ?? 0}     icon={Clock}         iconColor="#facc15" iconBg="rgba(250,204,21,0.1)"  delay={0.1} />
        <StatCard label="Thất bại"   value={statusMap["FAILED"] ?? 0}     icon={AlertCircle}   iconColor="#f87171" iconBg="rgba(248,113,113,0.1)" delay={0.15} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#52525b" }} />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo user..." className="pl-9 h-9 text-sm bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600" />
        </div>
        <Select value={status || "all"} onValueChange={v => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40 h-9 text-sm bg-zinc-900 border-zinc-800 text-white">
            <Filter size={12} className="mr-1.5 text-zinc-500" /><SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all" className="text-zinc-300">Tất cả status</SelectItem>
            {["COMPLETED","PROCESSING","QUEUED","FAILED"].map(s => (
              <SelectItem key={s} value={s} className="text-zinc-300">{STATUS_COLORS[s]?.label ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={quality || "all"} onValueChange={v => setQuality(v === "all" ? "" : v)}>
          <SelectTrigger className="w-32 h-9 text-sm bg-zinc-900 border-zinc-800 text-white"><SelectValue placeholder="Chất lượng" /></SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all" className="text-zinc-300">Tất cả</SelectItem>
            <SelectItem value="sd"  className="text-zinc-300">SD</SelectItem>
            <SelectItem value="hd"  className="text-zinc-300">HD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1f1f23" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "#111113", borderBottom: "1px solid #1f1f23" }}>
              {["Ảnh","Tính năng","User","Status","Chất lượng","Credits","Ngày tạo",isAdmin ? "" : null].filter(Boolean).map(h => (
                <th key={h!} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#71717a" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#0c0c0e" : "#0f0f11" }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded" style={{ background: "#27272a", width: `${30+j*8}%` }} /></td>
                    ))}
                  </tr>
                ))
              : (data?.jobs ?? []).map((job: any, i: number) => {
                  const sc = STATUS_COLORS[job.status];
                  return (
                    <tr key={job.id} style={{ background: i % 2 === 0 ? "#0c0c0e" : "#0f0f11", borderBottom: "1px solid #1f1f23" }}
                      className="hover:bg-zinc-900/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedJob(job)}>
                      <td className="px-4 py-3">
                        <div 
                          className={`w-9 h-9 rounded-lg overflow-hidden shrink-0 ${job.outputUrl ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`} 
                          style={{ background: "#27272a" }}
                          onClick={() => job.outputUrl && setPreviewImage(job.outputUrl)}
                        >
                          {job.outputUrl
                            ? <img src={job.outputUrl} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} style={{ color: "#52525b" }} /></div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-white">{job.featureName}</p>
                        <p className="text-[10px] font-mono" style={{ color: "#52525b" }}>{job.id.slice(0,8)}...</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={job.user?.image ?? ""} />
                            <AvatarFallback className="text-[9px] bg-zinc-800">{job.user?.name?.[0] ?? "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs text-white">{job.user?.name ?? "—"}</p>
                            <p className="text-[10px]" style={{ color: "#52525b" }}>{job.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full"
                          style={{ background: sc?.bg ?? "#27272a", color: sc?.text ?? "#71717a" }}>
                          {sc?.label ?? job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-400">{job.quality?.toUpperCase()}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold" style={{ color: "#facc15" }}>{job.creditUsed}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: "#71717a" }}>{new Date(job.createdAt).toLocaleDateString("vi-VN")}</span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteJob(job)}
                            className="h-7 px-2 text-red-500/60 hover:text-red-400 hover:bg-red-500/10">
                            <Trash2 size={11} />
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Pagination — luôn hiển thị sau khi data load */}
      {data && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: "#71717a" }}>
            Trang <span className="text-white font-bold">{data.page}</span>/{data.totalPages}
            &nbsp;·&nbsp;<span className="text-white font-bold">{data.total.toLocaleString("vi-VN")}</span> kết quả
          </p>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
              style={{ borderColor: "#27272a", background: "#18181b", color: "#a1a1aa" }}>
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
              const p = data.totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
              if (p > data.totalPages) return null;
              return (
                <Button key={p} size="sm" variant="outline"
                  onClick={() => setJobsFilter({ page: p })}
                  style={{
                    borderColor: p === page ? "#dc2626" : "#27272a",
                    background: p === page ? "rgba(220,38,38,0.15)" : "#18181b",
                    color: p === page ? "#f87171" : "#a1a1aa",
                    minWidth: 32,
                  }}>
                  {p}
                </Button>
              );
            })}
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(data.totalPages, p+1))} disabled={page >= data.totalPages}
              style={{ borderColor: "#27272a", background: "#18181b", color: "#a1a1aa" }}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Job Dialog ── */}
      <Dialog open={!!confirmDeleteJob} onOpenChange={o => { if (!o) setConfirmDeleteJob(null); }}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-black flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-400" /> Xác nhận xóa Job
            </DialogTitle>
          </DialogHeader>
          {confirmDeleteJob && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl space-y-1" style={{ background: "#0f0f11", border: "1px solid #1f1f23" }}>
                <p className="text-xs font-semibold text-white">{confirmDeleteJob.featureName}</p>
                <p className="text-[10px] font-mono" style={{ color: "#52525b" }}>ID: {confirmDeleteJob.id}</p>
                <p className="text-[10px]" style={{ color: "#71717a" }}>User: {confirmDeleteJob.user?.email}</p>
              </div>
              <p className="text-xs" style={{ color: "#71717a" }}>
                Hành động này sẽ xóa vĩnh viễn job này.{" "}
                <span className="text-red-400 font-semibold">Không thể hoàn tác.</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-400 hover:text-white text-xs"
                  onClick={() => setConfirmDeleteJob(null)}>Hủy</Button>
                <Button className="flex-1 text-white font-bold text-xs bg-red-600 hover:bg-red-500"
                  onClick={() => deleteMut.mutate(confirmDeleteJob.id)} disabled={deleteMut.isPending}>
                  {deleteMut.isPending ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Trash2 size={12} className="mr-1.5" />}
                  Xóa vĩnh viễn
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Preview Image Dialog ── */}
      <Dialog open={!!previewImage} onOpenChange={o => { if (!o) setPreviewImage(null); }}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-zinc-950 border-zinc-800 flex justify-center items-center">
          <DialogTitle className="sr-only">Xem ảnh</DialogTitle>
          {previewImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
      {/* ── Job Detail Dialog ── */}
      <JobDetailDialog
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={(open) => { if (!open) setSelectedJob(null); }}
      />

    </div>
  );
}
