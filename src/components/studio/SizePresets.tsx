"use client";
import { SIZE_PRESETS } from "@/lib/features";
import type { SizePreset, JobOrientation } from "@/types/ui";

interface SizePresetsProps {
  selectedIndex: number;
  isCustom: boolean;
  customW: number;
  customH: number;
  orientation: JobOrientation;
  onSelectPreset: (index: number) => void;
  onCustom: () => void;
  onCustomWChange: (w: number) => void;
  onCustomHChange: (h: number) => void;
  onOrientationChange: (o: JobOrientation) => void;
}

export default function SizePresets({
  selectedIndex,
  isCustom,
  customW,
  customH,
  orientation,
  onSelectPreset,
  onCustom,
  onCustomWChange,
  onCustomHChange,
  onOrientationChange,
}: SizePresetsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Orientation */}
      <div>
        <p className="text-sm font-semibold text-white mb-2">Orientation</p>
        <div className="flex gap-2">
          {(["portrait", "landscape"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onOrientationChange(opt);
                const match = SIZE_PRESETS.findIndex((p: SizePreset) => p.orientation === opt);
                if (match >= 0) onSelectPreset(match);
              }}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={
                orientation === opt
                  ? { background: "transparent", border: "1px solid var(--lavender)", color: "var(--lavender)" }
                  : { background: "transparent", border: "1px solid #2a2a2a", color: "rgba(255,255,255,0.4)" }
              }
            >
              {opt === "portrait" ? "↑ Portrait" : "↔ Landscape"}
            </button>
          ))}
        </div>
      </div>

      {/* Size presets */}
      <div>
        <p className="text-sm font-semibold text-white mb-2">Size</p>
        <div className="flex flex-wrap gap-2">
          {SIZE_PRESETS.map((preset: SizePreset, i: number) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectPreset(i)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                selectedIndex === i && !isCustom
                  ? { background: "transparent", border: "1px solid var(--lavender)", color: "var(--lavender)" }
                  : { background: "transparent", border: "1px solid #2a2a2a", color: "rgba(255,255,255,0.45)" }
              }
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onCustom}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={
              isCustom
                ? { background: "transparent", border: "1px solid var(--lavender)", color: "var(--lavender)" }
                : { background: "transparent", border: "1px solid #2a2a2a", color: "rgba(255,255,255,0.45)" }
            }
          >
            Custom
          </button>
        </div>

        {/* Custom W × H inputs */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Width (px)</p>
            <input
              type="number"
              value={customW}
              onChange={(e) => { onCustomWChange(Number(e.target.value)); onCustom(); }}
              min={256} max={2048} step={64}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono font-semibold text-white outline-none"
              style={{ background: "#161616", border: "1px solid #2a2a2a" }}
            />
          </div>
          <span className="text-gray-600 mt-5">×</span>
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Height (px)</p>
            <input
              type="number"
              value={customH}
              onChange={(e) => { onCustomHChange(Number(e.target.value)); onCustom(); }}
              min={256} max={2048} step={64}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono font-semibold text-white outline-none"
              style={{ background: "#161616", border: "1px solid #2a2a2a" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
