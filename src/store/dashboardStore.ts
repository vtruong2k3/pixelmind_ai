/**
 * src/store/dashboardStore.ts
 * Zustand store cho dashboard UI state.
 * Chứa filter, pagination, và các UI state có thể share giữa các page dashboard.
 * DATA fetching vẫn dùng React Query — store này chỉ cho UI state.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Types ────────────────────────────────────────────────────────────────────

interface JobsFilter {
  status:  string;
  quality: string;
  search:  string;
  page:    number;
  order:   "desc" | "asc";
}

interface UsersFilter {
  role:   string;
  plan:   string;
  search: string;
  page:   number;
  order:  "desc" | "asc";
}

interface CreditsFilter {
  type:   string;
  search: string;
  page:   number;
  order:  "desc" | "asc";
}

interface DashboardUIState {
  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;

  // ── Jobs filter ──────────────────────────────────────────────────────────
  jobsFilter: JobsFilter;
  setJobsFilter: (patch: Partial<JobsFilter>) => void;
  resetJobsFilter: () => void;

  // ── Users filter ─────────────────────────────────────────────────────────
  usersFilter: UsersFilter;
  setUsersFilter: (patch: Partial<UsersFilter>) => void;
  resetUsersFilter: () => void;

  // ── Credits filter ───────────────────────────────────────────────────────
  creditsFilter: CreditsFilter;
  setCreditsFilter: (patch: Partial<CreditsFilter>) => void;
  resetCreditsFilter: () => void;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_JOBS_FILTER: JobsFilter = {
  status: "", quality: "", search: "", page: 1, order: "desc",
};

const DEFAULT_USERS_FILTER: UsersFilter = {
  role: "", plan: "", search: "", page: 1, order: "desc",
};

const DEFAULT_CREDITS_FILTER: CreditsFilter = {
  type: "", search: "", page: 1, order: "desc",
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useDashboardStore = create<DashboardUIState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      // Jobs
      jobsFilter: DEFAULT_JOBS_FILTER,
      setJobsFilter: (patch) =>
        set((s) => ({ jobsFilter: { ...s.jobsFilter, ...patch } })),
      resetJobsFilter: () => set({ jobsFilter: DEFAULT_JOBS_FILTER }),

      // Users
      usersFilter: DEFAULT_USERS_FILTER,
      setUsersFilter: (patch) =>
        set((s) => ({ usersFilter: { ...s.usersFilter, ...patch } })),
      resetUsersFilter: () => set({ usersFilter: DEFAULT_USERS_FILTER }),

      // Credits
      creditsFilter: DEFAULT_CREDITS_FILTER,
      setCreditsFilter: (patch) =>
        set((s) => ({ creditsFilter: { ...s.creditsFilter, ...patch } })),
      resetCreditsFilter: () => set({ creditsFilter: DEFAULT_CREDITS_FILTER }),
    }),
    {
      name:    "pixelmind-dashboard-ui",           // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Chỉ persist sidebar state — filter được reset mỗi session
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
);
