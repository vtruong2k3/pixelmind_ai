"use client";

import { useState } from "react";

interface PromptAreaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export default function PromptArea({
  value,
  onChange,
  placeholder = "Mô tả nội dung video được tạo từ ảnh này.",
  maxLength = 2000,
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
        rows={3}
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

      {/* Bottom bar: AI Prompt toggle + char count */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px 10px",
        }}
      >
        {/* AI Prompt toggle */}
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

        {/* Character count */}
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
