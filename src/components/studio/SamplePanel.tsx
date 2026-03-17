"use client";

import { useState } from "react";
import type { ResultItem } from "@/types/ui";

interface SamplePanelProps {
  results: ResultItem[];
  loading: boolean;
}

export default function SamplePanel({ results, loading }: SamplePanelProps) {
  const latest = results[0];

  return (
    <div
      style={{
        background: "#0d1117",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 20px 12px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
        Kết quả mẫu
      </div>

      {/* Preview area */}
      <div
        style={{
          flex: 1,
          margin: "0 16px",
          borderRadius: 12,
          background: "#161B20",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          minHeight: 280,
        }}
      >
        {loading && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: "50%",
                border: "3px solid rgba(60,162,246,0.2)",
                borderTopColor: "#7c3aed",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              Đang tạo ảnh...
            </div>
          </div>
        )}

        {!loading && latest && (
          <img
            src={latest.outputUrl}
            alt={latest.featureName}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )}

        {!loading && !latest && (
          <div style={{ textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.2 }}>🖼️</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
              Upload ảnh và nhấn &quot;Tạo ảnh&quot;<br />để xem kết quả ở đây
            </div>
          </div>
        )}
      </div>

      {/* Prompt text */}
      {latest && (
        <div style={{ padding: "12px 20px 16px" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Prompt: </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            {latest.featureName}
          </span>
        </div>
      )}

      {/* Results history */}
      {results.length > 1 && (
        <div style={{ padding: "0 16px 16px", display: "flex", gap: 8, overflowX: "auto" }}>
          {results.slice(0, 6).map((r, i) => (
            <div
              key={r.id}
              style={{
                width: 64, height: 64, borderRadius: 10, overflow: "hidden",
                flexShrink: 0,
                border: i === 0 ? "2px solid #7c3aed" : "2px solid transparent",
              }}
            >
              <img src={r.outputUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
