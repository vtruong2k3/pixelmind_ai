"use client";

import { useState } from "react";

interface PromptAreaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  /** Show "Reference Image (0/N)" chip in bottom bar instead of AI Prompt toggle */
  referenceImageChip?: { current: number; max: number } | null;
}

export default function PromptArea({
  value,
  onChange,
  placeholder = "Mô tả nội dung video được tạo từ ảnh này.",
  maxLength = 2000,
  rows = 3,
  referenceImageChip = null,
}: PromptAreaProps) {
  const [aiPrompt, setAiPrompt] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        border: "1px solid #252D36",
        background: "transparent",
        overflow: "hidden",
      }}
    >
      <textarea
        value={value}
        onChange={e => {
          if (e.target.value.length <= maxLength) onChange(e.target.value);
        }}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%",
          padding: "10px 14px",
          paddingBottom: 32,
          background: "transparent",
          border: "none",
          outline: "none",
          resize: "none",
          color: "#fff",
          fontSize: 14,
          fontFamily: "inherit",
          lineHeight: 1.6,
        }}
      />

      {/* Bottom bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px 10px",
        }}
      >
        {/* Left side: AI Prompt toggle or Reference Image chip */}
        {referenceImageChip ? (
          <button
            type="button"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 8,
              background: "transparent",
              border: "1px solid #252D36",
              color: "rgba(255,255,255,0.85)", cursor: "pointer",
              fontSize: 12, fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            Reference Image{referenceImageChip.max > 0 ? ` (${referenceImageChip.current}/${referenceImageChip.max})` : ""}
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
              AI Prompt
            </span>
            <button
              type="button"
              onClick={() => setAiPrompt(!aiPrompt)}
              style={{
                position: "relative",
                width: 34,
                height: 18,
                borderRadius: 9,
                background: aiPrompt ? "#7c3aed" : "rgba(255,255,255,0.15)",
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: aiPrompt ? 18 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>
        )}

        {/* Character count */}
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
