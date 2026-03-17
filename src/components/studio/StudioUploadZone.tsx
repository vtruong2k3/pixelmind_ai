"use client";

import { useCallback, useState } from "react";
import { Upload, Video, FolderOpen, Sparkles } from "lucide-react";
import type { StudioMode } from "./StudioTabs";

interface StudioUploadZoneProps {
  mode: StudioMode;
  file1: File | null;
  file2: File | null;
  preview1: string;
  preview2: string;
  onFile1: (f: File | null) => void;
  onFile2: (f: File | null) => void;
  acceptVideo?: boolean;
  videoLabel?: string;
  videoSublabel?: string;
}

export default function StudioUploadZone({
  mode, file1, file2, preview1, preview2,
  onFile1, onFile2, acceptVideo, videoLabel, videoSublabel,
}: StudioUploadZoneProps) {
  if (mode === "between_images") {
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <DropBox
          label="Click / Drop"
          sublabel="Khung bắt đầu"
          file={file1}
          preview={preview1}
          onFileSelect={onFile1}
        />
        <div style={{
          fontSize: 20, color: "rgba(255,255,255,0.15)", fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}>»</div>
        <DropBox
          label="Click / Drop"
          sublabel="Khung kết thúc"
          file={file2}
          preview={preview2}
          onFileSelect={onFile2}
        />
      </div>
    );
  }
  return (
    <DropBox
      label={acceptVideo ? (videoLabel || "Upload a video you want to edit") : "Click hoặc kéo thả ảnh để upload"}
      sublabel={acceptVideo ? (videoSublabel || "Max 30M, fps duration ≤5s") : ""}
      file={file1}
      preview={preview1}
      onFileSelect={onFile1}
      large
      acceptVideo={acceptVideo}
    />
  );
}

/* ── Reusable Drop Box ── */
function DropBox({
  label, sublabel, file, preview, onFileSelect, large, acceptVideo,
}: {
  label: string;
  sublabel: string;
  file: File | null;
  preview: string;
  onFileSelect: (f: File | null) => void;
  large?: boolean;
  acceptVideo?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (acceptVideo ? f.type.startsWith("video/") : f.type.startsWith("image/"))) onFileSelect(f);
  }, [onFileSelect, acceptVideo]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFileSelect(f);
  }, [onFileSelect]);

  const isActive = dragOver || hovered;

  return (
    <label
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        minHeight: large ? 200 : 130,
        borderRadius: 14,
        border: `2px dashed ${isActive ? "#7c3aed" : "#2E3740"}`,
        background: isActive ? "rgba(124,58,237,0.04)" : "#151A1F",
        cursor: "pointer",
        transition: "all 0.25s ease",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <input
        type="file"
        accept={acceptVideo ? "video/*" : "image/*"}
        onChange={handleFileInput}
        style={{ display: "none" }}
      />

      {preview ? (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <img
            src={preview}
            alt="preview"
            style={{ width: "100%", height: "100%", objectFit: "contain", minHeight: large ? 240 : 180 }}
          />
          {/* Remove button */}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onFileSelect(null); }}
            style={{
              position: "absolute", top: 8, right: 8,
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 0,
          padding: large ? "24px 16px" : "16px 12px",
        }}>
          {/* Upload/Video icon */}
          <div style={{
            width: 48, height: 48,
            borderRadius: 12,
            background: isActive ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${isActive ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.06)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 14,
            transition: "all 0.25s ease",
          }}>
            {acceptVideo ? (
              <Video
                size={22}
                style={{
                  color: isActive ? "#a78bfa" : "rgba(255,255,255,0.2)",
                  transition: "color 0.25s ease",
                }}
              />
            ) : (
              <Upload
                size={22}
                style={{
                  color: isActive ? "#a78bfa" : "rgba(255,255,255,0.2)",
                  transition: "color 0.25s ease",
                }}
              />
            )}
          </div>

          {/* Label */}
          <div style={{
            fontSize: 14, fontWeight: 500,
            color: isActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)",
            textAlign: "center",
            transition: "color 0.25s ease",
          }}>
            {label}
          </div>
          {sublabel && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
              {sublabel}
            </div>
          )}

          {/* Action buttons */}
          {large && (
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <ActionChip icon={<FolderOpen size={13} />} label="Chọn ảnh" />
              <ActionChip icon={<Sparkles size={13} />} label="Tạo ảnh AI" />
            </div>
          )}
        </div>
      )}
    </label>
  );
}

/* ── Action chip ── */
function ActionChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 12, fontWeight: 500,
        color: hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.4)",
        padding: "5px 12px", borderRadius: 8,
        background: hovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.1)" : "transparent"}`,
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
    >
      {icon} {label}
    </span>
  );
}
