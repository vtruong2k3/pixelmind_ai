"use client";
import { useState, useMemo } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Download, Globe, Lock, Zap, Sparkles, RefreshCw, Link2, FolderPlus, CheckSquare, Upload, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { userService, type HistoryItem } from "@/services/userService";

/* ── Top-level Tabs ── */
const TOP_TABS = [
  { id: "media",   label: "Media" },
  { id: "avatar",  label: "Avatar" },
  { id: "voice",   label: "Voice" },
  { id: "project", label: "Project" },
];

/* ── Media Filter Tabs ── */
const MEDIA_FILTERS = [
  { id: "all",     label: "All" },
  { id: "video",   label: "Video" },
  { id: "image",   label: "Image" },
  { id: "music",   label: "Music" },
  { id: "speech",  label: "Speech" },
];

function groupByDate(items: HistoryItem[]) {
  const groups: Record<string, HistoryItem[]> = {};
  for (const item of items) {
    const d = new Date(item.createdAt);
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.entries(groups);
}

export default function HistoryPage() {
  const [topTab, setTopTab] = useState("media");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [selectMode, setSelectMode] = useState(false);
  const qc = useQueryClient();

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

  const items: HistoryItem[] = data?.pages.flatMap(p => p.jobs) ?? [];

  // Simple filter by media type (expand logic as needed)
  const filtered = mediaFilter === "all"
    ? items
    : items.filter(i => {
        const slug = (i.featureSlug ?? "").toLowerCase();
        const name = (i.featureName ?? "").toLowerCase();
        if (mediaFilter === "video") return slug.includes("video") || name.includes("video");
        if (mediaFilter === "music") return slug.includes("music") || name.includes("music") || name.includes("audio");
        if (mediaFilter === "speech") return slug.includes("speech") || slug.includes("tts") || name.includes("speech") || name.includes("text to speech");
        if (mediaFilter === "image") return !slug.includes("video") && !slug.includes("music") && !slug.includes("audio") && !slug.includes("speech") && !slug.includes("tts");
        return true;
      });

  const dateGroups = useMemo(() => groupByDate(filtered), [filtered]);

  // Toggle public/private
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
      qc.setQueryData(["user-history"], ctx?.prev);
      toast.error("Không thể cập nhật trạng thái");
    },
    onSuccess: ({ newPublic }) => {
      toast.success(newPublic ? "Đã chia sẻ lên Gallery" : "Đã chuyển sang riêng tư");
    },
  });

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Top Tabs ── */}
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid #f0f0f0", marginBottom: 32 }}>
          {TOP_TABS.map(tab => (
            <button key={tab.id} onClick={() => setTopTab(tab.id)}
              style={{
                padding: "12px 0", fontSize: 15, fontWeight: 600, border: "none",
                background: "transparent", cursor: "pointer",
                color: topTab === tab.id ? "#7c3aed" : "#9ca3af",
                borderBottom: topTab === tab.id ? "2px solid #7c3aed" : "2px solid transparent",
                transition: "all 0.15s",
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Folders Section ── */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 16 }}>Folders</h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <button style={{
              width: 140, height: 120, borderRadius: 12,
              border: "1px dashed #d1d5db",
              background: "#fafafa",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, cursor: "pointer", transition: "all 0.15s",
              color: "#9ca3af",
            }}>
              <FolderPlus size={24} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Add new folder</span>
            </button>
          </div>
        </div>

        {/* ── Filter Row ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          {/* Left: filter tabs + Type dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {MEDIA_FILTERS.map(f => (
              <button key={f.id} onClick={() => setMediaFilter(f.id)}
                style={{
                  padding: "6px 16px", borderRadius: 20,
                  fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                  background: mediaFilter === f.id ? "#111" : "transparent",
                  color: mediaFilter === f.id ? "#fff" : "#9ca3af",
                  transition: "all 0.15s",
                }}
              >
                {f.label}
              </button>
            ))}
            <div style={{ marginLeft: 8 }}>
              <button style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "6px 14px", borderRadius: 8,
                fontSize: 13, fontWeight: 600, border: "1px solid #e5e7eb",
                background: "#fff", color: "#6b7280", cursor: "pointer",
              }}>
                Type <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Right: Select + Upload */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setSelectMode(!selectMode)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                fontSize: 13, fontWeight: 600, border: "1px solid #e5e7eb",
                background: selectMode ? "#f3f0ff" : "#fff",
                color: selectMode ? "#7c3aed" : "#374151", cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <CheckSquare size={14} /> Select
            </button>
            <Link href="/studio"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                fontSize: 13, fontWeight: 600, border: "1px solid #e5e7eb",
                background: "#fff", color: "#374151", cursor: "pointer",
                textDecoration: "none", transition: "all 0.15s",
              }}
            >
              <Upload size={14} /> Upload
            </Link>
            <button onClick={() => refetch()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36, borderRadius: 8,
                border: "1px solid #e5e7eb", background: "#fff",
                color: "#6b7280", cursor: "pointer",
              }}
              title="Làm mới"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {isLoading && items.length === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                aspectRatio: "3/4", borderRadius: 12,
                background: "#f4f4f5", animation: "pulse 1.5s ease-in-out infinite",
              }} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎨</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8 }}>Chưa có ảnh nào</h3>
            <p style={{ color: "#9ca3af", marginBottom: 24 }}>Hãy tạo ảnh đầu tiên của bạn ngay bây giờ!</p>
            <Link href="/studio" style={{
              padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700,
              color: "#fff", textDecoration: "none",
              background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
            }}>
              <Sparkles size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              Ghé Studio →
            </Link>
          </div>
        )}

        {/* ── Date-grouped grid ── */}
        {dateGroups.map(([dateLabel, groupItems]) => (
          <div key={dateLabel} style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", marginBottom: 12 }}>
              {dateLabel}
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}>
              {groupItems.map(item => (
                <div key={item.id} className="group"
                  style={{
                    position: "relative", borderRadius: 12, overflow: "hidden",
                    background: "#f4f4f5", cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Image */}
                  <div style={{ aspectRatio: "3/4", position: "relative" }}>
                    {item.outputUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.outputUrl} alt={item.featureName}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      : (
                        <div style={{
                          width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                          background: "linear-gradient(135deg,#f3f0ff,#ede9fe)",
                        }}>
                          <span style={{ color: "#c4b5fd", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            {item.status === "FAILED" ? "FAILED" : "AI"}
                          </span>
                        </div>
                      )}

                    {/* Type badge */}
                    <div style={{
                      position: "absolute", top: 6, left: 6,
                      padding: "2px 8px", borderRadius: 4,
                      fontSize: 10, fontWeight: 700,
                      background: "rgba(0,0,0,0.5)", color: "#fff",
                      backdropFilter: "blur(4px)",
                    }}>
                      Image
                    </div>

                    {/* Status badge */}
                    {item.status !== "COMPLETED" && (
                      <div style={{ position: "absolute", top: 6, right: 6 }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 4,
                          fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                          background: item.status === "FAILED" ? "rgba(239,68,68,0.8)" : "rgba(250,204,21,0.8)",
                          color: "#fff",
                        }}>
                          {item.status}
                        </span>
                      </div>
                    )}

                    {/* Public indicator */}
                    <div style={{ position: "absolute", bottom: 6, right: 6 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
                      }}>
                        {item.isPublic ? <Globe size={10} color="white" /> : <Lock size={10} color="white" />}
                      </span>
                    </div>

                    {/* Hover overlay */}
                    <div className="opacity-0 group-hover:opacity-100"
                      style={{
                        position: "absolute", inset: 0,
                        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        transition: "opacity 0.2s",
                      }}
                    >
                      {item.outputUrl && (
                        <a href={item.outputUrl} download
                          onClick={e => e.stopPropagation()}
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(255,255,255,0.9)", color: "#333",
                          }} title="Tải xuống">
                          <Download size={14} />
                        </a>
                      )}
                      {item.outputUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(item.outputUrl!).then(() => {
                              toast.success("Đã copy link ảnh!");
                            }).catch(() => toast.error("Không thể copy link."));
                          }}
                          style={{
                            width: 32, height: 32, borderRadius: 8, border: "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(255,255,255,0.9)", color: "#333", cursor: "pointer",
                          }} title="Copy link ảnh">
                          <Link2 size={14} />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); toggleMut.mutate(item); }}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: "none",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(255,255,255,0.9)", color: "#333", cursor: "pointer",
                        }} title={item.isPublic ? "Đổi sang riêng tư" : "Chia sẻ lên Gallery"}>
                        {item.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Load more */}
        {hasNextPage && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
              style={{
                padding: "12px 32px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: "#f4f4f5", color: "#71717a", border: "none", cursor: "pointer",
                transition: "all 0.15s",
              }}>
              {isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
