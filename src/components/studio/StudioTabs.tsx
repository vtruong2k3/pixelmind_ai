"use client";

export type StudioMode = "start_image" | "between_images" | "templates";

const TABS: { id: StudioMode; label: string }[] = [
  { id: "start_image", label: "Start Image" },
  { id: "between_images", label: "Between Images" },
  { id: "templates", label: "Reference Images" },
];

interface StudioTabsProps {
  active: StudioMode;
  onChange: (tab: StudioMode) => void;
}

export default function StudioTabs({ active, onChange }: StudioTabsProps) {
  return (
    <div style={{
      display: "flex", gap: 4, marginBottom: 12,
      background: "#151A1F", borderRadius: 10, padding: 3,
      border: "1px solid #252D36",
    }}>
      {TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: "8px 18px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              transition: "background 0.15s, color 0.15s",
              background: isActive ? "#7c3aed" : "transparent",
              color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
              flex: 1,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
