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
