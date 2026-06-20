export const DEFAULT_CHEF_BANNER = "/images/default-chef-banner.webp";
export const DEFAULT_CHEF_AVATAR = "/images/default-avatar.webp";

/**
 * Resolves a chef's banner image URL (client-safe null check).
 */
export function getChefBannerUrl(pathOrKey: string | null | undefined): string {
  return pathOrKey || DEFAULT_CHEF_BANNER;
}

/**
 * Resolves a chef's avatar image URL (client-safe null check).
 */
export function getChefAvatarUrl(pathOrKey: string | null | undefined): string {
  return pathOrKey || DEFAULT_CHEF_AVATAR;
}

/**
 * Resolves a user's avatar image URL based on their role (client-safe).
 */
export function getUserAvatarUrl(pathOrKey: string | null | undefined, role: string): string | null {
  if (pathOrKey) return pathOrKey;
  if (role === "CHEF") return DEFAULT_CHEF_AVATAR;
  return null;
}

/**
 * Resolves a user's banner image URL based on their role (client-safe).
 */
export function getUserBannerUrl(pathOrKey: string | null | undefined, role: string): string | null {
  if (pathOrKey) return pathOrKey;
  if (role === "CHEF") return DEFAULT_CHEF_BANNER;
  return null;
}
