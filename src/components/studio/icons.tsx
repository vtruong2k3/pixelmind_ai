/**
 * components/studio/icons.tsx
 * Shared icon helper components dùng trong Studio và Home page.
 */
import { FEATURE_ICON_MAP, CATEGORY_ICON_MAP } from "@/lib/features";

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Render lucide icon theo feature slug */
export function FIcon({ slug, size = 18, className, style }: IconProps & { slug: string }) {
  const I = FEATURE_ICON_MAP[slug];
  return I ? <I size={size} className={className} style={style} /> : null;
}

/** Render lucide icon theo category id */
export function CatIcon({ id, size = 18, className, style }: IconProps & { id: string }) {
  const I = CATEGORY_ICON_MAP[id];
  return I ? <I size={size} className={className} style={style} /> : null;
}
