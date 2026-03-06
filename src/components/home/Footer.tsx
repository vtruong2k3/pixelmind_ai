import Link from "next/link";

export default function HomeFooter() {
  const links = [
    { label: "Studio",  href: "/studio"  },
    { label: "Gallery", href: "/gallery" },
    { label: "Lịch sử", href: "/history" },
    { label: "Đăng ký", href: "/register" },
  ];

  return (
    <footer
      className="border-t"
      style={{ background: "#050c08", borderColor: "rgba(255,255,255,0.07)" }}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 34 34" fill="none" aria-hidden="true">
            <rect width="34" height="34" rx="7" fill="#B4A7D6" />
            <path d="M7 25L13 9L19 21L23 15L27 25H7Z" fill="white" />
            <circle cx="23" cy="11" r="2.5" fill="white" opacity="0.85" />
          </svg>
          <span className="text-white/40 text-sm">PixelMind AI · © 2025</span>
        </div>

        {/* Nav */}
        <nav className="flex gap-6" aria-label="Footer navigation">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="mono text-xs text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
