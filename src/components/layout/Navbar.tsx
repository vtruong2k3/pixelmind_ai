"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { X, Zap, ChevronDown, LogOut, History, User, CreditCard, Shield, Menu, LayoutGrid } from "lucide-react";

const NAV_ITEMS = [
 
  { label: "Tính năng", href: "/#features" },
  { label: "Studio", href: "/studio" },
  { label: "Gallery", href: "/gallery" },
  { label: "Blog", href: "/blog" },
  { label: "Pricing", href: "/pricing" },
  
];

interface NavbarProps {
  transparent?: boolean;
}

export default function Navbar({ transparent = false }: NavbarProps) {
  const [announceDismissed, setAnnounceDismissed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (localStorage.getItem('pixelmind_announce_dismissed') === 'true') {
      setAnnounceDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('pixelmind_announce_dismissed', 'true');
    setAnnounceDismissed(true);
  };

  const user = session?.user as any;
  const credits: number = user?.credits ?? 0;
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!transparent) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [transparent]);

  const isTransparent = transparent && !isScrolled;

  const headerBgClass = isTransparent 
    ? "fixed top-0 left-0 right-0 bg-transparent border-b border-transparent text-white" 
    : "sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 text-gray-900";

  return (
    <>
      {/* ── Announcement Bar ── */}
      {!announceDismissed && (
        <div className="bg-black text-white text-sm text-center py-2.5 px-6 flex items-center justify-center gap-3 relative z-[60]">
          <span>
            ✦ PixelMind AI — 10 công cụ AI biến ảnh của bạn thành tuyệt tác&nbsp;·&nbsp;
            <Link href="/studio" className="underline underline-offset-2 hover:text-white/80 transition-colors">
              Thử miễn phí →
            </Link>
          </span>
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Navbar ── */}
      <header className={`z-50 transition-colors duration-300 ${headerBgClass}`}>
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className={`flex items-center gap-2.5 font-bold text-[15px] tracking-tight hover:opacity-80 transition-opacity ${isTransparent ? "text-white" : "text-gray-900"}`}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="34" height="34" rx="7" fill={isTransparent ? "#ffffff" : "#7c3aed"} fillOpacity={isTransparent ? 0.2 : 1}/>
              <path d="M7 25L13 9L19 21L23 15L27 25H7Z" fill={isTransparent ? "#ffffff" : "white"} strokeLinejoin="round"/>
              <circle cx="23" cy="11" r="2.5" fill={isTransparent ? "#ffffff" : "white"} opacity="0.85"/>
            </svg>
            <div className="leading-tight">
              <div>PixelMind</div>
              <div className={`text-[10px] font-normal tracking-wider uppercase ${isTransparent ? "text-white/60" : "text-gray-400"}`}>AI Studio</div>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm rounded-md transition-all font-medium ${
                  isTransparent 
                    ? "text-white/80 hover:text-white hover:bg-white/10" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Hamburger — mobile only */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${isTransparent ? "hover:bg-white/10" : "hover:bg-gray-50"}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            {menuOpen 
              ? <X size={20} className={isTransparent ? "text-white" : "text-gray-700"} /> 
              : <Menu size={20} className={isTransparent ? "text-white" : "text-gray-700"} />
            }
          </button>

          {/* Right — Auth State (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              /* ── Logged in ── */
              <>
                {/* Credits badge */}
                <Link
                  href="/studio"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80"
                  style={{
                    background: "rgba(124,58,237,0.08)",
                    border: "1px solid rgba(124,58,237,0.15)",
                    color: "#7c3aed",
                  }}
                >
                  <Zap size={11} />
                  {credits} credits
                </Link>

                {/* Avatar dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(o => !o)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.image}
                        alt={user.name ?? "Avatar"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: "#7c3aed" }}
                      >
                        {(user?.name ?? user?.email ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {dropdownOpen && (
                    <>
                      {/* Backdrop */}
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                      {/* Menu */}
                      <div
                        className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-lg z-50 overflow-hidden"
                        style={{ background: "#fff", border: "1px solid #f0f0f0" }}
                      >
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-gray-50">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                            {isAdmin && (
                              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#f59e0b" }}>
                                <Shield size={9} color="white" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>

                        {/* Menu items */}
                        <div className="p-1.5">
                          {isAdmin && (
                            <Link
                              href="/dashboard"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors font-semibold"
                              style={{ color: "#7c3aed" }}
                            >
                              <LayoutGrid size={14} />
                              Dashboard
                            </Link>
                          )}
                          <Link
                            href="/profile"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            <User size={14} />
                            Hồ sơ tài khoản
                          </Link>
                          <Link
                            href="/history"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            <History size={14} />
                            Lịch sử tạo ảnh
                          </Link>
                          <Link
                            href="/pricing"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          >
                            <CreditCard size={14} />
                            Nạp credits
                          </Link>
                          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold"
                            style={{ color: "#7c3aed" }}
                          >
                            <Zap size={13} />
                            {isAdmin ? "∞" : credits} credits còn lại
                          </div>
                        </div>

                        <div className="p-1.5 border-t border-gray-50">
                          <button
                            onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/" }); }}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                          >
                            <LogOut size={14} />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              /* ── Not logged in ── */
              <>
                <Link
                  href="/login"
                  className={`hidden sm:block text-sm transition-colors font-medium ${isTransparent ? "text-white/80 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/login?callbackUrl=/studio"
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all hover:opacity-90 hover:-translate-y-0.5 ${isTransparent ? "text-black bg-white/90" : "text-white"}`}
                  style={!isTransparent ? {
                    background: "var(--cta-gradient)",
                    boxShadow: "0 2px 10px rgba(124,58,237,0.35)",
                  } : {}}
                >
                  Dùng ngay
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile menu drawer ── */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/25 md:hidden" onClick={() => setMenuOpen(false)} />

          {/* Drawer */}
          <div
            className="fixed top-[64px] left-0 right-0 z-50 md:hidden bg-white shadow-xl"
            style={{ borderBottom: "1px solid #f0f0f0", maxHeight: "calc(100dvh - 64px)", overflowY: "auto" }}
          >
            {/* Nav links */}
            <nav className="px-3 pt-3 pb-1 flex flex-col gap-0.5">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-[15px] font-medium text-gray-800 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="h-px bg-gray-100 mx-4 my-2" />

            {/* Auth section */}
            <div className="px-3 pb-4 flex flex-col gap-1.5">
              {session ? (
                <>
                  {/* Credits badge */}
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-1"
                    style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.1)" }}>
                    <Zap size={13} style={{ color: "#7c3aed" }} />
                    <span className="text-sm font-bold mono" style={{ color: "#7c3aed" }}>
                      {isAdmin ? "∞" : credits} credits
                    </span>
                    <Link href="/pricing" onClick={() => setMenuOpen(false)}
                      className="ml-auto text-xs font-semibold" style={{ color: "#7c3aed" }}>
                      Nạp thêm →
                    </Link>
                  </div>

                  {/* Avatar + name accordion */}
                  <button
                    onClick={() => setDropdownOpen(o => !o)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left"
                  >
                    {user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: "var(--cta-gradient)" }}>
                        {(user?.name ?? user?.email ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.name ?? "Tài khoản"}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Accordion sub-menu */}
                  {dropdownOpen && (
                    <div className="mx-2 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex flex-col">
                      {isAdmin && (
                        <Link href="/dashboard" onClick={() => { setMenuOpen(false); setDropdownOpen(false); }}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-gray-100 transition-colors"
                          style={{ color: "#7c3aed" }}>
                          <LayoutGrid size={15} /> Dashboard
                        </Link>
                      )}
                      <Link href="/profile" onClick={() => { setMenuOpen(false); setDropdownOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                        <User size={15} className="text-gray-400" /> Hồ sơ tài khoản
                      </Link>
                      <Link href="/history" onClick={() => { setMenuOpen(false); setDropdownOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors border-t border-gray-100">
                        <History size={15} className="text-gray-400" /> Lịch sử tạo ảnh
                      </Link>
                      <Link href="/pricing" onClick={() => { setMenuOpen(false); setDropdownOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors border-t border-gray-100">
                        <CreditCard size={15} className="text-gray-400" /> Nạp credits
                      </Link>
                      <button
                        onClick={() => { setMenuOpen(false); setDropdownOpen(false); signOut({ callbackUrl: "/" }); }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100 w-full text-left"
                      >
                        <LogOut size={15} /> Đăng xuất
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center py-3 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
                    Đăng nhập
                  </Link>
                  <Link href="/login?callbackUrl=/studio" onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center py-3 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: "var(--cta-gradient)", boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}>
                    Dùng ngay ✦
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
