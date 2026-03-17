"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/* ── Generic Dropdown ── */
interface DropdownOption {
  value: string;
  label: string;
  desc?: string;
  badge?: string;
}

function StudioSelect({
  options,
  value,
  onChange,
}: {
  options: DropdownOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2,
          width: "100%", padding: "6px 8px",
          borderRadius: 10, fontSize: 12, fontWeight: 500,
          background: "transparent",
          border: "1px solid #252D36",
          color: "#fff", cursor: "pointer",
          transition: "border-color 0.15s",
          minWidth: 0,
        }}
      >
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{selected?.label ?? value}</span>
        <ChevronDown size={12} style={{ opacity: 0.5, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute", bottom: "calc(100% + 4px)", left: 0,
            width: "100%", minWidth: 200,
            background: "#151A1F", border: "1px solid #252D36",
            borderRadius: 12, padding: 6,
            zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "10px 12px", borderRadius: 8,
                background: opt.value === value ? "rgba(60,162,246,0.12)" : "transparent",
                border: "none", cursor: "pointer",
                transition: "background 0.12s",
                color: "#fff",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = opt.value === value ? "rgba(60,162,246,0.12)" : "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</span>
                {opt.badge && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 6, background: "#7c3aed", color: "#fff" }}>
                    {opt.badge}
                  </span>
                )}
              </div>
              {opt.desc && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, lineHeight: 1.4 }}>
                  {opt.desc}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Settings options ── */
const QUALITY_OPTIONS: DropdownOption[] = [
  { value: "sd", label: "Quality V2.0", badge: "Mới", desc: "Chất lượng cao, chuyển cảnh mượt mà" },
  { value: "hd", label: "Master V2.0", badge: "HD", desc: "Hỗ trợ lip-sync, hiệu ứng âm thanh" },
];

const RESOLUTION_OPTIONS: DropdownOption[] = [
  { value: "512", label: "512P" },
  { value: "720", label: "720P" },
  { value: "1080", label: "1080P" },
];

const DURATION_OPTIONS: DropdownOption[] = [
  { value: "5", label: "5s" },
  { value: "8", label: "8s" },
];

const RATIO_OPTIONS: DropdownOption[] = [
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
];

/* ── Main Component ── */
interface SettingsRowProps {
  quality: string;
  resolution: string;
  duration: string;
  ratio: string;
  onQualityChange: (v: string) => void;
  onResolutionChange: (v: string) => void;
  onDurationChange: (v: string) => void;
  onRatioChange: (v: string) => void;
}

export default function SettingsRow(props: SettingsRowProps) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <StudioSelect options={QUALITY_OPTIONS} value={props.quality} onChange={props.onQualityChange} />
      <StudioSelect options={RESOLUTION_OPTIONS} value={props.resolution} onChange={props.onResolutionChange} />
      <StudioSelect options={DURATION_OPTIONS} value={props.duration} onChange={props.onDurationChange} />
      <StudioSelect options={RATIO_OPTIONS} value={props.ratio} onChange={props.onRatioChange} />
    </div>
  );
}

/* ── AI Image Settings ── */
const MODEL_OPTIONS: DropdownOption[] = [
  { value: "nano_banana_2", label: "🍌 Nano Banana 2", badge: "New" },
  { value: "nano_banana_1", label: "🍌 Nano Banana 1" },
];

const IMAGE_RATIO_OPTIONS: DropdownOption[] = [
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
];

const IMAGE_RESOLUTION_OPTIONS: DropdownOption[] = [
  { value: "2k", label: "2K" },
  { value: "4k", label: "4K", badge: "Pro" },
];

const OUTPUTS_OPTIONS: DropdownOption[] = [
  { value: "1", label: "1 Outputs" },
  { value: "2", label: "2 Outputs" },
  { value: "4", label: "4 Outputs" },
];

interface ImageSettingsRowProps {
  model: string;
  ratio: string;
  resolution: string;
  outputs: string;
  onModelChange: (v: string) => void;
  onRatioChange: (v: string) => void;
  onResolutionChange: (v: string) => void;
  onOutputsChange: (v: string) => void;
}

export function ImageSettingsRow(props: ImageSettingsRowProps) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <StudioSelect options={MODEL_OPTIONS} value={props.model} onChange={props.onModelChange} />
      <StudioSelect options={IMAGE_RATIO_OPTIONS} value={props.ratio} onChange={props.onRatioChange} />
      <StudioSelect options={IMAGE_RESOLUTION_OPTIONS} value={props.resolution} onChange={props.onResolutionChange} />
      <StudioSelect options={OUTPUTS_OPTIONS} value={props.outputs} onChange={props.onOutputsChange} />
    </div>
  );
}

/* ── AI Video Editor Settings (2 dropdowns only) ── */
const VIDEO_EDITOR_VERSION_OPTIONS: DropdownOption[] = [
  { value: "v1", label: "V1.0" },
];

const VIDEO_EDITOR_RESOLUTION_OPTIONS: DropdownOption[] = [
  { value: "720", label: "720P" },
  { value: "1080", label: "1080P", badge: "Pro" },
];

interface VideoEditorSettingsRowProps {
  version: string;
  resolution: string;
  onVersionChange: (v: string) => void;
  onResolutionChange: (v: string) => void;
}

export function VideoEditorSettingsRow(props: VideoEditorSettingsRowProps) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <StudioSelect options={VIDEO_EDITOR_VERSION_OPTIONS} value={props.version} onChange={props.onVersionChange} />
      <StudioSelect options={VIDEO_EDITOR_RESOLUTION_OPTIONS} value={props.resolution} onChange={props.onResolutionChange} />
    </div>
  );
}
