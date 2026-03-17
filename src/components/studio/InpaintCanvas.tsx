"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface InpaintDialogProps {
  open: boolean;
  imageSrc: string;
  onClose: (maskDataUrl: string | null) => void;
}

const ACCENT = "#7c3aed";
const MASK_COLOR = "rgba(124, 58, 237, 0.45)";

export default function InpaintDialog({ open, imageSrc, onClose }: InpaintDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [brushSize, setBrushSize] = useState(20);
  const [zoom, setZoom] = useState(100);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const historyRef = useRef<ImageData[]>([]);

  /* ── Load image ── */
  useEffect(() => {
    if (!open || !imageSrc) return;
    setCanvasReady(false);
    const img = new Image();
    img.onload = () => {
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setZoom(100);
      setCanvasReady(true);
      historyRef.current = [];
    };
    img.src = imageSrc;
  }, [open, imageSrc]);

  /* ── Resize canvas on zoom ── */
  useEffect(() => {
    if (!canvasReady || imgNatural.w === 0) return;
    const container = containerRef.current;
    if (!container) return;
    const maxW = container.clientWidth - 32;
    const maxH = container.clientHeight - 32;
    const scale = Math.min(maxW / imgNatural.w, maxH / imgNatural.h) * (zoom / 100);
    const w = Math.round(imgNatural.w * scale);
    const h = Math.round(imgNatural.h * scale);
    setDisplaySize({ w, h });
    const canvas = canvasRef.current;
    if (canvas && (canvas.width !== w || canvas.height !== h)) {
      const oldData = canvas.width > 0 && canvas.height > 0
        ? canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height) : null;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx && oldData) {
        const tc = document.createElement("canvas");
        tc.width = oldData.width; tc.height = oldData.height;
        tc.getContext("2d")!.putImageData(oldData, 0, 0);
        ctx.drawImage(tc, 0, 0, w, h);
      }
    }
  }, [canvasReady, imgNatural, zoom]);

  /* ── Drawing ── */
  const saveSnapshot = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    historyRef.current.push(ctx.getImageData(0, 0, c.width, c.height));
    if (historyRef.current.length > 40) historyRef.current.shift();
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: cx - r.left, y: cy - r.top };
  };

  const drawAt = useCallback((x: number, y: number) => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const sz = brushSize * (zoom / 100);
    ctx.beginPath(); ctx.arc(x, y, sz / 2, 0, Math.PI * 2);
    if (tool === "brush") {
      ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = MASK_COLOR;
    } else {
      ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = "rgba(0,0,0,1)";
    }
    ctx.fill();
  }, [tool, brushSize, zoom]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); saveSnapshot(); setIsDrawing(true);
    const p = getPos(e); drawAt(p.x, p.y);
  };
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return; e.preventDefault();
    const p = getPos(e); drawAt(p.x, p.y);
  };
  const handleEnd = () => setIsDrawing(false);

  const handleUndo = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const h = historyRef.current;
    if (h.length > 0) { h.pop(); h.length > 0 ? ctx.putImageData(h[h.length - 1], 0, 0) : ctx.clearRect(0, 0, c.width, c.height); }
  };

  const handleClearAll = () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    saveSnapshot(); ctx.clearRect(0, 0, c.width, c.height);
  };

  const handleOK = () => {
    const c = canvasRef.current; if (!c) { onClose(null); return; }
    const ctx = c.getContext("2d"); if (!ctx) { onClose(null); return; }
    const d = ctx.getImageData(0, 0, c.width, c.height);
    const empty = !d.data.some((_v, i) => i % 4 === 3 && d.data[i] > 0);
    onClose(empty ? null : c.toDataURL("image/png"));
  };

  const handleDownload = () => {
    const c = canvasRef.current; if (!c) return;
    const a = document.createElement("a");
    a.download = "inpaint-mask.png"; a.href = c.toDataURL("image/png"); a.click();
  };

  /* ── Keyboard ── */
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); handleUndo(); }
      if (e.key === "Escape") onClose(null);
      if (e.key === "b") setTool("brush");
      if (e.key === "e") setTool("eraser");
      if (e.key === "[") setBrushSize(s => Math.max(4, s - 4));
      if (e.key === "]") setBrushSize(s => Math.min(80, s + 4));
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Scroll zoom ── */
  useEffect(() => {
    if (!open) return;
    const el = containerRef.current; if (!el) return;
    const fn = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(z => Math.max(25, Math.min(400, z + (e.deltaY < 0 ? 10 : -10)))); }
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, [open]);

  if (!open) return null;

  const csz = Math.max(8, brushSize * (zoom / 100));
  const cursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${csz}' height='${csz}'%3E%3Ccircle cx='${csz/2}' cy='${csz/2}' r='${csz/2-1}' fill='none' stroke='%237c3aed' stroke-width='2'/%3E%3C/svg%3E") ${csz/2} ${csz/2}, crosshair`;

  return (
    <>
      {/* ── Backdrop ── */}
      <div onClick={() => onClose(null)} style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      }} />

      {/* ── Dialog ── */}
      <div style={{
        position: "fixed", zIndex: 9999,
        top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "min(94vw, 1200px)", height: "min(90vh, 800px)",
        display: "flex", flexDirection: "column",
        background: "#111418",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.1)",
        overflow: "hidden",
        animation: "inpaint-pop 0.2s ease-out",
      }}>
        <style>{`@keyframes inpaint-pop { from { opacity:0; transform:translate(-50%,-50%) scale(0.96); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }`}</style>

        {/* ── Header ── */}
        <div style={{
          padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "linear-gradient(180deg, rgba(124,58,237,0.06) 0%, transparent 100%)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "#fff",
            }}>✦</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>Inpaint</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Draw mask on the area to edit</span>
          </div>
          <button onClick={() => onClose(null)} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.4)", width: 30, height: 30, borderRadius: 8,
            fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}>✕</button>
        </div>

        {/* ── Canvas area ── */}
        <div ref={containerRef} style={{
          flex: 1, overflow: "auto", display: "flex",
          alignItems: "center", justifyContent: "center",
          position: "relative", padding: 20,
          background: "radial-gradient(ellipse at center, #0F1318 0%, #080B0F 100%)",
          margin: "0 2px",
        }}>
          {/* Help badge */}
          <div style={{
            position: "absolute", top: 12, left: 12, zIndex: 10,
            background: "rgba(0,0,0,0.6)", borderRadius: 8,
            padding: "6px 10px", fontSize: 10, color: "rgba(255,255,255,0.35)",
            lineHeight: 1.6, pointerEvents: "none",
            border: "1px solid rgba(255,255,255,0.04)",
          }}>
            Ctrl + Scroll = Zoom &nbsp;|&nbsp; B = Brush &nbsp; E = Eraser &nbsp; [ ] = Size
          </div>

          {/* Image + Canvas */}
          {canvasReady && (
            <div style={{
              position: "relative", width: displaySize.w, height: displaySize.h, flexShrink: 0,
              borderRadius: 6, overflow: "hidden",
              boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
            }}>
              <img src={imageSrc} alt="Inpaint" draggable={false}
                style={{ width: displaySize.w, height: displaySize.h, display: "block", objectFit: "contain" }}
              />
              <canvas ref={canvasRef}
                style={{
                  position: "absolute", top: 0, left: 0,
                  width: displaySize.w, height: displaySize.h,
                  cursor, touchAction: "none",
                }}
                onMouseDown={handleStart} onMouseMove={handleMove}
                onMouseUp={handleEnd} onMouseLeave={handleEnd}
                onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
              />
            </div>
          )}

          {/* ── Floating toolbar ── */}
          <div style={{
            position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 1,
            background: "rgba(17,20,24,0.95)", borderRadius: 10, padding: "3px 4px",
            border: "1px solid rgba(255,255,255,0.08)", zIndex: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          }}>
            <TBtn active={tool === "brush"} onClick={() => setTool("brush")} tip="Brush (B)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/>
                <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/><path d="M14.5 17.5 4.5 15"/>
              </svg>
            </TBtn>
            <TBtn active={tool === "eraser"} onClick={() => setTool("eraser")} tip="Eraser (E)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
                <path d="M22 21H7"/><path d="m5 11 9 9"/>
              </svg>
            </TBtn>

            <Sep />

            <TBtn onClick={() => setBrushSize(s => Math.max(4, s - 4))} tip="−">−</TBtn>
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 600, minWidth: 32, textAlign: "center", userSelect: "none" }}>{brushSize}px</span>
            <TBtn onClick={() => setBrushSize(s => Math.min(80, s + 4))} tip="+">+</TBtn>

            <Sep />

            <TBtn onClick={() => setZoom(z => Math.max(25, z - 10))} tip="Zoom out">−</TBtn>
            <span style={{
              fontSize: 11, color: ACCENT, fontWeight: 700, minWidth: 36, textAlign: "center",
              padding: "2px 4px", background: "rgba(124,58,237,0.1)", borderRadius: 5, userSelect: "none",
            }}>{zoom}%</span>
            <TBtn onClick={() => setZoom(z => Math.min(400, z + 10))} tip="Zoom in">+</TBtn>

            <Sep />

            <TBtn onClick={handleUndo} tip="Undo (Ctrl+Z)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
              </svg>
            </TBtn>
            <TBtn onClick={handleDownload} tip="Download">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </TBtn>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "12px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}>
          <button onClick={handleClearAll} style={{
            padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.15s",
          }}>Clear All</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onClose(null)} style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)", cursor: "pointer",
            }}>Cancel</button>
            <button onClick={handleOK} style={{
              padding: "8px 32px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: `linear-gradient(135deg, ${ACCENT}, #6d28d9)`,
              border: "none", color: "#fff", cursor: "pointer",
              boxShadow: `0 2px 16px rgba(124,58,237,0.35)`,
              transition: "opacity 0.15s, box-shadow 0.15s",
            }}>OK</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Toolbar button ── */
function TBtn({ children, active, onClick, tip }: {
  children: React.ReactNode; active?: boolean; onClick?: () => void; tip?: string;
}) {
  return (
    <button onClick={onClick} title={tip} style={{
      width: 28, height: 28, borderRadius: 7,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: active ? ACCENT : "transparent",
      border: "none", color: active ? "#fff" : "rgba(255,255,255,0.5)",
      cursor: "pointer", fontSize: 14, fontWeight: 700,
      transition: "background 0.15s, color 0.15s",
    }}>{children}</button>
  );
}

/* ── Separator ── */
function Sep() {
  return <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", margin: "0 3px" }} />;
}
