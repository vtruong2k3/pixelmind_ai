/**
 * lib/features.ts
 * Single source of truth cho tất cả AI feature data, icon map, prompts, size presets.
 * Import từ đây cho cả home page và studio page.
 */
import {
  type LucideIcon,
  Package, Waves, Layers, UserRound, Shirt,
  Palette, Scissors, Wand2, PenLine, Sparkles,
  LayoutGrid, Camera,
} from "lucide-react";
import type { AIFeature, FeatureCategory, SizePreset } from "@/types/ui";

// ─────────────────────────────────────
// AI FEATURES DATA
// ─────────────────────────────────────
export const AI_FEATURES: AIFeature[] = [
  { slug: "insert_object",    name: "Ghép vật thể",        desc: "Ghép đồ vật vào ảnh người",   category: "fashion",    credits: 10, imageCount: 2 },
  { slug: "swap_swimsuit",    name: "Thay đồ bơi",          desc: "Thay outfit bơi lội tự nhiên", category: "fashion",    credits: 10, imageCount: 2 },
  { slug: "swap_background",  name: "Ghép background",      desc: "Đổi phong cảnh, bối cảnh",    category: "photo_edit", credits: 10, imageCount: 2 },
  { slug: "swap_face",        name: "Thay khuôn mặt",       desc: "Swap khuôn mặt tự nhiên",     category: "fashion",    credits: 10, imageCount: 2 },
  { slug: "swap_shirt",       name: "Thay áo",              desc: "Thay áo, giữ nguyên in ấn",   category: "fashion",    credits: 10, imageCount: 2 },
  { slug: "change_color",     name: "Thay màu quần áo",     desc: "Đổi màu trang phục tuỳ ý",   category: "fashion",    credits: 10, imageCount: 1 },
  { slug: "extract_clothing", name: "Lấy quần áo",          desc: "Tách quần áo, trải phẳng",   category: "fashion",    credits: 10, imageCount: 1 },
  { slug: "to_anime",         name: "Ảnh thật → Anime",     desc: "Biến ảnh thật thành anime",  category: "creative",   credits: 10, imageCount: 1 },
  { slug: "drawing_to_photo", name: "Tranh vẽ → Ảnh thật", desc: "Tranh đen trắng thành ảnh",  category: "creative",   credits: 10, imageCount: 1 },
  { slug: "restore_photo",    name: "Phục hồi ảnh cũ",      desc: "Làm mới ảnh cũ bị hư hỏng", category: "photo_edit", credits: 10, imageCount: 1 },
];

// ─────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────
export const CATEGORIES: FeatureCategory[] = [
  { id: "all",        label: "Tất cả" },
  { id: "fashion",    label: "Thời trang" },
  { id: "creative",   label: "Sáng tạo" },
  { id: "photo_edit", label: "Chỉnh sửa" },
];

// ─────────────────────────────────────
// ICON MAPS (lucide-react)
// ─────────────────────────────────────
export const FEATURE_ICON_MAP: Record<string, LucideIcon> = {
  insert_object:    Package,
  swap_swimsuit:    Waves,
  swap_background:  Layers,
  swap_face:        UserRound,
  swap_shirt:       Shirt,
  change_color:     Palette,
  extract_clothing: Scissors,
  to_anime:         Wand2,
  drawing_to_photo: PenLine,
  restore_photo:    Sparkles,
};

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  all:        LayoutGrid,
  fashion:    Shirt,
  creative:   Wand2,
  photo_edit: Camera,
};

/** Helper component — render lucide icon theo feature slug */
export function getFeatureIcon(slug: string): LucideIcon | undefined {
  return FEATURE_ICON_MAP[slug];
}

// ─────────────────────────────────────
// DEFAULT PROMPTS
// ─────────────────────────────────────
export const FEATURE_PROMPTS: Record<string, string> = {
  insert_object:    "Insert the object from image 2 naturally onto the person in image 1, maintaining realistic lighting and perspective",
  swap_swimsuit:    "Swap the swimsuit from image 2 onto the person in image 1, keeping their body shape and skin tone natural",
  swap_background:  "Replace the background of image 1 with the background from image 2, maintaining natural lighting and depth",
  swap_face:        "Swap the face from image 2 onto the person in image 1, preserving natural skin tone and lighting",
  swap_shirt:       "Replace the shirt on the person in image 1 with the shirt from image 2, preserving all printed patterns and text",
  change_color:     "Change the color of the clothing in the photo to a vibrant, natural-looking new color while maintaining fabric texture",
  extract_clothing: "Extract the clothing item from this photo and lay it flat on a clean white background, showing all details",
  to_anime:         "Convert this photo to a high-quality anime art style with vivid colors, sharp details, and beautiful cel-shading",
  drawing_to_photo: "Transform this sketch/drawing into a photorealistic image, preserving the composition and details",
  restore_photo:    "Restore and enhance this old or damaged photo, removing scratches, improving clarity and adding natural color",
};

// ─────────────────────────────────────
// SIZE PRESETS
// ─────────────────────────────────────
export const SIZE_PRESETS: SizePreset[] = [
  { label: "1024 × 1536 (Portrait)",  w: 1024, h: 1536, orientation: "portrait"  },
  { label: "1536 × 1024 (Landscape)", w: 1536, h: 1024, orientation: "landscape" },
  { label: "1024 × 1024 (Square)",    w: 1024, h: 1024, orientation: "square"    },
  { label: "768 × 1152",              w: 768,  h: 1152, orientation: "portrait"  },
  { label: "1152 × 768",              w: 1152, h: 768,  orientation: "landscape" },
];
