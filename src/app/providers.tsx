"use client";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:            60_000,      // 1 phút — tránh re-fetch khi navigate
        gcTime:               10 * 60_000, // giữ cache 10 phút
        retry:                1,
        refetchOnWindowFocus: false,
        placeholderData:      (prev: unknown) => prev,
      },
    },
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<QueryClient | null>(null);
  if (!clientRef.current) clientRef.current = makeQueryClient();

  return (
    <SessionProvider>
      <QueryClientProvider client={clientRef.current}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
