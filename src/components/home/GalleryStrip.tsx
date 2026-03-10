"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { GalleryStripeItem } from "@/types/ui";

interface GalleryImage {
  id: string;
  outputUrl: string;
  featureName: string;
  userName: string | null;
}

interface GalleryStripProps {
  items: GalleryStripeItem[]; // fallback gradients
}

export default function GalleryStrip({ items }: GalleryStripProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/gallery?limit=16")
      .then(r => r.json())
      .then(d => {
        if (d.items?.length > 0) setImages(d.items);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Dùng ảnh thật nếu có, fallback gradient nếu chưa có
  const useReal = loaded && images.length >= 4;

  // Duplicate để loop seamless
  const realLooped = useReal ? [...images, ...images] : [];
  const gradLooped = [...items, ...items];

  return (
    <section className="py-20 overflow-hidden bg-white">
      <div className="max-w-[1400px] mx-auto px-6 mb-8">
        <p className="mono text-xs text-gray-400 uppercase tracking-widest mb-3">Cộng đồng</p>
        <div className="flex items-end justify-between">
          <h2 
            className="text-5xl md:text-6xl text-gray-950 font-medium tracking-tighter" 
            style={{ letterSpacing: "-0.05em" }}
          >
            Tác phẩm từ người dùng
          </h2>
          <Link
            href="/gallery"
            className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors hidden sm:flex items-center gap-1"
          >
            Xem tất cả →
          </Link>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="flex gap-3 gallery-scroll" style={{ width: "max-content" }}>
          {useReal
            ? realLooped.map((img, i) => (
                <Link
                  href="/gallery"
                  key={`${img.id}-${i}`}
                  className="rounded-2xl overflow-hidden shrink-0 relative group cursor-pointer block bg-gray-100"
                  style={{ width: "260px", height: "340px" }}
                  tabIndex={-1}
                >
                  <Image
                    src={img.outputUrl}
                    alt={img.featureName ?? "Tác phẩm AI"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="260px"
                    unoptimized
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
                    <p className="text-white text-xs font-semibold truncate">{img.featureName}</p>
                    {img.userName && (
                      <p className="text-white/60 text-[10px] truncate">by {img.userName}</p>
                    )}
                  </div>
                </Link>
              ))
            : gradLooped.map((item: GalleryStripeItem, i: number) => (
                <Link
                  href="/gallery"
                  key={i}
                  className="rounded-2xl overflow-hidden shrink-0 relative group cursor-pointer block"
                  style={{ width: "260px", height: "340px", background: item.gradient }}
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

      {/* Mobile link */}
      <div className="flex justify-center mt-6 sm:hidden">
        <Link
          href="/gallery"
          className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
        >
          Xem tất cả tác phẩm →
        </Link>
      </div>
    </section>
  );
}
