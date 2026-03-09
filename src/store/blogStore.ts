/**
 * src/store/blogStore.ts
 * Zustand store cho public blog UI state.
 * Persist sang sessionStorage để giữ page/search khi user back từ detail về list.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface BlogUIState {
  page:      number;
  search:    string;
  setPage:   (page: number) => void;
  setSearch: (search: string) => void;
  reset:     () => void;
}

const DEFAULTS = { page: 1, search: "" };

export const useBlogStore = create<BlogUIState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setPage:   (page)   => set({ page }),
      setSearch: (search) => set({ search, page: 1 }), // reset về trang 1 khi search
      reset:     ()       => set(DEFAULTS),
    }),
    {
      name:    "pixelmind-blog-ui",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : localStorage
      ),
    }
  )
);
