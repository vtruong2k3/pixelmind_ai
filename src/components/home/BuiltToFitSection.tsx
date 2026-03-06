import Link from "next/link";
import type { FitCard } from "@/types/ui";

interface BuiltToFitSectionProps {
  cards: FitCard[];
}

export default function BuiltToFitSection({ cards }: BuiltToFitSectionProps) {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #050c08 0%, #0a1208 40%, #060a0a 100%)" }}
      id="pricing"
    >
      {/* Background glow */}
      <div
        className="absolute blur-3xl opacity-30 rounded-full pointer-events-none"
        style={{
          width: "50%", height: "80%",
          background: "radial-gradient(ellipse, #103820 0%, transparent 70%)",
          top: "10%", left: "-10%",
        }}
      />

      <div className="max-w-[1400px] mx-auto px-6 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left — large text (sticky on desktop) */}
          <div className="lg:sticky lg:top-32">
            <h2
              className="font-bold text-white leading-none mb-6"
              style={{ fontSize: "clamp(40px, 6vw, 72px)", letterSpacing: "-0.04em" }}
            >
              Được tạo ra để phù hợp.<br />
              Sẵn sàng để sử dụng.
            </h2>
            <p className="text-white/50 text-lg leading-relaxed max-w-md">
              Dù bạn là nhà thiết kế, nhiếp ảnh gia, hay developer —
              PixelMind AI hoạt động ngay theo cách bạn muốn.
            </p>
            <p className="text-white/30 text-sm mt-4 leading-relaxed max-w-md">
              Bắt đầu từ Studio. Tích hợp qua API. Tùy chỉnh theo nhu cầu của bạn.
            </p>
          </div>

          {/* Right — stacked white cards */}
          <div className="flex flex-col gap-4">
            {cards.map((card: FitCard, i: number) => (
              <div
                key={i}
                className="rounded-2xl p-8 flex flex-col gap-5"
                style={{ background: "rgba(245,243,250,0.97)" }}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ letterSpacing: "-0.03em" }}>
                    {card.tag}
                  </h3>
                  <div className="flex flex-col gap-1 text-right">
                    {card.labels.map((l: string) => (
                      <span key={l} className="mono text-[10px] text-gray-400 tracking-widest uppercase">{l}</span>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-gray-200" />
                <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex gap-4">
                    {card.links.map((l: string) => (
                      <Link key={l} href="/studio" className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors mono">
                        → {l}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/studio"
                    className="px-5 py-2.5 text-sm font-bold rounded-lg text-white transition-all hover:opacity-90 hover:-translate-y-0.5 shrink-0"
                    style={{
                      background: "var(--cta-gradient)",
                      boxShadow: "0 2px 12px rgba(124,58,237,0.35)",
                    }}
                  >
                    {card.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
