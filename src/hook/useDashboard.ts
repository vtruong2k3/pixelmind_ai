/**
 * src/hook/useDashboard.ts
 * React Query hooks cho dashboard data.
 * Thay thế useState/useEffect thuần — tự động cache, dedupe, và background refetch.
 */
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { hasMinRole, type UserRole } from "@/lib/roles";
import { userService } from "@/services/userService";
import { adminService } from "@/services/adminService";
import { QUERY_KEYS, STALE_TIMES } from "@/components/dashboard/QueryProvider";

// ── Hook: User dashboard data ─────────────────────────────────────────────────

export function useUserDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.userDashboard,
    queryFn:  () => userService.getDashboard(),
    staleTime: STALE_TIMES.userDashboard,
  });
}

// ── Hook: Admin overview stats ────────────────────────────────────────────────

export function useAdminStats() {
  const { data: session } = useSession();
  const role              = (session?.user?.role ?? "USER") as UserRole;
  const isAdmin           = hasMinRole(role, "ADMIN");

  return useQuery({
    queryKey: QUERY_KEYS.adminStats,
    queryFn:  () => adminService.getOverview(),
    staleTime: STALE_TIMES.adminStats,   // 2 phút — aggregate data không cần real-time
    enabled:  isAdmin,
  });
}

// ── Hook: Prefetch dashboard data trước khi render ────────────────────────────
// Gọi ở layout để data sẵn sàng khi trang mount

export function usePrefetchDashboard() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const role              = (session?.user?.role ?? "USER") as UserRole;

  const prefetch = async () => {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.userDashboard,
      queryFn:  () => userService.getDashboard(),
      staleTime: STALE_TIMES.userDashboard,
    });
    if (hasMinRole(role, "ADMIN")) {
      await queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.adminStats,
        queryFn:  () => adminService.getOverview(),
        staleTime: STALE_TIMES.adminStats,
      });
    }
  };

  return { prefetch };
}

// ── Hook: Invalidate dashboard cache (sau khi generate ảnh, mua credit...) ───

export function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  return {
    invalidate: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userDashboard }),
    invalidateAdmin: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminStats }),
  };
}
