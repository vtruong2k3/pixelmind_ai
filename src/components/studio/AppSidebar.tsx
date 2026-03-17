"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass, Menu, X,
  Video, Type, ImageIcon, PenTool,
  Film, User, Music, Mic, MoreHorizontal,
  Megaphone, Workflow,
} from "lucide-react";

/* ──────────────────────────────────────────────
 * Sidebar items — matching Deevid.ai
 * ──────────────────────────────────────────────*/
interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: { text: string; color: string };
}

const CREATION_TOOLS: SidebarNavItem[] = [
  { id: "image_to_video",  label: "Image to Video",   icon: <Video size={18} /> },
  { id: "text_to_video",   label: "Text to Video",    icon: <Type size={18} />,        badge: { text: "Audio", color: "#7c3aed" } },
  { id: "ai_image",        label: "AI Image",         icon: <ImageIcon size={18} />,    badge: { text: "Nano Banana", color: "#22c55e" } },
  { id: "ai_image_editor", label: "AI Image Editor",  icon: <PenTool size={18} /> },
  { id: "ai_video_editor", label: "AI Video Editor",  icon: <Film size={18} /> },
  { id: "ai_avatar",       label: "AI Avatar",        icon: <User size={18} /> },
  { id: "ai_music",        label: "AI Music",         icon: <Music size={18} /> },
  { id: "text_to_speech",  label: "Text To Speech",   icon: <Mic size={18} /> },
  { id: "more",            label: "More",             icon: <MoreHorizontal size={18} /> },
];

const WORKFLOWS: SidebarNavItem[] = [
  { id: "ai_ad",       label: "AI Ad",       icon: <Megaphone size={18} /> },
  { id: "ai_workflow", label: "AI Workflow",  icon: <Workflow size={18} /> },
];

interface AppSidebarProps {
  activeId?: string;
  onSelectItem?: (id: string) => void;
}

/* ── Sidebar Content ── */
function SidebarContent({
  activeId = "image_to_video",
  onSelectItem,
  onClose,
}: AppSidebarProps & { onClose?: () => void }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      overflowY: "auto", overflowX: "hidden",
      paddingBottom: 24, color: "#fff",
    }}>
      {/* CTA — outline style like Deevid.ai */}
      <div style={{ padding: "16px 12px 4px", display: "flex", alignItems: "center", gap: 8 }}>
        <Link href="/studio" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          flex: 1, height: 38, borderRadius: 10,
          border: "1px solid #7c3aed",
          background: "transparent",
          color: "#7c3aed", fontSize: 13, fontWeight: 600,
          textDecoration: "none",
        }}>
          ✦ Create with Agent
        </Link>
        {onClose && (
          <button onClick={onClose} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 8,
            background: "transparent", border: "none",
            color: "rgba(255,255,255,0.4)", cursor: "pointer",
          }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Explore */}
      <div style={{ padding: "6px 0 0" }}>
        <SidebarItemLink icon={<Compass size={18} />} label="Explore" href="/gallery" />
      </div>

      {/* CREATION TOOLS */}
      <SectionHeader text="CREATION TOOLS" />
      {CREATION_TOOLS.map(item => (
        <SidebarItem key={item.id} isActive={activeId === item.id} icon={item.icon}
          label={item.label} badge={item.badge}
          onClick={() => { onSelectItem?.(item.id); onClose?.(); }} />
      ))}

      {/* WORKFLOWS */}
      <SectionHeader text="WORKFLOWS" style={{ marginTop: 8 }} />
      {WORKFLOWS.map(item => (
        <SidebarItem key={item.id} isActive={activeId === item.id} icon={item.icon}
          label={item.label} onClick={() => { onSelectItem?.(item.id); onClose?.(); }} />
      ))}
    </div>
  );
}

function SectionHeader({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700,
      color: "rgba(255,255,255,0.2)",
      textTransform: "uppercase", letterSpacing: "0.1em",
      padding: "12px 14px 4px",
      userSelect: "none", ...style,
    }}>{text}</div>
  );
}

function SidebarItem({
  isActive, icon, label, badge, onClick,
}: {
  isActive: boolean; icon: React.ReactNode; label: string;
  badge?: { text: string; color: string }; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        margin: "1px 8px", padding: "0 10px",
        height: 36, borderRadius: 8,
        fontSize: 13, fontWeight: isActive ? 600 : 500,
        color: isActive ? "#fff" : hovered ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)",
        background: isActive ? "#1A1F24" : hovered ? "#151A1F" : "transparent",
        border: "none", cursor: "pointer",
        textAlign: "left", width: "calc(100% - 16px)",
        transition: "all 0.15s ease",
      }}>
      <span style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 20, height: 20, flexShrink: 0,
        color: isActive ? "#7c3aed" : hovered ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)",
        transition: "color 0.15s",
      }}>{icon}</span>
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8,
          background: badge.color, color: "#fff", flexShrink: 0, lineHeight: 1.5,
        }}>{badge.text}</span>
      )}
    </button>
  );
}

function SidebarItemLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        margin: "1px 8px", padding: "0 10px",
        height: 36, borderRadius: 8,
        fontSize: 13, fontWeight: 500,
        color: hovered ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)",
        background: hovered ? "#151A1F" : "transparent",
        textDecoration: "none", cursor: "pointer",
        transition: "all 0.15s ease",
      }}>
      <span style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 20, height: 20, flexShrink: 0,
        color: hovered ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)",
        transition: "color 0.15s",
      }}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

/* ── Main ── */
export default function AppSidebar(props: AppSidebarProps) {
  return (
    <aside style={{
      display: "flex", flexDirection: "column",
      width: 220, minWidth: 220,
      height: "100%", background: "#060A0C",
      borderRight: "1px solid #1D2127",
      overflow: "hidden", zIndex: 20,
    }} className="hidden lg:flex">
      <SidebarContent {...props} />
    </aside>
  );
}

/* Exported for mobile drawer in page.tsx */
export { SidebarContent };
