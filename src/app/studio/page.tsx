"use client";

import { useState, useCallback, useEffect, Suspense, useRef } from "react";
import { useStudioStore } from "@/store/studioStore";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import AppSidebar from "@/components/studio/AppSidebar";
import StudioTabs from "@/components/studio/StudioTabs";
import type { StudioMode } from "@/components/studio/StudioTabs";
import TemplatesGrid from "@/components/studio/TemplatesGrid";
import StudioUploadZone from "@/components/studio/StudioUploadZone";
import PromptArea from "@/components/studio/PromptArea";
import SettingsRow, { ImageSettingsRow, VideoEditorSettingsRow } from "@/components/studio/SettingsRow";
import InpaintDialog from "@/components/studio/InpaintCanvas";
import { SidebarContent } from "@/components/studio/AppSidebar";
import { FIcon } from "@/components/studio/icons";

import { AI_FEATURES, FEATURE_PROMPTS, SIZE_PRESETS } from "@/lib/features";
import type { AIFeature, UploadedFile, ResultItem } from "@/types/ui";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

/* ══════════════════════════════════════════════════
 * COLOR CONSTANTS — matching Deevid.ai exact palette
 * ══════════════════════════════════════════════════*/
const C = {
  pageBg: "#060A0C",
  panelBg: "#0C1015",
  panelBorder: "#252D36",
  uploadBg: "#151A1F",
  uploadBrd: "#2E3740",
  textPrimary: "rgba(255,255,255,0.9)",
  textSecond: "rgba(255,255,255,0.45)",
  textMuted: "rgba(255,255,255,0.25)",
  accent: "#7c3aed",
  accentHover: "#6d28d9",
  accentLight: "#a78bfa",
  ctaGradient: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
  ctaGradientHover: "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)",
  inputBg: "#0C1015",
  inputBorder: "#252D36",
};

// ── Fetch active features từ DB ───────────────────
async function fetchStudioFeatures(): Promise<AIFeature[]> {
  const res = await fetch("/api/features");
  if (!res.ok) throw new Error();
  const data = await res.json();
  return (data.features ?? []).map((f: any) => ({
    slug: f.slug, name: f.name, desc: f.description ?? "",
    category: f.category, credits: f.creditCost, imageCount: f.imageCount,
  } as AIFeature));
}

// ─────────────────────────────────────────────────
function StudioInner() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user;
  const isAdmin: boolean = user?.role === "ADMIN";
  const sessionCredits: number = user?.credits ?? 0;
  const [localCredits, setLocalCredits] = useState<number>(sessionCredits);
  useEffect(() => { setLocalCredits(sessionCredits); }, [sessionCredits]);
  const credits = isAdmin ? 9999 : localCredits;
  const searchParams = useSearchParams();

  const { data: dbFeatures } = useQuery({
    queryKey: ["studio-features"],
    queryFn: fetchStudioFeatures,
    staleTime: 60_000,
  });
  const allFeatures: AIFeature[] = dbFeatures && dbFeatures.length > 0 ? dbFeatures : AI_FEATURES;

  const {
    activeFeatureSlug, setActiveFeatureSlug,
    quality, setQuality,
    orientation, setOrientation,
    selectedPresetIdx, setSelectedPresetIdx,
    isPublic, setIsPublic,
  } = useStudioStore();

  const activeFeature: AIFeature =
    allFeatures.find(f => f.slug === (searchParams?.get("feature") ?? activeFeatureSlug))
    ?? allFeatures.find(f => f.slug === activeFeatureSlug)
    ?? allFeatures[0] ?? AI_FEATURES[0];

  const [studioMode, setStudioMode] = useState<StudioMode>("start_image");
  const [sidebarActiveId, setSidebarActiveId] = useState("image_to_video");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsQuality, setSettingsQuality] = useState("sd");
  const [settingsResolution, setSettingsResolution] = useState("720");
  const [settingsDuration, setSettingsDuration] = useState("5");
  const [settingsRatio, setSettingsRatio] = useState("16:9");

  /* AI Image specific state */
  const [aiImageMode, setAiImageMode] = useState<"image_to_image" | "text_to_image" | "templates">("image_to_image");
  const [imgModel, setImgModel] = useState("nano_banana_2");
  const [imgRatio, setImgRatio] = useState("1:1");
  const [imgResolution, setImgResolution] = useState("2k");
  const [imgOutputs, setImgOutputs] = useState("1");
  const [inpaintTool, setInpaintTool] = useState<"brush" | "eraser" | null>("brush");
  const [inpaintOpen, setInpaintOpen] = useState(false);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);

  /* AI Video Editor specific state */
  const [vidEditorVersion, setVidEditorVersion] = useState("v1");
  const [vidEditorResolution, setVidEditorResolution] = useState("720");

  const [image1, setImage1] = useState<UploadedFile | null>(null);
  const [image2, setImage2] = useState<UploadedFile | null>(null);
  const [preview1, setPreview1] = useState("");
  const [preview2, setPreview2] = useState("");
  const [prompt, setPrompt] = useState<string>(FEATURE_PROMPTS[activeFeature.slug] ?? "");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileView, setMobileView] = useState<"form" | "result">("form");
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (dir: "left" | "right") => {
    carouselRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  const switchFeature = (f: AIFeature) => {
    setActiveFeatureSlug(f.slug);
    setImage1(null); setImage2(null);
    setPreview1(""); setPreview2("");
    setPrompt(FEATURE_PROMPTS[f.slug] ?? "");
  };

  const handleSelectTemplate = (f: AIFeature, templatePrompt: string) => {
    switchFeature(f);
    setPrompt(templatePrompt);
    setStudioMode("start_image");
  };

  const handleFile1 = (f: File | null) => {
    if (f) { setImage1({ file: f, preview: URL.createObjectURL(f) }); setPreview1(URL.createObjectURL(f)); }
    else { setImage1(null); setPreview1(""); }
  };
  const handleFile2 = (f: File | null) => {
    if (f) { setImage2({ file: f, preview: URL.createObjectURL(f) }); setPreview2(URL.createObjectURL(f)); }
    else { setImage2(null); setPreview2(""); }
  };

  const handleGenerate = async () => {
    if (!session?.user) {
      toast.error("Vui lòng đăng nhập.");
      setTimeout(() => { window.location.href = `/login?callbackUrl=/studio?feature=${activeFeature.slug}`; }, 1500);
      return;
    }
    if (activeFeature.imageCount > 0 && !image1) { toast.error("Vui lòng upload ảnh."); return; }
    setLoading(true);

    try {
      const preset = SIZE_PRESETS[selectedPresetIdx];
      const formData = new FormData();
      formData.append("featureSlug", activeFeature.slug);
      formData.append("prompt", prompt || (FEATURE_PROMPTS[activeFeature.slug] ?? ""));
      formData.append("quality", settingsQuality === "sd" ? "sd" : "hd");
      formData.append("orientation", orientation);
      formData.append("width", String(preset?.w ?? 1024));
      formData.append("height", String(preset?.h ?? 1536));
      formData.append("isPublic", String(isPublic));
      if (image1) formData.append("image", image1.file);
      if (image2) formData.append("image_2", image2.file);

      const res = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await res.json() as { jobId?: string; error?: string };
      if (!res.ok || data.error) {
        if (res.status === 402) { toast.error("Hết credits."); setTimeout(() => { window.location.href = "/pricing"; }, 1500); }
        else toast.error(data.error ?? "Lỗi.");
        return;
      }
      const jobId = data.jobId;
      if (!jobId) { toast.error("Không có jobId."); return; }
      setLocalCredits(prev => Math.max(0, prev - activeFeature.credits));
      updateSession();

      for (let i = 0; i < 100; i++) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const sr = await fetch(`/api/generate/status?jobId=${jobId}`);
          const sd = await sr.json();
          if (sd.status === "COMPLETED" && sd.outputUrl) {
            setResults(prev => [{ id: jobId, outputUrl: sd.outputUrl, featureName: activeFeature.name, featureSlug: activeFeature.slug, createdAt: new Date() }, ...prev]);
            toast.success("Ảnh đã tạo xong! ✦");
            await updateSession(); return;
          }
          if (sd.status === "FAILED") { toast.error(sd.error ?? "Thất bại."); setLocalCredits(p => p + activeFeature.credits); return; }
        } catch { }
      }
      toast.error("Hết thời gian.");
    } catch { toast.error("Lỗi kết nối."); } finally { setLoading(false); }
  };

  const latest = results[0];

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <>
      <div style={{ height: "100dvh", overflow: "hidden", background: C.pageBg, display: "flex", flexDirection: "column" }}>
        {/* Navbar */}
        <Navbar />

        {/* ═══ DESKTOP ═══ */}
        <div className="hidden lg:flex" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* Sidebar */}
          <AppSidebar activeId={sidebarActiveId} onSelectItem={setSidebarActiveId} />
          {/* Main — 2 panels */}
          <div style={{ flex: 1, display: "flex", gap: 16, padding: 16, minHeight: 0, overflow: "hidden" }}>

            {/* ─── LEFT PANEL ─── */}
            {(() => {
              /* Derive layout mode from sidebar */
              const isTextToVideo = sidebarActiveId === "text_to_video";
              const isImageToVideo = sidebarActiveId === "image_to_video";
              const isAIImage = sidebarActiveId === "ai_image";
              const isAIImageEditor = sidebarActiveId === "ai_image_editor";
              const isAIVideoEditor = sidebarActiveId === "ai_video_editor";
              const SIDEBAR_TITLES: Record<string, string> = {
                image_to_video: "Image to Video AI",
                text_to_video: "Text to Video AI",
                ai_image: "AI Image Generator",
                ai_image_editor: "AI Image Editor",
                ai_video_editor: "AI Video Editor",
                ai_avatar: "AI Avatar",
                ai_music: "AI Music",
                text_to_speech: "Text To Speech",
              };
              const panelTitle = SIDEBAR_TITLES[sidebarActiveId] || activeFeature.name;

              /* Determine what to show */
              const showVideoTabs = isImageToVideo;
              const showAIImageTabs = isAIImage;
              const isRefImages = isImageToVideo && studioMode === "templates";
              const showUpload = isImageToVideo
                || (isAIImage && aiImageMode === "image_to_image")
                || isAIImageEditor
                || isAIVideoEditor;
              const showTemplates = (isAIImage && aiImageMode === "templates");
              const showPrompt = !showTemplates;
              const showSettings = !showTemplates && !isAIImageEditor;

              const promptPlaceholder = isTextToVideo
                ? "Please describe the video content. Master model supports audio generation, you can add sounds or dialogue to your prompt"
                : isAIImage
                  ? "Upload reference images and describe how you'd like to generate or edit using them."
                  : isAIImageEditor
                    ? "Describe your edits (add, remove, replace). Use the brush to mark areas or upload a reference image to specify changes."
                    : isAIVideoEditor
                      ? "Describe your edits (add, remove, replace). Use the brush to mark areas or upload a reference image to specify changes."
                      : isRefImages
                        ? "Describe how the reference image becomes a video scene."
                        : studioMode === "between_images"
                          ? "Describe how the reference image becomes a video scene."
                          : "Describe the video content generated from this image.";

              /* AI Image tab config */
              const AI_IMAGE_TABS = [
                { id: "image_to_image" as const, label: "Image to Image", badge: "" },
                { id: "text_to_image" as const, label: "Text to Image", badge: "" },
                { id: "templates" as const, label: "Templates", badge: "Hot" },
              ];

              return (
                <div style={{
                  width: "40%", minWidth: 360, maxWidth: 500,
                  background: C.panelBg,
                  border: `1px solid ${C.panelBorder}`,
                  borderRadius: 18,
                  display: "flex", flexDirection: "column",
                  overflow: "hidden",
                }}>
                  {/* Scrollable content */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px 8px" }} className="studio-scroll">
                    {/* Title */}
                    <h1 style={{ fontSize: 17, fontWeight: 700, color: C.textPrimary, margin: "0 0 10px" }}>
                      {panelTitle}
                    </h1>

                    {/* Video Tabs — only for Image to Video */}
                    {showVideoTabs && <StudioTabs active={studioMode} onChange={setStudioMode} />}

                    {/* AI Image Tabs */}
                    {showAIImageTabs && (
                      <div style={{
                        display: "flex", gap: 4, marginBottom: 12,
                        background: "#151A1F", borderRadius: 10, padding: 3,
                        border: `1px solid ${C.panelBorder}`,
                      }}>
                        {AI_IMAGE_TABS.map(tab => {
                          const isActive = aiImageMode === tab.id;
                          return (
                            <button key={tab.id}
                              onClick={() => setAiImageMode(tab.id as typeof aiImageMode)}
                              style={{
                                padding: "8px 14px", borderRadius: 8,
                                fontSize: 13, fontWeight: isActive ? 700 : 500,
                                cursor: "pointer", border: "none",
                                transition: "background 0.15s, color 0.15s",
                                background: isActive ? C.accent : "transparent",
                                color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                              }}>
                              {tab.label}
                              {tab.badge && (
                                <span style={{
                                  fontSize: 9, fontWeight: 700, padding: "1px 5px",
                                  borderRadius: 6, background: "#ef4444", color: "#fff",
                                }}>{tab.badge}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Templates grid */}
                    {showTemplates && <TemplatesGrid onSelectTemplate={handleSelectTemplate} />}

                    {/* Reference Images label */}
                    {isRefImages && (
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.textSecond, marginBottom: 10 }}>
                        Upload 1-7 characters, objects, or scenes as references.
                      </div>
                    )}

                    {/* Image label for AI Image / Editor */}
                    {(isAIImage && aiImageMode === "image_to_image") && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecond, marginBottom: 8 }}>
                        Image <span style={{ fontWeight: 400 }}>(Max 5 images)</span>
                      </div>
                    )}
                    {isAIImageEditor && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecond, marginBottom: 8 }}>
                        Image
                      </div>
                    )}

                    {/* Upload Zone */}
                    {showUpload && (
                      <div style={{ marginBottom: 10 }}>
                        <StudioUploadZone mode={studioMode}
                          file1={image1?.file ?? null} file2={image2?.file ?? null}
                          preview1={preview1} preview2={preview2}
                          onFile1={handleFile1} onFile2={handleFile2}
                          acceptVideo={isAIVideoEditor}
                        />
                      </div>
                    )}

                    {/* Inpaint button — AI Image Editor only */}
                    {isAIImageEditor && (
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginBottom: 10,
                      }}>
                        <button
                          onClick={() => preview1 && setInpaintOpen(true)}
                          disabled={!preview1}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "6px 12px", borderRadius: 8,
                            background: maskDataUrl ? "rgba(124,58,237,0.12)" : "transparent",
                            border: `1px solid ${maskDataUrl ? C.accent : C.panelBorder}`,
                            color: preview1 ? C.textPrimary : C.textSecond,
                            cursor: preview1 ? "pointer" : "not-allowed",
                            fontSize: 13, fontWeight: 600,
                            transition: "all 0.15s",
                            opacity: preview1 ? 1 : 0.5,
                          }}
                        >
                          <span style={{ color: C.accent }}>{"\u2726"}</span>
                          Inpaint
                          {maskDataUrl && (
                            <span style={{
                              fontSize: 9, color: C.accent,
                              padding: "1px 6px", borderRadius: 4,
                              background: "rgba(124,58,237,0.15)",
                            }}>Active</span>
                          )}
                        </button>

                        {/* Tool icons — brush, eraser, hand */}
                        <div style={{ display: "flex", gap: 6 }}>
                          {([
                            { id: "brush" as const, path: "M18.37 2.63a1 1 0 0 1 0 1.41l-9.1 9.1a4 4 0 0 0-1 1.71L7.3 18.71a1 1 0 0 1-1 .71H4a1 1 0 0 1-1-1v-2.3a1 1 0 0 1 .71-1l3.86-.97a4 4 0 0 0 1.71-1l9.1-9.1a1 1 0 0 1 1.41 0Z" },
                            { id: "eraser" as const, path: "m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" },
                            { id: null, path: "M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 13" },
                          ] as const).map((tool, i) => (
                            <button key={i}
                              onClick={(e) => { e.stopPropagation(); if (tool.id) setInpaintTool(tool.id); }}
                              style={{
                                width: 30, height: 30, borderRadius: 6,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                border: `1px solid ${inpaintTool === tool.id ? C.accent : C.panelBorder}`,
                                background: inpaintTool === tool.id ? "rgba(124,58,237,0.12)" : "transparent",
                                color: inpaintTool === tool.id ? C.accentLight : "rgba(255,255,255,0.4)",
                                cursor: "pointer", transition: "all 0.15s",
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d={tool.path} />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Prompt label for AI Image / Editor */}
                    {(isAIImage || isAIImageEditor) && showPrompt && (
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.textSecond, marginBottom: 6 }}>
                        Prompt
                      </div>
                    )}

                    {/* Prompt — always except templates */}
                    {showPrompt && (
                      <div style={{ marginBottom: 6 }}>
                        <PromptArea value={prompt} onChange={setPrompt}
                          placeholder={promptPlaceholder}
                          rows={(isAIImageEditor || isAIVideoEditor) ? 7 : 3}
                          referenceImageChip={
                            isAIImageEditor ? { current: 0, max: 5 }
                            : isAIVideoEditor ? { current: 0, max: 0 }
                            : null
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Fixed bottom: Settings + Create (or just Create for Editor) */}
                  {showSettings && (
                    <div style={{ padding: "8px 18px 12px", borderTop: `1px solid ${C.panelBorder}`, flexShrink: 0 }}>
                      {isAIVideoEditor ? (
                        <VideoEditorSettingsRow
                          version={vidEditorVersion} resolution={vidEditorResolution}
                          onVersionChange={setVidEditorVersion} onResolutionChange={setVidEditorResolution}
                        />
                      ) : isAIImage ? (
                        <ImageSettingsRow model={imgModel} ratio={imgRatio} resolution={imgResolution} outputs={imgOutputs}
                          onModelChange={setImgModel} onRatioChange={setImgRatio}
                          onResolutionChange={setImgResolution} onOutputsChange={setImgOutputs}
                        />
                      ) : (
                        <SettingsRow quality={settingsQuality} resolution={settingsResolution}
                          duration={settingsDuration} ratio={settingsRatio}
                          onQualityChange={setSettingsQuality} onResolutionChange={setSettingsResolution}
                          onDurationChange={setSettingsDuration} onRatioChange={setSettingsRatio}
                        />
                      )}
                      <button onClick={handleGenerate}
                        disabled={loading || (showUpload && !image1)}
                        style={{
                          width: "100%", padding: "10px 0", marginTop: 8, borderRadius: 10,
                          fontSize: 14, fontWeight: 700, color: "#fff",
                          border: "none", cursor: loading ? "wait" : "pointer",
                          background: C.ctaGradient,
                          opacity: (loading || (showUpload && !image1)) ? 0.5 : 1,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                      >
                        {loading ? (
                          <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Đang xử lý...</>
                        ) : "Create"}
                      </button>
                    </div>
                  )}
                  {/* Editor: Create button only (no settings) */}
                  {isAIImageEditor && (
                    <div style={{ padding: "8px 18px 16px", flexShrink: 0 }}>
                      <button onClick={handleGenerate}
                        disabled={loading || !image1}
                        style={{
                          width: "100%", padding: "12px 0", borderRadius: 10,
                          fontSize: 14, fontWeight: 700, color: "#fff",
                          border: "none", cursor: loading ? "wait" : "pointer",
                          background: C.ctaGradient,
                          opacity: (loading || !image1) ? 0.5 : 1,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                      >
                        {loading ? (
                          <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Đang xử lý...</>
                        ) : "Create"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ─── RIGHT PANEL ─── */}
            <div style={{
              flex: 1,
              background: C.panelBg,
              border: `1px solid ${C.panelBorder}`,
              borderRadius: 18,
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{ padding: "14px 18px 8px", fontSize: 13, fontWeight: 600, color: C.textSecond, flexShrink: 0 }}>
                {sidebarActiveId === "ai_image" || sidebarActiveId === "ai_image_editor"
                  ? "Sample Image" : "Sample Video"}
              </div>

              {/* Preview */}
              <div style={{
                flex: 1, margin: "0 14px",
                borderRadius: 10, background: C.uploadBg,
                border: `1px solid ${C.panelBorder}`,
                overflow: "hidden", display: "flex",
                alignItems: "center", justifyContent: "center",
                minHeight: 0,
              }}>
                {loading && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid rgba(60,162,246,0.2)`, borderTopColor: C.accent, animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
                    <div style={{ fontSize: 12, color: C.textMuted }}>Video generating...</div>
                  </div>
                )}
                {!loading && latest && (
                  <img src={latest.outputUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                )}
                {!loading && !latest && (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <div style={{ fontSize: 32, opacity: 0.12, marginBottom: 8 }}>🖼️</div>
                    <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6 }}>
                      Upload ảnh và nhấn &quot;Create&quot;<br />để xem kết quả ở đây
                    </div>
                  </div>
                )}
              </div>

              {/* Prompt text */}
              <div style={{
                padding: "8px 18px", fontSize: 11, color: C.textSecond,
                lineHeight: 1.5, flexShrink: 0,
                borderBottom: `1px solid ${C.panelBorder}`,
              }}>
                <span style={{ color: C.textMuted }}>Prompt: </span>
                {latest ? latest.featureName : (prompt.slice(0, 120) || "...")}
              </div>

              {/* Carousel */}
              <div style={{ padding: "10px 6px 12px", flexShrink: 0, position: "relative" }}>
                <button onClick={() => scrollCarousel("left")} style={{
                  position: "absolute", left: 2, top: "50%", transform: "translateY(-50%)", zIndex: 5,
                  width: 26, height: 26, borderRadius: "50%",
                  background: C.pageBg, border: `1px solid ${C.panelBorder}`,
                  color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ChevronLeft size={13} />
                </button>
                <button onClick={() => scrollCarousel("right")} style={{
                  position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)", zIndex: 5,
                  width: 26, height: 26, borderRadius: "50%",
                  background: C.pageBg, border: `1px solid ${C.panelBorder}`,
                  color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ChevronRight size={13} />
                </button>

                <div ref={carouselRef} style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", padding: "0 28px" }}>
                  {AI_FEATURES.map(f => (
                    <CarouselThumb key={f.slug} feature={f} onSelect={() => switchFeature(f)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sidebar drawer */}
        {mobileSidebarOpen && (
          <div className="lg:hidden" onClick={() => setMobileSidebarOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.6)",
              animation: "sidebar-fade-in 0.2s ease-out",
            }}>
            <style>{`
            @keyframes sidebar-fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes sidebar-slide-in { from { transform: translateX(-100%); } to { transform: translateX(0); } }
          `}</style>
            <aside onClick={e => e.stopPropagation()} style={{
              position: "absolute", top: 0, left: 0, bottom: 0,
              width: 260, background: "#060A0C", borderRight: "1px solid #1D2127",
              overflow: "auto",
              animation: "sidebar-slide-in 0.25s cubic-bezier(0.16,1,0.3,1)",
            }}>
              <SidebarContent activeId={sidebarActiveId} onSelectItem={(id) => {
                setSidebarActiveId(id);
                setMobileSidebarOpen(false);
              }} onClose={() => setMobileSidebarOpen(false)} />
            </aside>
          </div>
        )}

        {/* ═══ MOBILE / TABLET ═══ */}
        <div className="lg:hidden flex flex-col" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* Top nav with sidebar toggle */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.panelBorder}`, background: C.pageBg, flexShrink: 0 }}>
            {/* Sidebar toggle */}
            <button onClick={() => setMobileSidebarOpen(true)}
              style={{
                padding: "10px 14px", fontSize: 13, cursor: "pointer", border: "none",
                background: "transparent", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center",
                borderRight: `1px solid ${C.panelBorder}`,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            {(["form", "result"] as const).map(tab => (
              <button key={tab} onClick={() => setMobileView(tab)} style={{
                flex: 1, padding: "10px 0", fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.1em",
                cursor: "pointer", border: "none", background: "transparent",
                color: mobileView === tab ? C.accent : "rgba(255,255,255,0.35)",
                borderBottom: mobileView === tab ? `2px solid ${C.accent}` : "2px solid transparent",
              }}>
                {tab === "form"
                  ? `✦ ${({
                    image_to_video: "Image to Video",
                    text_to_video: "Text to Video",
                    ai_image: "AI Image",
                    ai_image_editor: "AI Image Editor",
                    ai_video_editor: "AI Video Editor",
                    ai_avatar: "AI Avatar",
                    ai_music: "AI Music",
                    text_to_speech: "Text To Speech",
                  } as Record<string, string>)[sidebarActiveId] || activeFeature.name}`
                  : `Kết quả${results.length ? ` · ${results.length}` : ""}`}
              </button>
            ))}
          </div>

          {mobileView === "form" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Video modes: tabs + upload + prompt + settings */}
              {(sidebarActiveId === "image_to_video") && (
                <StudioTabs active={studioMode} onChange={setStudioMode} />
              )}

              {/* AI Image: custom tabs */}
              {sidebarActiveId === "ai_image" && (
                <div style={{
                  display: "flex", gap: 4, background: "#151A1F", borderRadius: 10, padding: 3,
                  border: `1px solid ${C.panelBorder}`,
                }}>
                  {([
                    { id: "image_to_image" as const, label: "Image to Image" },
                    { id: "text_to_image" as const, label: "Text to Image" },
                    { id: "templates" as const, label: "Templates" },
                  ]).map(tab => {
                    const active = aiImageMode === tab.id;
                    return (
                      <button key={tab.id}
                        onClick={() => setAiImageMode(tab.id as typeof aiImageMode)}
                        style={{
                          padding: "8px 10px", borderRadius: 8, fontSize: 12, fontWeight: active ? 700 : 500,
                          cursor: "pointer", border: "none", flex: 1,
                          background: active ? C.accent : "transparent",
                          color: active ? "#fff" : "rgba(255,255,255,0.5)",
                          transition: "all 0.15s",
                        }}>{tab.label}</button>
                    );
                  })}
                </div>
              )}

              {/* Reference Images label — mobile */}
              {(sidebarActiveId === "image_to_video" && studioMode === "templates") && (
                <div style={{ fontSize: 13, fontWeight: 500, color: C.textSecond, marginBottom: 4 }}>
                  Upload 1-7 characters, objects, or scenes as references.
                </div>
              )}

              {/* Templates — only for AI Image */}
              {(sidebarActiveId === "ai_image" && aiImageMode === "templates") ? (
                <TemplatesGrid onSelectTemplate={handleSelectTemplate} />
              ) : (
                <>
                  {/* Upload zone */}
                  {(sidebarActiveId !== "text_to_video"
                    && !(sidebarActiveId === "ai_image" && aiImageMode === "text_to_image")) && (
                      <StudioUploadZone mode={studioMode} file1={image1?.file ?? null} file2={image2?.file ?? null}
                        preview1={preview1} preview2={preview2} onFile1={handleFile1} onFile2={handleFile2}
                        acceptVideo={sidebarActiveId === "ai_video_editor"} />
                    )}

                  {/* Inpaint button — AI Image Editor */}
                  {sidebarActiveId === "ai_image_editor" && (
                    <button
                      onClick={() => preview1 && setInpaintOpen(true)}
                      disabled={!preview1}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 14px", borderRadius: 10, width: "100%",
                        background: maskDataUrl ? "rgba(124,58,237,0.12)" : "transparent",
                        border: `1px solid ${maskDataUrl ? C.accent : C.panelBorder}`,
                        color: preview1 ? "#fff" : C.textSecond,
                        cursor: preview1 ? "pointer" : "not-allowed",
                        fontSize: 13, fontWeight: 600, opacity: preview1 ? 1 : 0.5,
                      }}
                    >
                      <span style={{ color: C.accent }}>{"\u2726"}</span>
                      Inpaint
                      <span style={{ marginLeft: "auto", fontSize: 11, color: maskDataUrl ? C.accent : "rgba(255,255,255,0.3)" }}>
                        {maskDataUrl ? "Mask Active" : preview1 ? "Draw mask" : "Upload first"}
                      </span>
                    </button>
                  )}

                  {/* Prompt */}
                  <PromptArea value={prompt} onChange={setPrompt}
                    rows={(sidebarActiveId === "ai_image_editor" || sidebarActiveId === "ai_video_editor") ? 7 : 3}
                    referenceImageChip={
                      (sidebarActiveId === "ai_image_editor" || sidebarActiveId === "ai_video_editor")
                        ? { current: 0, max: sidebarActiveId === "ai_image_editor" ? 5 : 0 }
                        : null
                    }
                  />

                  {/* Settings */}
                  {sidebarActiveId !== "ai_image_editor" && (
                    sidebarActiveId === "ai_video_editor" ? (
                      <VideoEditorSettingsRow
                        version={vidEditorVersion} resolution={vidEditorResolution}
                        onVersionChange={setVidEditorVersion} onResolutionChange={setVidEditorResolution} />
                    ) : sidebarActiveId === "ai_image" ? (
                      <ImageSettingsRow model={imgModel} ratio={imgRatio} resolution={imgResolution} outputs={imgOutputs}
                        onModelChange={setImgModel} onRatioChange={setImgRatio}
                        onResolutionChange={setImgResolution} onOutputsChange={setImgOutputs} />
                    ) : (
                      <SettingsRow quality={settingsQuality} resolution={settingsResolution} duration={settingsDuration}
                        ratio={settingsRatio} onQualityChange={setSettingsQuality} onResolutionChange={setSettingsResolution}
                        onDurationChange={setSettingsDuration} onRatioChange={setSettingsRatio} />
                    )
                  )}

                  {/* Create */}
                  <button onClick={handleGenerate} disabled={loading || (activeFeature.imageCount > 0 && !image1)}
                    style={{
                      width: "100%", padding: "12px 0", borderRadius: 10, fontSize: 14, fontWeight: 700,
                      color: "#fff", border: "none", cursor: "pointer",
                      background: C.ctaGradient,
                      opacity: (loading || (activeFeature.imageCount > 0 && !image1)) ? 0.5 : 1,
                    }}>
                    {loading ? "Đang xử lý..." : "Create"}
                  </button>
                </>
              )}
            </div>
          )}

          {mobileView === "result" && (
            <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
              {results.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
                  Chưa có kết quả. Hãy tạo ảnh trước!
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                  {results.map(r => (
                    <img key={r.id} src={r.outputUrl} alt="" style={{ width: "100%", borderRadius: 8, border: `1px solid ${C.panelBorder}` }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inpaint Dialog Modal */}
      {preview1 && (
        <InpaintDialog
          open={inpaintOpen}
          imageSrc={preview1}
          onClose={(mask) => {
            setInpaintOpen(false);
            setMaskDataUrl(mask);
          }}
        />
      )}
    </>
  );
}

/* ── Carousel Thumb ── */
const GRADIENTS: Record<string, string> = {
  insert_object: "linear-gradient(135deg, #667eea, #764ba2)",
  swap_swimsuit: "linear-gradient(135deg, #4facfe, #00f2fe)",
  swap_face: "linear-gradient(135deg, #fa709a, #fee140)",
  swap_shirt: "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  change_color: "linear-gradient(135deg, #ffecd2, #fcb69f)",
  extract_clothing: "linear-gradient(135deg, #a1c4fd, #c2e9fb)",
  to_anime: "linear-gradient(135deg, #f093fb, #f5576c)",
  drawing_to_photo: "linear-gradient(135deg, #43e97b, #38f9d7)",
  restore_photo: "linear-gradient(135deg, #fbc2eb, #a6c1ee)",
  swap_background: "linear-gradient(135deg, #89f7fe, #66a6ff)",
  text_to_image: "linear-gradient(135deg, #7c3aed, #a78bfa)",
};

function CarouselThumb({ feature, onSelect }: { feature: AIFeature; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onSelect} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", width: 150, minWidth: 150, height: 150,
        borderRadius: 10, overflow: "hidden", cursor: "pointer", flexShrink: 0,
        background: GRADIENTS[feature.slug] ?? GRADIENTS.insert_object,
        border: hovered ? `2px solid #7c3aed` : `2px solid #252D36`,
        transition: "border-color 0.15s",
      }}
    >
      {hovered && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: "#7c3aed", color: "#fff", fontSize: 10, fontWeight: 700 }}>
            <Play size={9} fill="#fff" /> Create
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudioPage() {
  return <Suspense><StudioInner /></Suspense>;
}
