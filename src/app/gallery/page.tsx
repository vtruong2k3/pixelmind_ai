"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Heart, Download, Sparkles, X } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "fashion", label: "Thời trang" },
  { id: "creative", label: "Sáng tạo" },
  { id: "photo_edit", label: "Chỉnh sửa" },
];

const FEATURE_CATEGORY_MAP: Record<string, string> = {
  swap_shirt: "fashion", swap_swimsuit: "fashion", insert_object: "fashion",
  swap_face: "fashion", change_color: "fashion", extract_clothing: "fashion",
  to_anime: "creative", drawing_to_photo: "creative",
  swap_background: "photo_edit", restore_photo: "photo_edit",
};

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
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

export default function GalleryPage() {
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const fetchGallery = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "24" });
      if (!reset && cursor) params.set("cursor", cursor);
      if (filter !== "all") params.set("feature", filter);
      const res = await fetch(`/api/gallery?${params}`);
      const data = await res.json();
      if (data?.items?.length) {
        setItems(prev => reset ? data.items : [...prev, ...data.items]);
        setCursor(data.cursor);
        setHasMore(!!data.cursor);
      } else if (reset) {
        setItems([]);
        setHasMore(false);
      }
    } catch {
      /* keep demo items */
    } finally {
      setLoading(false);
    }
  }, [filter, cursor]);

  useEffect(() => { fetchGallery(true); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleLike = async (item: GalleryItem) => {
    // Optimistic update
    setItems(prev => prev.map(i =>
      i.id === item.id
        ? { ...i, isLikedByMe: !i.isLikedByMe, likeCount: i.likeCount + (i.isLikedByMe ? -1 : 1) }
        : i
    ));
    try {
      await fetch("/api/gallery/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: item.id }),
      });
    } catch {
      // revert optimistic update on failure
      setItems(prev => prev.map(i =>
        i.id === item.id
          ? { ...i, isLikedByMe: item.isLikedByMe, likeCount: item.likeCount }
          : i
      ));
    }
  };

  const filtered = filter === "all"
    ? items
    : items.filter(i => FEATURE_CATEGORY_MAP[i.featureSlug] === filter);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="mono text-xs text-gray-400 uppercase tracking-widest mb-3">Cộng đồng · Gallery</p>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight" style={{ letterSpacing: "-0.03em" }}>
              Tác phẩm AI từ cộng đồng
            </h1>
            <p className="text-gray-400 mt-2 leading-relaxed">
              Những hình ảnh tuyệt đẹp được tạo ra bởi cộng đồng PixelMind AI.<br />
              Bạn cũng có thể tạo ảnh của mình ngay bây giờ.
            </p>
          </div>
          <Link
            href="/studio"
            className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-white shrink-0 transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: "var(--cta-gradient)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
          >
            <Sparkles size={15} /> Tạo ảnh ngay
          </Link>
        </div>

        {/* Filter */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={filter === cat.id
                  ? { background: "#0a0a0a", color: "#fff" }
                  : { background: "#f4f4f5", color: "#71717a" }
                }
              >
                {cat.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-400 mono">{filtered.length} tác phẩm</p>
        </div>

        {/* Loading skeleton */}
        {loading && items.length === 0 && (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="mb-4 break-inside-avoid rounded-2xl"
                style={{ height: `${200 + (i % 3) * 80}px`, background: "#f4f4f5", animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" }}
              />
            ))}
          </div>
        )}

        {/* Masonry grid */}
        {!loading && (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="text-5xl mb-4">🎨</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có tác phẩm</h3>
                <p className="text-gray-400 mb-6">Hãy là người đầu tiên chia sẻ tác phẩm AI!</p>
                <Link href="/studio" className="px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--lavender)" }}>
                  Tạo ngay
                </Link>
              </div>
            ) : filtered.map((item, idx) => (
              <div
                key={item.id}
                className="mb-4 break-inside-avoid group rounded-2xl overflow-hidden relative cursor-pointer"
                style={{ background: "#f4f4f5" }}
                onClick={() => setLightbox(item)}
              >
                <div
                  className="w-full"
                  style={{
                    aspectRatio: idx % 3 === 0 ? "3/4" : idx % 3 === 1 ? "1/1" : "4/5",
                    background: item.outputUrl ? "transparent" : PLACEHOLDER_GRADIENTS[idx % PLACEHOLDER_GRADIENTS.length],
                  }}
                >
                  {item.outputUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.outputUrl} alt={item.featureName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white/30 text-xs mono uppercase tracking-widest">AI</span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 flex flex-col justify-end p-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)" }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}
                        >
                          {(item.userName ?? "A")[0]}
                        </div>
                        <span className="text-white text-[11px] font-semibold">{item.userName ?? "Ẩn danh"}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => toggleLike(item)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white"
                          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }}
                        >
                          <Heart
                            size={11}
                            fill={item.isLikedByMe ? "#f87171" : "none"}
                            stroke={item.isLikedByMe ? "#f87171" : "white"}
                          />
                          {item.likeCount}
                        </button>
                        {item.outputUrl && (
                          <a
                            href={item.outputUrl}
                            download
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white"
                            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }}
                          >
                            <Download size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                    <p className="text-white/70 text-[11px] font-medium">{item.featureName}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {!loading && hasMore && (
          <div className="text-center mt-12">
            <button
              onClick={() => fetchGallery(false)}
              className="px-8 py-3 rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: "#f4f4f5", color: "#71717a" }}
            >
              Xem thêm
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X size={24} />
          </button>
          <div
            className="relative max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.outputUrl} alt={lightbox.featureName} className="max-h-[85vh] object-contain" />
            <div
              className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)" }}
            >
              <span className="text-white text-sm font-semibold">{lightbox.featureName}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { toggleLike(lightbox); setLightbox(prev => prev ? { ...prev, isLikedByMe: !prev.isLikedByMe, likeCount: prev.likeCount + (prev.isLikedByMe ? -1 : 1) } : null); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }}
                >
                  <Heart size={13} fill={lightbox.isLikedByMe ? "#f87171" : "none"} stroke={lightbox.isLikedByMe ? "#f87171" : "white"} />
                  {lightbox.likeCount}
                </button>
                <a
                  href={lightbox.outputUrl}
                  download
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" }}
                >
                  <Download size={13} /> Tải về
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
