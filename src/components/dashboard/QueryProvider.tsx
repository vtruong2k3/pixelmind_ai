"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// staleTime theo từng loại data:
//   admin-stats  → 2 phút (aggregate data, không cần real-time)
//   user-dashboard → 30 giây (credits thay đổi thường xuyên hơn)
//   default       → 30 giây

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:           30_000,         // 30s mặc định
        gcTime:              5 * 60_000,     // giữ cache 5 phút sau khi unmount
        retry:               1,
        refetchOnWindowFocus: false,
        refetchOnReconnect:  "always",
      },
    },
  });
}

// Singleton để tránh tạo lại QueryClient khi re-render
let browserClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient(); // SSR
  if (!browserClient) browserClient = makeQueryClient();
  return browserClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(getQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// Query keys tập trung — tránh magic strings rải rác
export const QUERY_KEYS = {
  adminStats:      ["admin-stats"]      as const,
  userDashboard:   ["user-dashboard"]   as const,
  adminUsers:      (p?: object) => ["admin-users",      p] as const,
  adminJobs:       (p?: object) => ["admin-jobs",       p] as const,
  adminCredits:    (p?: object) => ["admin-credits",    p] as const,
  adminFeatures:   ["admin-features"]   as const,
  userHistory:     (p?: object) => ["user-history",     p] as const,
  userCreditHistory:(p?: object) => ["user-credit-history", p] as const,
} as const;

// staleTime overrides theo query key
export const STALE_TIMES = {
  adminStats:    2 * 60_000,   // 2 phút
  userDashboard: 30_000,       // 30 giây
  list:          60_000,       // 1 phút cho các list (paginated)
} as const;
