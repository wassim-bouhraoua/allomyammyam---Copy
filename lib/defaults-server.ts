import fsSync from "fs";
import path from "path";
import { DEFAULT_CHEF_BANNER, DEFAULT_CHEF_AVATAR } from "./defaults";

function localFileExists(relativePath: string): boolean {
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return true;
  }
  try {
    const filePath = path.join(process.cwd(), "public", relativePath);
    return fsSync.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Resolves a chef's banner image URL, validating that the file exists on the server's disk.
 */
export function getChefBannerUrl(pathOrKey: string | null | undefined): string {
  if (!pathOrKey || !localFileExists(pathOrKey)) {
    return DEFAULT_CHEF_BANNER;
  }
  return pathOrKey;
}

/**
 * Resolves a chef's avatar image URL, validating that the file exists on the server's disk.
 */
export function getChefAvatarUrl(pathOrKey: string | null | undefined): string {
  if (!pathOrKey || !localFileExists(pathOrKey)) {
    return DEFAULT_CHEF_AVATAR;
  }
  return pathOrKey;
}

/**
 * Resolves a user's avatar image URL based on their role, validating that the file exists on the server's disk.
 */
export function getUserAvatarUrl(pathOrKey: string | null | undefined, role: string): string | null {
  if (pathOrKey && localFileExists(pathOrKey)) {
    return pathOrKey;
  }
  if (role === "CHEF") return DEFAULT_CHEF_AVATAR;
  return null;
}

/**
 * Resolves a user's banner image URL based on their role, validating that the file exists on the server's disk.
 */
export function getUserBannerUrl(pathOrKey: string | null | undefined, role: string): string | null {
  if (pathOrKey && localFileExists(pathOrKey)) {
    return pathOrKey;
  }
  if (role === "CHEF") return DEFAULT_CHEF_BANNER;
  return null;
}
