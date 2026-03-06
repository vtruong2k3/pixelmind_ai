"use client";
import { useRef, useCallback } from "react";
import { Upload, X } from "lucide-react";
import type { UploadedFile } from "@/types/ui";

interface UploadZoneProps {
  label: string;
  file: UploadedFile | null;
  onFile: (file: File) => void;
  onClear: () => void;
  accept?: string;
}

export default function UploadZone({
  label,
  file,
  onFile,
  onClear,
  accept = "image/*",
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (f: File) => {
      if (!f.type.startsWith("image/")) return;
      onFile(f);
    },
    [onFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.style.borderColor = "#272727";
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  return (
    <div>
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-2"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {label}
      </p>

      <div
        className="relative flex flex-col items-center justify-center cursor-pointer rounded-2xl transition-all"
        style={{
          minHeight: "220px",
          border: "2px dashed #272727",
          background: "rgba(255,255,255,0.015)",
        }}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = "var(--lavender)";
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.borderColor = "#272727";
        }}
        onClick={() => inputRef.current?.click()}
      >
        {file ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.preview}
              alt="preview"
              className="w-full h-full object-contain rounded-xl"
              style={{ maxHeight: "320px" }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/20"
              style={{ background: "rgba(0,0,0,0.6)" }}
              aria-label="Xoá ảnh"
            >
              <X size={13} className="text-white" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: "48px", height: "48px", background: "rgba(180,167,214,0.08)" }}
            >
              <Upload size={20} style={{ color: "var(--lavender)" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                Kéo thả hoặc click để upload
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
                PNG, JPG, WEBP · Tối đa 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = ""; // reset để upload cùng file lần sau
        }}
      />
    </div>
  );
}
