import Link from "next/link";
import type { GalleryStripeItem } from "@/types/ui";

interface GalleryStripProps {
  items: GalleryStripeItem[];
}

export default function GalleryStrip({ items }: GalleryStripProps) {
  // Duplicate for seamless loop
  const looped = [...items, ...items];

  return (
    <section className="py-20 overflow-hidden bg-white">
      <div className="max-w-[1400px] mx-auto px-6 mb-8">
        <p className="mono text-xs text-gray-400 uppercase tracking-widest mb-3">Cộng đồng</p>
        <h2 className="text-4xl font-bold tracking-tight text-gray-900" style={{ letterSpacing: "-0.03em" }}>
          Tác phẩm từ người dùng
        </h2>
      </div>

      <div className="overflow-hidden">
        <div className="flex gap-3 gallery-scroll" style={{ width: "max-content" }}>
          {looped.map((item: GalleryStripeItem, i: number) => (
            <Link
              href="/gallery"
              key={i}
              className="rounded-2xl overflow-hidden shrink-0 relative group cursor-pointer block"
              style={{ width: "260px", height: "200px", background: item.gradient }}
              tabIndex={-1}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
