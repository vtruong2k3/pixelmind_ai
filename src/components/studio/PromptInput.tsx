"use client";
import { FEATURE_PROMPTS } from "@/lib/features";

interface PromptInputProps {
  featureSlug: string;
  value: string;
  onChange: (v: string) => void;
}

export default function PromptInput({ featureSlug, value, onChange }: PromptInputProps) {
  const defaultPrompt = FEATURE_PROMPTS[featureSlug] ?? "";

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "rgba(180,167,214,0.4)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = "#2a2a2a";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-white">
          Prompt <span style={{ color: "#f87171" }}>*</span>
        </p>
        <button
          type="button"
          onClick={() => onChange(defaultPrompt)}
          className="text-[10px] font-semibold mono uppercase tracking-wider px-2.5 py-1 rounded-md transition-all hover:opacity-90"
          style={{
            background: "rgba(180,167,214,0.1)",
            color: "var(--lavender)",
            border: "1px solid rgba(180,167,214,0.15)",
          }}
        >
          ✦ Dùng prompt AI
        </button>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Mô tả kết quả bạn muốn... (để trống để dùng prompt AI tự động)"
          rows={4}
          className="w-full rounded-xl text-sm text-white resize-none outline-none transition-all placeholder:opacity-30"
          style={{
            background: "#161616",
            border: "1px solid #2a2a2a",
            padding: "12px 14px",
            lineHeight: "1.6",
          }}
        />
        <div
          className="absolute bottom-2 right-3 text-[10px] pointer-events-none"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          {value.length} ký tự
        </div>
      </div>

      {/* Default prompt display */}
      {defaultPrompt && (
        <details className="mt-2 group">
          <summary
            className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none list-none"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            <span className="group-open:hidden">▼</span>
            <span className="hidden group-open:inline">▲</span>
            Xem prompt mặc định của tính năng này
          </summary>
          <div
            className="mt-2 p-3 rounded-xl text-xs leading-relaxed"
            style={{
              background: "#1a1a1a",
              color: "rgba(255,255,255,0.4)",
              border: "1px solid #252525",
            }}
          >
            {defaultPrompt}
          </div>
        </details>
      )}
    </div>
  );
}
