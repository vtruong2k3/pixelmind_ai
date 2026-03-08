"use client";
import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Download, Globe, Lock, Zap, Sparkles, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { userService, type HistoryItem } from "@/services/userService";

const FEATURE_CATEGORY_MAP: Record<string, string> = {
  swap_shirt: "fashion", swap_swimsuit: "fashion", insert_object: "fashion",
  swap_face: "fashion", change_color: "fashion", extract_clothing: "fashion",
  to_anime: "creative", drawing_to_photo: "creative",
  swap_background: "photo_edit", restore_photo: "photo_edit",
};

const CATEGORIES = [
  { id: "all",        label: "Tất cả"     },
  { id: "fashion",    label: "Thời trang" },
  { id: "creative",   label: "Sáng tạo"  },
  { id: "photo_edit", label: "Chỉnh sửa" },
];

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg,#1a0a2a,#2a0a3a)",
  "linear-gradient(135deg,#0a1628,#1a2a3a)",
  "linear-gradient(135deg,#0a2a1a,#0a3020)",
  "linear-gradient(135deg,#2a1a0a,#3a2010)",
];

export default function HistoryPage() {
  const [filter, setFilter] = useState("all");
  const qc = useQueryClient();

  // ── Infinite query ─────────────────────────────────────────────────────────
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["user-history"],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      userService.getHistory({ cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.hasMore ? last.cursor : undefined,
    staleTime: 60_000,
  });

  // Flatten pages → một mảng items
  const items: HistoryItem[] = data?.pages.flatMap(p => p.jobs) ?? [];

  const filtered = filter === "all"
    ? items
    : items.filter(i => FEATURE_CATEGORY_MAP[i.featureSlug] === filter);

  // ── Toggle public/private (optimistic update) ──────────────────────────────
  const toggleMut = useMutation({
    mutationFn: async (item: HistoryItem) => {
      const res = await fetch("/api/history", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: item.id, isPublic: !item.isPublic }),
      });
      if (!res.ok) throw new Error();
      return { id: item.id, newPublic: !item.isPublic };
    },
    onMutate: async (item) => {
      // Optimistic: cập nhật ngay trong cache
      await qc.cancelQueries({ queryKey: ["user-history"] });
      const prev = qc.getQueryData(["user-history"]);
      qc.setQueryData(["user-history"], (old: any) => ({
        ...old,
        pages: old?.pages?.map((page: any) => ({
          ...page,
          jobs: page.jobs.map((j: HistoryItem) =>
            j.id === item.id ? { ...j, isPublic: !item.isPublic } : j
          ),
        })),
      }));
      return { prev };
    },
    onError: (_err, _item, ctx) => {
      qc.setQueryData(["user-history"], ctx?.prev); // rollback
      toast.error("Không thể cập nhật trạng thái");
    },
    onSuccess: ({ newPublic }) => {
      toast.success(newPublic ? "Đã chia sẻ lên Gallery" : "Đã chuyển sang riêng tư");
    },
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <p className="mono text-xs text-gray-400 uppercase tracking-widest mb-3">Tài khoản · Lịch sử</p>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight" style={{ letterSpacing: "-0.03em" }}>
              Lịch sử tạo ảnh
            </h1>
          </div>
          <Link href="/studio"
            className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-white shrink-0"
            style={{ background: "var(--cta-gradient)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
            <Sparkles size={15} /> Tạo ảnh mới
          </Link>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setFilter(cat.id)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={filter === cat.id
                ? { background: "#0a0a0a", color: "#fff" }
                : { background: "#f4f4f5", color: "#71717a" }}>
              {cat.label}
            </button>
          ))}
          <button onClick={() => refetch()}
            className="ml-auto p-2 rounded-lg border text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            style={{ border: "1px solid #e4e4e7" }} title="Làm mới">
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Skeleton */}
        {isLoading && items.length === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "#f4f4f5" }}>
                <div className="aspect-[3/4]" />
                <div className="p-3 flex flex-col gap-1.5">
                  <div className="h-3 rounded bg-gray-200 w-3/4" />
                  <div className="h-3 rounded bg-gray-200 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có ảnh nào</h3>
            <p className="text-gray-400 mb-6">Hãy tạo ảnh đầu tiên của bạn ngay bây giờ!</p>
            <Link href="/studio" className="px-6 py-3 rounded-lg text-sm font-bold text-white inline-block"
              style={{ background: "var(--cta-gradient)" }}>
              Ghé Studio →
            </Link>
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((item, idx) => (
              <div key={item.id}
                className="group rounded-2xl overflow-hidden border transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ border: "1px solid #f0f0f0" }}>
                {/* Image */}
                <div className="relative aspect-[3/4]"
                  style={{ background: PLACEHOLDER_GRADIENTS[idx % PLACEHOLDER_GRADIENTS.length] }}>
                  {item.outputUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.outputUrl} alt={item.featureName} className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white/20 text-xs mono uppercase tracking-widest">
                          {item.status === "FAILED" ? "FAILED" : "AI"}
                        </span>
                      </div>
                    )}

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {item.outputUrl && (
                      <a href={item.outputUrl} download className="p-2 rounded-lg bg-white/90 text-gray-800 hover:bg-white transition-colors">
                        <Download size={14} />
                      </a>
                    )}
                    <button onClick={() => toggleMut.mutate(item)}
                      className="p-2 rounded-lg bg-white/90 text-gray-800 hover:bg-white transition-colors"
                      title={item.isPublic ? "Đổi sang riêng tư" : "Chia sẻ lên Gallery"}>
                      {item.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                    </button>
                  </div>

                  {/* Status badge */}
                  {item.status !== "COMPLETED" && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mono"
                        style={item.status === "FAILED"
                          ? { background: "rgba(239,68,68,0.15)", color: "#ef4444" }
                          : { background: "rgba(250,204,21,0.15)", color: "#ca8a04" }}>
                        {item.status}
                      </span>
                    </div>
                  )}

                  {/* Public indicator */}
                  <div className="absolute top-2 right-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
                      {item.isPublic ? <Globe size={11} color="white" /> : <Lock size={11} color="white" />}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-semibold text-gray-800 truncate">{item.featureName}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400 mono">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                    <div className="flex items-center gap-1">
                      <Zap size={9} color="#a78bfa" />
                      <span className="text-[10px] font-bold mono" style={{ color: "#a78bfa" }}>{item.creditUsed}</span>
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                        style={{ background: "#f4f4f5", color: "#71717a" }}>{item.quality}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasNextPage && (
          <div className="text-center mt-10">
            <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
              className="px-8 py-3 rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: "#f4f4f5", color: "#71717a" }}>
              {isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
