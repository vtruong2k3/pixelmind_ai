// src/services/featureService.ts
// Public feature list (không cần auth)

import api from "./api";

export interface PublicFeature {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string | null;
  category: string;
  imageCount: number;
  creditCost: number;
  sortOrder: number;
}

export const featureService = {
  async getFeatures(category?: string): Promise<PublicFeature[]> {
    const { data } = await api.get<{ features: PublicFeature[] }>("/features", {
      params: category ? { category } : {},
    });
    return data.features;
  },

  async getFeatureBySlug(slug: string): Promise<PublicFeature> {
    const { data } = await api.get<PublicFeature>(`/features/${slug}`);
    return data;
  },
};
