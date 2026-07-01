import { communities as staticCommunities } from "@/lib/feed-data";
import { iconFromKey, iconKeyFromSlug } from "@/lib/community-icons";
import type { LucideIcon } from "lucide-react";

export type DisplayCommunity = {
  slug: string;
  name: string;
  icon: LucideIcon;
  tint: string;
  members: string;
  online: number;
  about: string;
  image_url?: string;
};

export type DbCommunityRow = {
  slug: string;
  name: string;
  about: string;
  icon_key: string;
  image_url: string;
  status?: string;
};

export function metaForSlug(slug: string) {
  return staticCommunities.find((x) => x.slug === slug);
}

/** Single source of truth — same icons & tints on home, network, and community pages. */
export function buildCommunityList(approved: DbCommunityRow[]): DisplayCommunity[] {
  if (approved.length === 0) {
    return staticCommunities.map((c) => ({
      slug: c.slug,
      name: c.name,
      about: c.about,
      icon: c.icon,
      tint: c.tint ?? "#111827",
      members: c.members,
      online: c.online,
      image_url: c.image_url,
    }));
  }

  return approved.map((c) => {
    const meta = metaForSlug(c.slug);
    return {
      slug: c.slug,
      name: c.name,
      about: c.about,
      icon: iconFromKey(c.icon_key || iconKeyFromSlug(c.slug)),
      tint: meta?.tint ?? "#111827",
      members: meta?.members ?? "2k+",
      online: meta?.online ?? 120,
      image_url: c.image_url || meta?.image_url,
    };
  });
}

export function displayCommunityForSlug(
  slug: string,
  dbRow?: DbCommunityRow | null,
): DisplayCommunity {
  const meta = metaForSlug(slug);
  const fallback = staticCommunities.find((c) => c.slug === slug) ?? staticCommunities[0]!;
  return {
    slug,
    name: dbRow?.name ?? meta?.name ?? fallback.name,
    about: dbRow?.about ?? meta?.about ?? fallback.about,
    icon: dbRow
      ? iconFromKey(dbRow.icon_key || iconKeyFromSlug(slug))
      : (meta?.icon ?? fallback.icon),
    tint: meta?.tint ?? "#111827",
    members: meta?.members ?? fallback.members,
    online: meta?.online ?? fallback.online,
    image_url: dbRow?.image_url || meta?.image_url,
  };
}
