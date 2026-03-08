/**
 * src/store/studioStore.ts
 * Zustand store cho Studio UI preferences.
 * Persist các lựa chọn của user giữa các lần dùng (không reset khi navigate).
 * DATA fetching (generate, polling) vẫn là raw fetch — không phù hợp React Query.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { JobQuality, JobOrientation } from "@/types/ui";

interface StudioPrefs {
  // Active feature slug (để restore khi quay lại studio)
  activeFeatureSlug: string;
  setActiveFeatureSlug: (slug: string) => void;

  // Active category filter trong feature list
  activeCategory: string;
  setActiveCategory: (cat: string) => void;

  // Generation settings — persist giữa các lần dùng
  quality:           JobQuality;
  setQuality:        (q: JobQuality) => void;

  orientation:       JobOrientation;
  setOrientation:    (o: JobOrientation) => void;

  selectedPresetIdx: number;
  setSelectedPresetIdx: (i: number) => void;

  isPublic:          boolean;
  setIsPublic:       (v: boolean) => void;

  // Panel UI state
  featurePanelOpen:  boolean;
  setFeaturePanelOpen: (v: boolean) => void;
}

export const useStudioStore = create<StudioPrefs>()(
  persist(
    (set) => ({
      activeFeatureSlug:    "swap_shirt",
      setActiveFeatureSlug: (slug) => set({ activeFeatureSlug: slug }),

      activeCategory:    "all",
      setActiveCategory: (cat) => set({ activeCategory: cat }),

      quality:    "sd",
      setQuality: (q) => set({ quality: q }),

      orientation:    "portrait",
      setOrientation: (o) => set({ orientation: o }),

      selectedPresetIdx:    0,
      setSelectedPresetIdx: (i) => set({ selectedPresetIdx: i }),

      isPublic:    true,
      setIsPublic: (v) => set({ isPublic: v }),

      featurePanelOpen:    true,
      setFeaturePanelOpen: (v) => set({ featurePanelOpen: v }),
    }),
    {
      name:    "pixelmind-studio-prefs",
      storage: createJSONStorage(() => localStorage),
      // Persist tất cả prefs ngoại trừ setters
      partialize: (s) => ({
        activeFeatureSlug: s.activeFeatureSlug,
        activeCategory:    s.activeCategory,
        quality:           s.quality,
        orientation:       s.orientation,
        selectedPresetIdx: s.selectedPresetIdx,
        isPublic:          s.isPublic,
        featurePanelOpen:  s.featurePanelOpen,
      }),
    }
  )
);
