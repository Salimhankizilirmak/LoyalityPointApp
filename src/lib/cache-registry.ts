import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  globalSettings: "global:settings",
  bossProfile: (orgId: string) => `org:${orgId}:profile` as const,
  bossBranches: (orgId: string) => `org:${orgId}:branches` as const,
  branchAnalytics: (branchId: string) => `branch:${branchId}:analytics` as const,
  userOwnership: (userId: string) => `user-ownership-${userId}` as const,
} as const;

export type CacheTagValues = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];

/**
 * Belirtilen cache etiketini geçersiz kılar (purge).
 * @param tag Geçersiz kılınacak etiket
 */
export function purgeCacheTag(tag: string) {
  revalidateTag(tag, "max");
  console.log(`[CacheRegistry] 🧹 Cache tag purged: ${tag}`);
}
