"use client";
import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Heart, Download, Sparkles, X, Loader2, Link2, Search, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { toast } from "sonner";

/* ── Categories — filter by feature ── */
const CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "ai_image", label: "AI Image" },
  { id: "ai_image_editor", label: "AI Image Editor" },
  { id: "ai_video_editor", label: "AI Video Editor" },
  { id: "image_to_video", label: "Image to Video" },
  { id: "text_to_video", label: "Text to Video" },
  { id: "ai_avatar", label: "AI Avatar" },
];

/* ── Hero Banner Slides ── */
const HERO_SLIDES = [
  {
    title: "AI Image Generator and Editor",
    desc: "Tạo hình ảnh chất lượng cao từ mô tả văn bản hoặc ảnh tham chiếu. Hỗ trợ text-to-image, chỉnh sửa prompt, character consistency và nhiều hơn nữa.",
    cta: "Try Now",
    href: "/studio",
    label: "Text & Image to Image",
    emoji: "🎨",
  },
  {
    title: "AI Photo Editor",
    desc: "Chỉnh sửa ảnh thông minh với AI — đổi nền, phục hồi ảnh cũ, thay trang phục, biến đổi phong cách chỉ trong vài giây.",
    cta: "Try Now",
    href: "/studio",
    label: "Swap & Transform",
    emoji: "✨",
  },
  {
    title: "Creative AI Tools",
    desc: "Biến ảnh thành anime, vẽ từ bản phác thảo, chèn vật thể — bộ công cụ sáng tạo AI toàn diện cho mọi nhu cầu.",
    cta: "Try Now",
    href: "/studio",
    label: "Drawing to Photo & More",
    emoji: "🖌️",
  },
];

interface GalleryItem {
  id: string;
  featureSlug: string;
  featureName: string;
  outputUrl: string;
  userName: string | null;
  userImage: string | null;
  createdAt: string;
  likeCount: number;
  isLikedByMe: boolean;
}

interface GalleryPage {
  items: GalleryItem[];
  cursor?: string;
  hasMore: boolean;
}

async function fetchGalleryPage({ pageParam, filter }: { pageParam?: string; filter: string }): Promise<GalleryPage> {
  const params = new URLSearchParams({ limit: "24" });
  if (pageParam) params.set("cursor", pageParam);
  if (filter !== "all") params.set("feature", filter);
  const res = await fetch(`/api/gallery?${params}`);
  const data = await res.json();
  return {
    items: data?.items ?? [],
    cursor: data?.cursor,
    hasMore: !!data?.cursor,
  };
}

/* ── Hero Banner Component ── */
function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % HERO_SLIDES.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const slide = HERO_SLIDES[current];
  const prev = () => setCurrent((current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const next = () => setCurrent((current + 1) % HERO_SLIDES.length);

  return (
    <div style={{
      position: "relative", borderRadius: 24, overflow: "hidden",
      background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)",
      minHeight: 420, display: "flex", alignItems: "center",
      marginBottom: 32, border: "1px solid #e5e7eb",
    }}>
      {/* Left preview area — single image */}
      <div style={{
        width: "42%", minHeight: 420, padding: "32px 24px 32px 40px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        position: "relative",
      }}>
        {/* Single large preview image */}
        <div style={{
          width: 520, height: 360, borderRadius: 20,
          background: "#fff",
          boxShadow: "0 12px 32px rgba(124,58,237,0.12)",
          overflow: "hidden",
          border: "3px solid rgba(255,255,255,0.95)",
          marginTop: 16,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://picsum.photos/seed/pixelmind1/840/720" alt="Sample"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      </div>

      {/* Right text area */}
      <div style={{ flex: 1, padding: "40px 48px 40px 16px" }}>
        <h2 style={{
          fontSize: 50, fontWeight: 700, color: "#111",
          letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 14,
        }}>
          {slide.title}
        </h2>
        <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, marginBottom: 22, maxWidth: 480 }}>
          {slide.desc}
        </p>
        <Link href={slide.href} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "14px 36px", borderRadius: 50,
          fontSize: 16, fontWeight: 700, textDecoration: "none",
          background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
          color: "#fff",
          boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
          transition: "all 0.2s",
        }}>
          {slide.cta}
        </Link>
      </div>

      {/* Nav arrows + Dots — bottom right */}
      <div style={{
        position: "absolute", bottom: 16, right: 24,
        display: "flex", gap: 6, alignItems: "center",
      }}>
        <button onClick={prev} style={{
          width: 28, height: 28, borderRadius: "50%", border: "1px solid #e5e7eb",
          background: "#fff", color: "#6b7280",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <ChevronLeft size={14} />
        </button>
        {HERO_SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{
            width: 8, height: 8,
            borderRadius: "50%", border: "none", cursor: "pointer",
            background: i === current ? "#7c3aed" : "rgba(124,58,237,0.2)",
            transition: "all 0.3s",
          }} />
        ))}
        <button onClick={next} style={{
          width: 28, height: 28, borderRadius: "50%", border: "1px solid #e5e7eb",
          background: "#fff", color: "#6b7280",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Main Gallery Page ── */
export default function GalleryPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const qc = useQueryClient();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["gallery", filter],
    queryFn: ({ pageParam }) => fetchGalleryPage({ pageParam: pageParam as string | undefined, filter }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.hasMore ? last.cursor : undefined,
    staleTime: 60_000,
  });

  const allItems: GalleryItem[] = data?.pages.flatMap(p => p.items) ?? [];
  const items = search.trim()
    ? allItems.filter(i => i.featureName.toLowerCase().includes(search.trim().toLowerCase()))
    : allItems;

  // Like mutation
  const likeMut = useMutation({
    mutationFn: async (item: GalleryItem) => {
      const res = await fetch("/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: item.id }),
      });
      if (!res.ok) throw new Error();
      return item.id;
    },
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: ["gallery", filter] });
      const prev = qc.getQueryData(["gallery", filter]);
      qc.setQueryData(["gallery", filter], (old: any) => ({
        ...old,
        pages: old?.pages?.map((page: any) => ({
          ...page,
          items: page.items.map((i: GalleryItem) =>
            i.id === item.id
              ? { ...i, isLikedByMe: !i.isLikedByMe, likeCount: i.likeCount + (i.isLikedByMe ? -1 : 1) }
              : i
          ),
        })),
      }));
      if (lightbox?.id === item.id) {
        setLightbox(prev => prev ? {
          ...prev,
          isLikedByMe: !prev.isLikedByMe,
          likeCount: prev.likeCount + (prev.isLikedByMe ? -1 : 1),
        } : null);
      }
      return { prev };
    },
    onError: (_err, _item, ctx) => {
      qc.setQueryData(["gallery", filter], ctx?.prev);
    },
  });

  // Responsive column count based on window width
  const [columnCount, setColumnCount] = useState(5);
  useEffect(() => {
    const updateColumns = () => {
      const w = window.innerWidth;
      if (w < 640) setColumnCount(1);
      else if (w < 768) setColumnCount(2);
      else if (w < 1024) setColumnCount(3);
      else if (w < 1400) setColumnCount(4);
      else setColumnCount(5);
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const columns: GalleryItem[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, i) => columns[i % columnCount].push(item));

  // Varying aspect ratios for visual interest — taller cards
  const getAspectRatio = (idx: number) => {
    const ratios = ["3/4", "2/3", "3/4", "4/5", "2/3", "3/4", "4/5", "3/4"];
    return ratios[idx % ratios.length];
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <Navbar />

      <div style={{ maxWidth: 1700, margin: "0 auto", padding: "24px 24px 60px" }}>

        {/* ── Hero Banner ── */}
        <HeroBanner />

        {/* ── Search + Filter Bar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 24, flexWrap: "wrap", gap: 12,
        }}>
          {/* Left: filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setFilter(cat.id)}
                style={{
                  padding: "8px 18px", borderRadius: 50,
                  fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                  background: filter === cat.id ? "#111" : "#fff",
                  color: filter === cat.id ? "#fff" : "#6b7280",
                  boxShadow: filter === cat.id ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
                  transition: "all 0.15s",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right: search */}
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              style={{
                width: 220, paddingLeft: 34, paddingRight: search ? 32 : 12,
                paddingTop: 8, paddingBottom: 8,
                fontSize: 13, borderRadius: 50, border: "1px solid #e5e7eb",
                background: "#fff", outline: "none", color: "#333",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer",
                }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Skeleton ── */}
        {isLoading && (
          <div style={{ display: "flex", gap: 12 }}>
            {Array.from({ length: columnCount }).map((_, col) => (
              <div key={col} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                {Array.from({ length: 3 }).map((_, row) => (
                  <div key={row} style={{
                    borderRadius: 16, background: "#eee",
                    aspectRatio: getAspectRatio(col * 3 + row),
                    animation: "pulse 1.5s ease-in-out infinite",
                  }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && items.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎨</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8 }}>Chưa có tác phẩm</h3>
            <p style={{ color: "#9ca3af", marginBottom: 24 }}>Hãy là người đầu tiên chia sẻ tác phẩm AI!</p>
            <Link href="/studio" style={{
              padding: "12px 28px", borderRadius: 50, fontSize: 14, fontWeight: 700,
              color: "#fff", textDecoration: "none",
              background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
            }}>
              Tạo ngay
            </Link>
          </div>
        )}

        {/* ── Masonry Grid ── */}
        {!isLoading && items.length > 0 && (
          <div style={{ display: "flex", gap: 12 }}>
            {columns.map((colItems, colIdx) => (
              <div key={colIdx} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                {colItems.map((item, rowIdx) => {
                  const globalIdx = colIdx + rowIdx * columnCount;
                  return (
                    <div key={item.id} className="gallery-card"
                      style={{
                        position: "relative", borderRadius: 16, overflow: "hidden",
                        cursor: "pointer", background: "#e5e7eb",
                      }}
                      onClick={() => setLightbox(item)}
                    >
                      <div style={{ aspectRatio: getAspectRatio(globalIdx), position: "relative" }}>
                        {item.outputUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={item.outputUrl} alt={item.featureName}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            loading="lazy" />
                          : (
                            <div style={{
                              width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                              background: "linear-gradient(135deg,#f3f0ff,#ede9fe)",
                            }}>
                              <span style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>AI</span>
                            </div>
                          )}

                        {/* Hover overlay — bottom gradient with actions */}
                        <div className="gallery-card-overlay" style={{
                          position: "absolute", inset: 0, opacity: 0,
                          background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 40%, transparent 60%)",
                          display: "flex", flexDirection: "column", justifyContent: "flex-end",
                          padding: 12, transition: "opacity 0.25s ease",
                        }}
                          onClick={e => e.stopPropagation()}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            {/* User info */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{
                                width: 24, height: 24, borderRadius: "50%",
                                background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 10, fontWeight: 700, color: "#fff",
                              }}>
                                {(item.userName ?? "A")[0]}
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                                {item.userName ?? "Ẩn danh"}
                              </span>
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => likeMut.mutate(item)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 3,
                                  padding: "4px 8px", borderRadius: 8, border: "none",
                                  background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)",
                                  color: "#fff", fontSize: 11, cursor: "pointer",
                                }}>
                                <Heart size={11} fill={item.isLikedByMe ? "#f87171" : "none"} stroke={item.isLikedByMe ? "#f87171" : "white"} />
                                {item.likeCount}
                              </button>
                              {item.outputUrl && (
                                <button onClick={() => {
                                  navigator.clipboard.writeText(item.outputUrl).then(() => toast.success("Đã copy link!")).catch(() => toast.error("Lỗi copy."));
                                }}
                                  style={{
                                    display: "flex", alignItems: "center", padding: "4px 8px",
                                    borderRadius: 8, border: "none",
                                    background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)",
                                    color: "#fff", cursor: "pointer",
                                  }}>
                                  <Link2 size={11} />
                                </button>
                              )}
                              {item.outputUrl && (
                                <a href={item.outputUrl} download onClick={e => e.stopPropagation()}
                                  style={{
                                    display: "flex", alignItems: "center", padding: "4px 8px",
                                    borderRadius: 8, textDecoration: "none",
                                    background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)",
                                    color: "#fff",
                                  }}>
                                  <Download size={11} />
                                </a>
                              )}
                            </div>
                          </div>
                          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 4, fontWeight: 500 }}>
                            {item.featureName}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ── Load more ── */}
        {hasNextPage && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
              style={{
                padding: "12px 32px", borderRadius: 50,
                fontSize: 14, fontWeight: 600, border: "1px solid #e5e7eb",
                background: "#fff", color: "#6b7280", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                transition: "all 0.15s",
              }}>
              {isFetchingNextPage && <Loader2 size={14} className="animate-spin" />}
              {isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
            </button>
          </div>
        )}

        {/* ── Item count ── */}
        {items.length > 0 && (
          <p style={{ textAlign: "center", fontSize: 12, color: "#d1d5db", marginTop: 16 }}>
            {items.length} tác phẩm
          </p>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
        }}
          onClick={() => setLightbox(null)}
        >
          <button style={{
            position: "absolute", top: 16, right: 16,
            background: "transparent", border: "none", color: "rgba(255,255,255,0.6)",
            cursor: "pointer",
          }}
            onClick={() => setLightbox(null)}
          >
            <X size={24} />
          </button>
          <div style={{
            position: "relative", maxWidth: 640, maxHeight: "90vh",
            borderRadius: 16, overflow: "hidden",
          }}
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.outputUrl} alt={lightbox.featureName}
              style={{ maxHeight: "85vh", objectFit: "contain", display: "block" }} />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
            }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{lightbox.featureName}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => likeMut.mutate(lightbox)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "6px 12px", borderRadius: 8, border: "none",
                    background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)",
                    color: "#fff", fontSize: 13, cursor: "pointer",
                  }}>
                  <Heart size={13} fill={lightbox.isLikedByMe ? "#f87171" : "none"} stroke={lightbox.isLikedByMe ? "#f87171" : "white"} />
                  {lightbox.likeCount}
                </button>
                <button onClick={() => {
                  navigator.clipboard.writeText(lightbox.outputUrl).then(() => toast.success("Đã copy link!")).catch(() => toast.error("Lỗi copy."));
                }}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "6px 12px", borderRadius: 8, border: "none",
                    background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)",
                    color: "#fff", fontSize: 13, cursor: "pointer",
                  }}>
                  <Link2 size={13} />
                </button>
                <a href={lightbox.outputUrl} download
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "6px 12px", borderRadius: 8, textDecoration: "none",
                    background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)",
                    color: "#fff", fontSize: 13,
                  }}>
                  <Download size={13} /> Tải về
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS for hover effects ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .gallery-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .gallery-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
        }
        .gallery-card:hover .gallery-card-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
