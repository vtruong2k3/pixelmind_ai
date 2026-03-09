import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NewsCard } from "@/types/ui";

interface BentoSectionProps {
  cards: NewsCard[];
}

export default function BentoSection({ cards }: BentoSectionProps) {
  const featured = cards.filter((c: NewsCard) => c.featured);
  const stacked = cards.filter((c: NewsCard) => !c.featured);

  return (
    <section className="max-w-[1400px] mx-auto px-6 py-24" id="news">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="mono text-xs text-gray-400 uppercase tracking-widest mb-3">Điểm nổi bật</p>
          <h2 
            className="text-6xl md:text-[5.5rem] leading-[1.05] text-gray-950 font-medium tracking-tighter" 
            style={{ letterSpacing: "-0.05em" }}
          >
            Công nghệ AI<br />đỉnh cao
          </h2>
        </div>
        <div className="flex gap-6">
          <Link href="/studio" className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4 transition-colors mono">
            → Khám phá Studio
          </Link>
          <Link href="/gallery" className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4 transition-colors mono">
            → Xem Gallery
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Big featured card */}
        {featured.map((card: NewsCard, i: number) => (
          <Link
            key={i}
            href={card.slug ? `/blog/${card.slug}` : "/blog"}
            className="block rounded-3xl overflow-hidden relative cursor-pointer group"
            style={{
              minHeight: "480px",
              background: card.coverImage ? `url(${card.coverImage}) center/cover no-repeat` : card.gradient
            }}
          >
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-7">
              <p className="mono text-xs text-white/50 mb-3 tracking-widest">{card.date}</p>
              <h3 className="text-2xl font-bold text-white leading-tight max-w-xs tracking-tight">{card.title}</h3>
            </div>
            <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight size={14} className="text-white" />
              </div>
            </div>
          </Link>
        ))}

        {/* 2 stacked cards */}
        <div className="flex flex-col gap-4">
          {stacked.map((card: NewsCard, i: number) => (
            <Link
              key={i}
              href={card.slug ? `/blog/${card.slug}` : "/blog"}
              className="block rounded-3xl overflow-hidden relative cursor-pointer group flex-1"
              style={{
                minHeight: "225px",
                background: card.coverImage ? `url(${card.coverImage}) center/cover no-repeat` : card.gradient
              }}
            >
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <p className="mono text-xs text-white/50 mb-2 tracking-widest">{card.date}</p>
                <h3 className="text-lg font-bold text-white leading-tight tracking-tight">{card.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
