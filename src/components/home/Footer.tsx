import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { footerSections } from "@/lib/footer";

export default function HomeFooter() {


  return (
    <footer className="w-full bg-white text-black py-12 md:py-20 border-t border-gray-100">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

        {/* Left Side: Logo & Copyright */}
        <div className="lg:col-span-4 flex flex-col justify-between h-full min-h-[200px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 34 34" fill="none" aria-hidden="true" className="shrink-0">
              <rect width="34" height="34" fill="black" />
              <path d="M7 25L13 9L19 21L23 15L27 25H7Z" fill="white" />
              <circle cx="23" cy="11" r="2.5" fill="white" />
            </svg>
            <span className="font-bold text-[17px] tracking-tight whitespace-nowrap">PixelMind</span>
          </Link>

          <div className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-auto pt-8">
            © 2025 PIXELMIND
          </div>
        </div>

        {/* Right Side: Links Grid */}
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-4 w-full">
          {footerSections.map((section, idx) => (
            <div key={idx} className="flex flex-col gap-6">
              <h4 className="font-mono text-xs uppercase tracking-widest font-semibold text-black">
                {section.title}
              </h4>
              <ul className="flex flex-col gap-4">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      href={link.href}
                      className="text-gray-500 hover:text-black transition-colors text-[13px] font-medium flex items-center gap-1 w-fit group"
                    >
                      {link.label}
                      {link.external && (
                        <ArrowUpRight size={13} className="text-gray-400 group-hover:text-black transition-colors" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </footer>
  );
}
