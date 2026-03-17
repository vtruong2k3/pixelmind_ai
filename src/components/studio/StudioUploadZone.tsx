"use client";

import { useCallback, useState } from "react";
import { Upload, FolderOpen, ImagePlus } from "lucide-react";
import type { StudioMode } from "./StudioTabs";

interface StudioUploadZoneProps {
  mode: StudioMode;
  file1: File | null;
  file2: File | null;
  preview1: string;
  preview2: string;
  onFile1: (f: File | null) => void;
  onFile2: (f: File | null) => void;
}

export default function StudioUploadZone({
  mode, file1, file2, preview1, preview2,
  onFile1, onFile2,
}: StudioUploadZoneProps) {
  if (mode === "between_images") {
    return (
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <DropBox
          label="Click / Drop"
          sublabel="Khung bắt đầu"
          file={file1}
          preview={preview1}
          onFileSelect={onFile1}
        />
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>»</div>
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
  // Default: start_image (and templates mode never reaches here)
  return (
    <DropBox
      label="Click hoặc kéo thả ảnh để upload"
      sublabel=""
      file={file1}
      preview={preview1}
      onFileSelect={onFile1}
      large
    />
  );
}

/* ── Reusable Drop Box ── */
function DropBox({
  label, sublabel, file, preview, onFileSelect, large,
}: {
  label: string;
  sublabel: string;
  file: File | null;
  preview: string;
  onFileSelect: (f: File | null) => void;
  large?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) onFileSelect(f);
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFileSelect(f);
  }, [onFileSelect]);

  return (
    <label
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        minHeight: large ? 140 : 110,
        borderRadius: 14,
        border: `2px dashed ${dragOver ? "#7c3aed" : "#2E3740"}`,
        background: dragOver ? "rgba(60,162,246,0.05)" : "#151A1F",
        cursor: "pointer",
        transition: "border-color 0.2s, background 0.2s",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: "none" }}
      />

      {preview ? (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <img
            src={preview}
            alt="preview"
            style={{ width: "100%", height: "100%", objectFit: "contain", minHeight: large ? 200 : 160 }}
          />
          {/* Remove button */}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onFileSelect(null); }}
            style={{
              position: "absolute", top: 8, right: 8,
              width: 24, height: 24, borderRadius: 6,
              background: "rgba(0,0,0,0.6)", border: "none",
              color: "#fff", cursor: "pointer", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <>
          <Upload size={32} style={{ color: "rgba(255,255,255,0.2)", marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 500, textAlign: "center" }}>
            {label}
          </div>
          {sublabel && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
              {sublabel}
            </div>
          )}
          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <span
              style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 12, color: "rgba(255,255,255,0.4)",
                padding: "4px 10px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <FolderOpen size={12} /> Chọn ảnh
            </span>
            <span
              style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 12, color: "rgba(255,255,255,0.4)",
                padding: "4px 10px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <ImagePlus size={12} /> Tạo ảnh AI
            </span>
          </div>
        </>
      )}
    </label>
  );
}
