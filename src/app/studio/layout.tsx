import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Image Studio — PixelMind AI",
  description:
    "Công cụ tạo ảnh AI mạnh mẽ nhất. Thay áo, đổi background, chuyển anime, phục hồi ảnh cũ, và hơn 10 tính năng AI khác — chỉ vài giây.",
  openGraph: {
    title: "AI Image Studio — PixelMind AI",
    description: "Tạo ảnh AI chất lượng cao với 10+ tính năng sáng tạo",
    type: "website",
  },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
