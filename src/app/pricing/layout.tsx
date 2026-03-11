import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bảng giá & Gói dịch vụ — PixelMind AI",
  description:
    "Chọn gói phù hợp với nhu cầu của bạn. Bắt đầu miễn phí với 10 credits. Nâng cấp lên Starter, Pro hoặc Max để có nhiều tính năng hơn.",
  openGraph: {
    title: "Bảng giá — PixelMind AI",
    description: "Gói dịch vụ AI linh hoạt, phù hợp mọi nhu cầu",
    type: "website",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
