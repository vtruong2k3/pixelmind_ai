import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery AI — Tác phẩm cộng đồng | PixelMind AI",
  description:
    "Khám phá hàng ngàn tác phẩm ảnh AI tuyệt đẹp từ cộng đồng PixelMind AI. Tìm cảm hứng và chia sẻ sáng tạo của bạn.",
  openGraph: {
    title: "Gallery AI — PixelMind AI",
    description: "Khám phá tác phẩm AI sáng tạo từ cộng đồng",
    type: "website",
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
