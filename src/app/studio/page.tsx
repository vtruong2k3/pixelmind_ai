"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useStudioStore } from "@/store/studioStore";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import FeatureSidebar  from "@/components/studio/FeatureSidebar";
import FeaturePanel    from "@/components/studio/FeaturePanel";
import UploadZone      from "@/components/studio/UploadZone";
import PromptInput     from "@/components/studio/PromptInput";
import SizePresets     from "@/components/studio/SizePresets";
import ResultPanel     from "@/components/studio/ResultPanel";
import { FIcon }       from "@/components/studio/icons";

import { AI_FEATURES, CATEGORIES, FEATURE_PROMPTS, SIZE_PRESETS } from "@/lib/features";
import type { AIFeature, UploadedFile, ResultItem, SizePreset, JobQuality, JobOrientation } from "@/types/ui";
import { Zap, PanelLeftClose, PanelLeftOpen } from "lucide-react";

// ── Fetch active features từ DB — fallback sang static khi chưa load ────────
async function fetchStudioFeatures(): Promise<AIFeature[]> {
  const res = await fetch("/api/features");
  if (!res.ok) throw new Error();
  const data = await res.json();
  return (data.features ?? []).map((f: any) => ({
    slug:       f.slug,
    name:       f.name,
    desc:       f.description ?? "",
    category:   f.category,
    credits:    f.creditCost,
    imageCount: f.imageCount,
  } as AIFeature));
}

// ─────────────────────────────────────────────────────────────
// Drag-to-resize hook
// ─────────────────────────────────────────────────────────────
function useDragResize(
  initial: number,
  min: number,
  max: number,
  direction: "left" | "right" = "right"
) {
  const [width, setWidth] = useState(initial);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(initial);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = direction === "right"
        ? e.clientX - startX.current
        : startX.current - e.clientX;
      const next = Math.max(min, Math.min(max, startW.current + delta));
      setWidth(next);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [direction, min, max]);

  return { width, onMouseDown };
}

// ─────────────────────────────────────────────────────────────
// INNER STUDIO
// ─────────────────────────────────────────────────────────────
function StudioInner() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as any;
  const isAdmin: boolean = user?.isAdmin === true;
  const sessionCredits: number = user?.credits ?? 0;

  // Local credits — cập nhật ngay lập tức khi submit/fail/done
  const [localCredits, setLocalCredits] = useState<number>(sessionCredits);
  // Sync khi session thay đổi (login lần đầu, updateSession thành công)
  useEffect(() => { setLocalCredits(sessionCredits); }, [sessionCredits]);

  const credits = isAdmin ? 9999 : localCredits;
  const searchParams = useSearchParams();
  const initialSlug  = searchParams?.get("feature") ?? AI_FEATURES[0].slug;

  // ── Dynamic features từ DB (realtime khi admin thêm/sửa/xóa) ─────────────
  const { data: dbFeatures } = useQuery({
    queryKey: ["studio-features"],
    queryFn:  fetchStudioFeatures,
    staleTime: 60_000,
  });
  // Dùng DB features nếu có, fallback sang static khi loading
  const allFeatures: AIFeature[] = dbFeatures && dbFeatures.length > 0 ? dbFeatures : AI_FEATURES;

  // ── Zustand: persist prefs across navigation ────────────────
  const {
    activeFeatureSlug,    setActiveFeatureSlug,
    activeCategory,       setActiveCategory,
    quality,              setQuality,
    orientation,          setOrientation,
    selectedPresetIdx,    setSelectedPresetIdx,
    isPublic,             setIsPublic,
    featurePanelOpen,     setFeaturePanelOpen,
  } = useStudioStore();

  // Resolve feature object từ slug (ưu tiên ?feature= query, sau đó Zustand persisted slug)
  const activeFeature: AIFeature =
    allFeatures.find(f => f.slug === (searchParams?.get("feature") ?? activeFeatureSlug))
    ?? allFeatures.find(f => f.slug === activeFeatureSlug)
    ?? allFeatures[0]
    ?? AI_FEATURES[0]; // final fallback

  // ── Panel state ────────────────────────────────────────────
  const [mobileView, setMobileView] = useState<"form" | "result">("form");

  // ── Drag resize ────────────────────────────────────────────
  const featurePanel = useDragResize(260, 180, 380, "right");
  const resultPanel  = useDragResize(340, 240, 520, "left");

  // ── Uploads ────────────────────────────────────────────────
  const [image1, setImage1] = useState<UploadedFile | null>(null);
  const [image2, setImage2] = useState<UploadedFile | null>(null);

  // ── Prompt (local — reset khi đổi feature) ─────────────────
  const [prompt, setPrompt] = useState<string>(FEATURE_PROMPTS[activeFeature.slug] ?? "");

  // ── Custom size (local — không cần persist) ─────────────────
  const [isCustomSize, setIsCustomSize] = useState<boolean>(false);
  const [customW, setCustomW]           = useState<number>(1024);
  const [customH, setCustomH]           = useState<number>(1536);

  // ── Results ────────────────────────────────────────────────
  const [results, setResults]   = useState<ResultItem[]>([]);
  const [loading, setLoading]   = useState<boolean>(false);

  // ── Handlers ───────────────────────────────────────────────
  const switchFeature = (f: AIFeature) => {
    setActiveFeatureSlug(f.slug); // persist vào Zustand
    setImage1(null);
    setImage2(null);
    setPrompt(FEATURE_PROMPTS[f.slug] ?? "");
  };

  const makeUploadHandler = useCallback(
    (setter: React.Dispatch<React.SetStateAction<UploadedFile | null>>) =>
      (file: File) => setter({ file, preview: URL.createObjectURL(file) }),
    []
  );

  const selectPreset = (i: number) => {
    const preset: SizePreset = SIZE_PRESETS[i];
    setSelectedPresetIdx(i);  // persist vào Zustand
    setIsCustomSize(false);
    setCustomW(preset.w);
    setCustomH(preset.h);
    setOrientation(preset.orientation); // persist vào Zustand
  };

  const handleGenerate = async () => {
    if (!image1) { toast.error("Vui lòng upload ảnh chính."); return; }
    setLoading(true);
    setMobileView("result");

    try {
      const preset = SIZE_PRESETS[selectedPresetIdx];
      const w = isCustomSize ? customW : preset.w;
      const h = isCustomSize ? customH : preset.h;

      const formData = new FormData();
      formData.append("featureSlug", activeFeature.slug);
      formData.append("prompt",      prompt || (FEATURE_PROMPTS[activeFeature.slug] ?? ""));
      formData.append("quality",     quality);
      formData.append("orientation", orientation);
      formData.append("width",       String(w));
      formData.append("height",      String(h));
      formData.append("isPublic",    String(isPublic));
      formData.append("image",       image1.file);
      if (image2) formData.append("image_2", image2.file);

      // Step 1: Submit — trả về jobId ngay trong <2 giây
      const res  = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json() as { jobId?: string; taskId?: string; error?: string };

      if (!res.ok || data.error) {
        if (res.status === 402) {
          toast.error("Không đủ credits. Đang chuyển đến trang nạp credits...");
          setTimeout(() => { window.location.href = "/pricing"; }, 1500);
        } else {
          toast.error(data.error ?? "Lỗi tạo ảnh. Vui lòng thử lại.");
        }
        return;
      }

      const jobId = data.jobId;
      if (!jobId) { toast.error("Không nhận được jobId."); return; }

      // Trừ credits ngay trên UI (không đợi session refresh)
      const cost = activeFeature.credits;
      setLocalCredits(prev => Math.max(0, prev - cost));
      updateSession(); // refresh Navbar sau

      // Step 2: Poll status mỗi 3 giây cho đến khi xong
      const MAX_POLLS = 100; // 100 × 3s = 5 phút
      let doneNoUrlRetries = 0;

      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise(r => setTimeout(r, 3000));

        let statusData: { status: string; outputUrl?: string; error?: string } = { status: "PROCESSING" };
        try {
          const statusRes = await fetch(`/api/generate/status?jobId=${jobId}`);
          statusData = await statusRes.json();
        } catch (fetchErr) {
          console.warn(`[poll ${i + 1}] Network error, retrying...`, fetchErr);
          continue;
        }

        console.log(`[poll ${i + 1}] status=${statusData.status} outputUrl=${statusData.outputUrl ?? "none"}`);

        if (statusData.status === "COMPLETED") {
          if (statusData.outputUrl) {
            setResults(prev => [{
              id:          jobId,
              outputUrl:   statusData.outputUrl!,
              featureName: activeFeature.name,
              featureSlug: activeFeature.slug,
              createdAt:   new Date(),
            }, ...prev]);
            toast.success("Ảnh đã tạo xong! ✦");
            // Cập nhật credits trong session mà không cần F5
            await updateSession();
            return;
          } else {
            doneNoUrlRetries++;
            console.warn(`[poll ${i + 1}] status=COMPLETED nhưng outputUrl rỗng (retry ${doneNoUrlRetries}/3)`);
            if (doneNoUrlRetries >= 3) {
              toast.error("Ảnh đã xong nhưng không thể tải. Vui lòng xem lại Lịch sử.");
              return;
            }
            continue;
          }
        }

        if (statusData.status === "FAILED") {
          toast.error(statusData.error ?? "Tạo ảnh thất bại.");
          // Hoàn credits lại trên UI ngay lập tức
          setLocalCredits(prev => prev + activeFeature.credits);
          await updateSession();
          return;
        }
      }

      toast.error("Hết thời gian chờ. Vui lòng thử lại.");
    } catch (err) {
      toast.error("Lỗi kết nối. Vui lòng kiểm tra mạng.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeatures = activeCategory === "all"
    ? allFeatures
    : allFeatures.filter(f => f.category === activeCategory);

  const currentW = isCustomSize ? customW : (SIZE_PRESETS[selectedPresetIdx]?.w ?? 1024);
  const currentH = isCustomSize ? customH : (SIZE_PRESETS[selectedPresetIdx]?.h ?? 1536);

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", overflow: "hidden", background: "#0a0a0a" }}
    >
      <Navbar />

      {/* ── Desktop layout ── */}
      <div
        className="hidden lg:flex flex-1 min-h-0 overflow-hidden"
      >
        {/* Col 1 — Category icon sidebar */}
        <FeatureSidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Col 2 — Feature list (collapsible + resizable) */}
        {featurePanelOpen && (
          <>
            <div
              className="shrink-0 overflow-y-auto relative studio-scroll"
              style={{ width: featurePanel.width, minHeight: 0, background: "#0f0f0f", borderRight: "1px solid #1c1c1c" }}
            >
              {/* Close button */}
              <button
                onClick={() => setFeaturePanelOpen(false)}
                className="absolute top-3 right-2 z-10 w-6 h-6 rounded-lg flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: "rgba(255,255,255,0.6)" }}
                title="Ẩn danh sách tính năng"
              >
                <PanelLeftClose size={14} />
              </button>

              <FeaturePanel
                features={filteredFeatures}
                activeSlug={activeFeature.slug}
                onSelect={switchFeature}
              />
            </div>

            {/* Drag handle (resize) */}
            <div
              onMouseDown={featurePanel.onMouseDown}
              className="shrink-0 flex items-center justify-center hover:bg-white/5 transition-colors cursor-col-resize group"
              style={{ width: "4px", background: "#1c1c1c" }}
            >
              <div className="w-0.5 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "#a78bfa" }} />
            </div>
          </>
        )}

        {/* Open feature panel button (when closed) */}
        {!featurePanelOpen && (
          <button
            onClick={() => setFeaturePanelOpen(true)}
            className="shrink-0 flex items-center justify-center w-7 hover:bg-white/5 transition-colors group"
            style={{ borderRight: "1px solid #1c1c1c" }}
            title="Mở danh sách tính năng"
          >
            <PanelLeftOpen size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
          </button>
        )}

        {/* Col 3 — Workspace */}
        <main className="flex-1 min-h-0 overflow-y-auto min-w-0 studio-scroll">
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
            style={{ borderBottom: "1px solid #1c1c1c", background: "#0a0a0a" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: "38px", height: "38px", background: "rgba(180,167,214,0.1)" }}
              >
                <FIcon slug={activeFeature.slug} size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">{activeFeature.name}</div>
                <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{activeFeature.desc}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold mono"
                style={{ background: "rgba(180,167,214,0.08)", border: "1px solid rgba(180,167,214,0.12)", color: "#a78bfa" }}
              >
                <Zap size={10} />
                {activeFeature.credits} credits
              </div>
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold mono"
                style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", color: "#22c55e" }}
              >
                <Zap size={10} />
                {isAdmin ? "∞" : credits} còn lại
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-6 pb-32">
            {/* Upload zones */}
            <div className={`grid gap-4 ${activeFeature.imageCount === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
              <UploadZone label="Ảnh chính" file={image1} onFile={makeUploadHandler(setImage1)} onClear={() => setImage1(null)} />
              {activeFeature.imageCount === 2 && (
                <UploadZone label="Ảnh tham chiếu" file={image2} onFile={makeUploadHandler(setImage2)} onClear={() => setImage2(null)} />
              )}
            </div>

            <PromptInput featureSlug={activeFeature.slug} value={prompt} onChange={setPrompt} />

            {/* Quality */}
            <div>
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 mono">Quality</p>
              <div className="flex gap-2">
                {(["sd", "hd"] as const).map((q: JobQuality) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className="px-5 py-2 rounded-lg text-sm font-bold uppercase mono transition-all"
                    style={
                      quality === q
                        ? { border: "1px solid #a78bfa", color: "#a78bfa", background: "rgba(167,139,250,0.08)" }
                        : { border: "1px solid #2a2a2a", color: "rgba(255,255,255,0.3)", background: "transparent" }
                    }
                  >
                    {q}{q === "hd" && <span className="ml-1 text-[9px] opacity-60">2×</span>}
                  </button>
                ))}
              </div>
            </div>

            <SizePresets
              selectedIndex={selectedPresetIdx}
              isCustom={isCustomSize}
              customW={customW}
              customH={customH}
              orientation={orientation}
              onSelectPreset={selectPreset}
              onCustom={() => setIsCustomSize(true)}
              onCustomWChange={setCustomW}
              onCustomHChange={setCustomH}
              onOrientationChange={setOrientation}
            />

            {/* Public toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Chia sẻ công khai</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Ảnh xuất hiện trong Gallery</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className="relative inline-flex items-center rounded-full transition-all"
                style={{ width: "44px", height: "24px", background: isPublic ? "#a78bfa" : "#2a2a2a" }}
              >
                <span
                  className="absolute rounded-full bg-white shadow transition-transform"
                  style={{ width: "18px", height: "18px", transform: `translateX(${isPublic ? "23px" : "3px"})` }}
                />
              </button>
            </div>

            <p className="text-[11px] mono" style={{ color: "rgba(255,255,255,0.18)" }}>
              Output: {currentW} × {currentH}px · {quality.toUpperCase()} · {orientation}
            </p>
          </div>

          {/* Generate button (sticky bottom) */}
          <div className="sticky bottom-0 px-6 pb-6 pt-3" style={{ background: "linear-gradient(to top, #0a0a0a 70%, transparent)" }}>
            <button
              onClick={handleGenerate}
              disabled={loading || !image1}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: loading ? "#1a1a1a" : "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
                boxShadow: loading ? "none" : "0 4px 24px rgba(124,58,237,0.4)",
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  AI đang xử lý... 
                </>
              ) : (
                <>
                  <Zap size={15} />
                  Tạo ảnh
                </>
              )}
            </button>
          </div>
        </main>

        {/* Drag handle (resize result panel) */}
        <div
          onMouseDown={resultPanel.onMouseDown}
          className="shrink-0 flex items-center justify-center hover:bg-white/5 transition-colors cursor-col-resize group"
          style={{ width: "4px", background: "#1c1c1c" }}
        >
          <div className="w-0.5 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "#a78bfa" }} />
        </div>

        {/* Col 4 — Result panel (resizable) */}
        <div style={{ width: resultPanel.width }}>
          <ResultPanel results={results} loading={loading} />
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="lg:hidden flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b shrink-0" style={{ borderColor: "#1c1c1c", background: "#0a0a0a" }}>
          {(["form", "result"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setMobileView(tab)}
              className="flex-1 py-3 text-xs font-bold uppercase mono tracking-widest transition-colors"
              style={mobileView === tab
                ? { color: "#a78bfa", borderBottom: "2px solid #a78bfa" }
                : { color: "rgba(255,255,255,0.3)", borderBottom: "2px solid transparent" }
              }
            >
              {tab === "form" ? `✦ ${activeFeature.name}` : `Kết quả${results.length ? ` · ${results.length}` : ""}`}
            </button>
          ))}
        </div>

        {/* Mobile — Feature select pill */}
        {mobileView === "form" && (
          <div className="shrink-0 px-4 py-2 flex gap-2 overflow-x-auto" style={{ background: "#0f0f0f", borderBottom: "1px solid #1c1c1c" }}>
            {AI_FEATURES.map(f => (
              <button
                key={f.slug}
                onClick={() => switchFeature(f)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={activeFeature.slug === f.slug
                  ? { background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }
                  : { background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                <FIcon slug={f.slug} size={12} />
                {f.name}
              </button>
            ))}
          </div>
        )}

        {/* Mobile — Form view */}
        {mobileView === "form" && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 flex flex-col gap-5 pb-32">
              <div className={`grid gap-3 ${activeFeature.imageCount === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                <UploadZone label="Ảnh chính" file={image1} onFile={makeUploadHandler(setImage1)} onClear={() => setImage1(null)} />
                {activeFeature.imageCount === 2 && (
                  <UploadZone label="Ảnh tham chiếu" file={image2} onFile={makeUploadHandler(setImage2)} onClear={() => setImage2(null)} />
                )}
              </div>
              <PromptInput featureSlug={activeFeature.slug} value={prompt} onChange={setPrompt} />
              {/* Quality */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Chất lượng</p>
                <div className="flex gap-2">
                  {(["sd", "hd"] as const).map(q => (
                    <button key={q} onClick={() => setQuality(q)}
                      className="px-4 py-2 rounded-lg text-sm font-bold uppercase mono transition-all"
                      style={quality === q
                        ? { border: "1px solid #a78bfa", color: "#a78bfa", background: "rgba(167,139,250,0.08)" }
                        : { border: "1px solid #2a2a2a", color: "rgba(255,255,255,0.3)", background: "transparent" }
                      }>
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size + Orientation */}
              <SizePresets
                selectedIndex={selectedPresetIdx}
                isCustom={isCustomSize}
                customW={customW}
                customH={customH}
                orientation={orientation}
                onSelectPreset={(i) => { setSelectedPresetIdx(i); setIsCustomSize(false); }}
                onCustom={() => setIsCustomSize(true)}
                onCustomWChange={setCustomW}
                onCustomHChange={setCustomH}
                onOrientationChange={setOrientation}
              />

              {/* Public toggle */}
              <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: "#1c1c1c" }}>
                <div>
                  <p className="text-sm font-semibold text-white">Chia sẻ công khai</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Ảnh xuất hiện trong Gallery</p>
                </div>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className="relative rounded-full transition-colors shrink-0 overflow-hidden"
                  style={{ width: "44px", height: "24px", background: isPublic ? "#a78bfa" : "#2a2a2a" }}
                >
                  <span className="absolute rounded-full bg-white shadow transition-all duration-200"
                    style={{ width: "18px", height: "18px", top: "3px", left: isPublic ? "23px" : "3px" }} />
                </button>
              </div>
            </div>

            <div className="sticky bottom-0 px-4 pb-4 pt-2" style={{ background: "linear-gradient(to top, #0a0a0a 70%, transparent)" }}>
              <button
                onClick={handleGenerate}
                disabled={loading || !image1}
                className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: loading ? "#1a1a1a" : "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)", boxShadow: "0 4px 24px rgba(124,58,237,0.3)" }}
              >
                {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />Đang xử lý...</> : <><Zap size={14} />Tạo ảnh · {activeFeature.credits} credits</>}
              </button>
            </div>
          </div>
        )}

        {/* Mobile — Result view */}
        {mobileView === "result" && (
          <div className="flex-1 overflow-hidden">
            <ResultPanel results={results} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense>
      <StudioInner />
    </Suspense>
  );
}
