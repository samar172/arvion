import { Flower2, Trees, Sparkles, Gem, Gift, Droplet, type LucideIcon } from "lucide-react";

/**
 * Maps a category slug to a professional lucide icon.
 * Falls back to a neutral droplet (attar oil) icon for unknown slugs.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "rose-floral": Flower2,
  "oud-woody": Trees,
  "musk-amber": Sparkles,
  "exotic-rare": Gem,
  "gift-collections": Gift,
};

export function getCategoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] ?? Droplet;
}
