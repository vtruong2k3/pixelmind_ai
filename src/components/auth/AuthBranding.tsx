// src/components/auth/AuthBranding.tsx
import Link from "next/link";

export default function AuthBranding() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 flex-1"
      style={{ background: "linear-gradient(160deg, #050c08 0%, #0a1208 40%, #060808 100%)" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5">
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <rect width="34" height="34" rx="7" fill="#7c3aed" />
          <path d="M7 25L13 9L19 21L23 15L27 25H7Z" fill="white" />
          <circle cx="23" cy="11" r="2.5" fill="white" opacity="0.85" />
        </svg>
        <span className="font-bold text-white text-sm">PixelMind AI</span>
      </Link>

      {/* Tagline */}
      <div>
        <blockquote
          className="font-bold text-white leading-tight"
          style={{ fontSize: "clamp(32px,4vw,56px)", letterSpacing: "-0.04em" }}
        >
          Biến ảnh bình thường<br />
          <span style={{ color: "#b4a7d6" }}>thành tuyệt tác AI.</span>
        </blockquote>
        <p className="text-white/30 mt-4">10 công cụ AI chuyên nghiệp · SD & HD · Cộng đồng</p>
      </div>

      {/* Stats */}
      <div className="flex gap-8">
        {[
          { n: "10+", label: "Công cụ AI" },
          { n: "1K+", label: "Người dùng" },
          { n: "50K+", label: "Ảnh đã tạo" },
        ].map(s => (
          <div key={s.label}>
            <div className="text-2xl font-bold text-white">{s.n}</div>
            <div className="text-xs text-white/30 mono uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
