"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Download, Image as ImageIcon, ExternalLink,
  Copy, Check, Loader2, X, ZoomIn,
} from "lucide-react";
import type { ResultItem } from "@/types/ui";

interface ResultPanelProps {
  results: ResultItem[];
  loading?: boolean;
}

export default function ResultPanel({ results, loading }: ResultPanelProps) {
  const [lightbox, setLightbox] = useState<ResultItem | null>(null);

  const hasItems = results.length > 0 || loading;

  return (
    <aside
      className="flex flex-col overflow-hidden"
      style={{ width: "100%", height: "100%", background: "#0d0d0d", borderLeft: "1px solid #1c1c1c" }}
    >
      {/* ── Header ── */}
      <div
        className="px-4 py-3 shrink-0 flex items-center justify-between"
        style={{ borderBottom: "1px solid #1c1c1c", background: "#0d0d0d" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest mono" style={{ color: "rgba(255,255,255,0.25)" }}>
            Kết quả
          </span>
          {results.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold mono" style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>
              {results.length}
            </span>
          )}
          {loading && (
            <div className="flex items-center gap-1.5">
              <Loader2 size={10} className="animate-spin" style={{ color: "#a78bfa" }} />
              <span className="text-[10px] mono" style={{ color: "#a78bfa" }}>đang xử lý...</span>
            </div>
          )}
        </div>
        {results.length > 0 && (
          <Link
            href="/history"
            className="text-[10px] font-semibold flex items-center gap-1 hover:opacity-60 transition-opacity mono"
            style={{ color: "#a78bfa" }}
          >
            Lịch sử <ExternalLink size={9} />
          </Link>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-3 studio-scroll">

        {/* Empty state */}
        {!hasItems && (
          <div
            className="h-full flex flex-col items-center justify-center text-center gap-4"
            style={{ minHeight: "300px" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <ImageIcon size={24} style={{ color: "rgba(255,255,255,0.12)" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.18)" }}>Ảnh sẽ xuất hiện ở đây</p>
              <p className="text-[11px] mt-1 mono" style={{ color: "rgba(255,255,255,0.1)" }}>Upload ảnh → Tạo ảnh</p>
            </div>
          </div>
        )}

        {/* Grid — responsive 1 or 2 cols */}
        {hasItems && (
          <div className="columns-1 sm:columns-1 gap-3 space-y-3" style={{ columnFill: "balance" }}
            /* Use CSS columns instead of grid for masonry effect */ >

            {/* Loading skeleton — full column */}
            {loading && (
              <div
                className="break-inside-avoid rounded-2xl overflow-hidden w-full"
                style={{ background: "#1a1a1a", border: "1px solid #252525" }}
              >
                {/* Shimmer image area */}
                <div
                  className="w-full"
                  style={{
                    aspectRatio: "3/4",
                    background: "linear-gradient(110deg, #1a1a1a 30%, #252525 50%, #1a1a1a 70%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.8s ease-in-out infinite",
                  }}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    {/* Pulsing ring */}
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(124,58,237,0.1)", border: "2px solid rgba(124,58,237,0.2)" }}
                      >
                        <Loader2 size={26} className="animate-spin" style={{ color: "#a78bfa" }} />
                      </div>
                      {/* Outer pulse ring */}
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          border: "2px solid rgba(124,58,237,0.15)",
                          animation: "pulse-ring 2s ease-out infinite",
                        }}
                      />
                    </div>
                    <div className="text-center px-6">
                      <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                        AI đang tạo ảnh...
                      </p>
                      <p className="text-[11px] mono mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                        ChainHub · SD ~30s · HD ~60s
                      </p>
                    </div>
                  </div>
                </div>
                {/* Shimmer text rows */}
                <div className="p-3 flex flex-col gap-2">
                  <div className="h-2.5 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.06)", animation: "shimmer 1.8s ease-in-out infinite" }} />
                  <div className="h-2 rounded-full w-1/2" style={{ background: "rgba(255,255,255,0.04)", animation: "shimmer 1.8s ease-in-out infinite 0.2s" }} />
                </div>
              </div>
            )}

            {/* Result cards */}
            {results.map(result => (
              <div key={result.id} className="break-inside-avoid mb-3">
                <ResultCard result={result} onOpen={() => setLightbox(result)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {results.length > 0 && !loading && (
        <div className="px-3 pb-3 pt-2 shrink-0" style={{ borderTop: "1px solid #1c1c1c" }}>
          <Link
            href="/gallery"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(124,58,237,0.08)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.12)" }}
          >
            <ExternalLink size={12} /> Xem Gallery
          </Link>
        </div>
      )}

      {/* CSS */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(16px)" }}
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/15"
            style={{ background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <X size={17} />
          </button>

          <div
            className="flex flex-col items-center gap-5 max-w-xl w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.outputUrl}
              alt={lightbox.featureName}
              className="rounded-2xl shadow-2xl"
              style={{ maxHeight: "78vh", maxWidth: "100%", objectFit: "contain" }}
            />
            <div className="flex items-center gap-3">
              <a
                href={lightbox.outputUrl}
                download={`pixelmind-${lightbox.id}.png`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:bg-white/15"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Download size={14} /> Tải về
              </a>
              <div className="text-xs mono text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
                {lightbox.featureName} · {lightbox.createdAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ── Card ────────────────────────────────────────────────────
function ResultCard({ result, onOpen }: { result: ResultItem; onOpen: () => void }) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Proxy qua server để tránh lỗi CORS khi load S3 URL trực tiếp
  const proxyUrl = `/api/image/${result.id}`;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(proxyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden group transition-all hover:-translate-y-0.5"
      style={{
        background: "#181818",
        border: "1px solid #272727",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      }}
    >
      {/* Image container */}
      <div
        className="relative w-full overflow-hidden cursor-pointer"
        style={{ aspectRatio: "3/4" }}
        onClick={onOpen}
      >
        {imgError ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: "#141414" }}
          >
            <ImageIcon size={20} style={{ color: "rgba(255,255,255,0.1)" }} />
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>Không hiển thị được</p>
            <button onClick={copyUrl} className="text-[10px] underline" style={{ color: "#a78bfa" }}>
              Copy URL
            </button>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proxyUrl}
            alt={result.featureName}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            onError={() => setImgError(true)}
          />
        )}

        {/* Hover overlay with zoom icon */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)" }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <ZoomIn size={18} color="white" />
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
            {result.featureName}
          </p>
          <p className="text-[10px] mono" style={{ color: "rgba(255,255,255,0.18)" }}>
            {result.createdAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={copyUrl}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            title="Copy URL"
          >
            {copied
              ? <Check size={12} style={{ color: "#22c55e" }} />
              : <Copy size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
            }
          </button>
          <a
            href={proxyUrl}
            download={`pixelmind-${result.id}.png`}
            onClick={e => e.stopPropagation()}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            title="Tải về"
          >
            <Download size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
          </a>
        </div>
      </div>
    </div>
  );
}
