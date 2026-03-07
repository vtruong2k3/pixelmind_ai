/**
 * src/components/dashboard/DashboardClientLayout.tsx
 *
 * Client boundary cho dashboard layout:
 * - Wrap 1 QueryClient singleton cho toàn bộ dashboard → cache chia sẻ giữa pages
 * - Prefetch data khi hover sidebar links (UX nhanh hơn)
 */
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef } from "react";

// ── Tạo QueryClient với cấu hình tối ưu ──────────────────────────────────────

function makeSharedQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Dữ liệu dashboard không cần real-time cực nhanh
        staleTime:            60_000,     // 1 phút — giảm số lần re-fetch
        gcTime:               10 * 60_000, // giữ cache 10 phút sau unmount
        retry:                1,
        refetchOnWindowFocus: false,       // tắt refetch khi focus window
        refetchOnReconnect:   "always",
        // Không bao giờ để UI trắng — luôn hiện data cũ khi đang fetch mới
        placeholderData:      (prev: unknown) => prev,
      },
    },
  });
}

// ── Singleton QueryClient ─────────────────────────────────────────────────────
// Dùng useRef để đảm bảo không tạo lại khi re-render, nhưng vẫn mỗi tab 1 instance

export function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  // useRef - không tạo lại QueryClient khi re-render
  const clientRef = useRef<QueryClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = makeSharedQueryClient();
  }

  return (
    <QueryClientProvider client={clientRef.current}>
      {children}
    </QueryClientProvider>
  );
}
