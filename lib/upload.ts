import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StorageProvider {
  uploadFile(base64Data: string, folder: string, prefix?: string): Promise<string>;
  getFileUrl(pathOrKey: string): string;
}

class Base64StorageProvider implements StorageProvider {
  async uploadFile(base64Data: string, folder: string, prefix?: string): Promise<string> {
    // 1. Validate Base64 data format
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid image format.");
    }

    const mimeType = matches[1];
    const base64Str = matches[2];

    // 2. Validate MIME type
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error("Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.");
    }

    // 3. Validate file size (2 MB limit = 2 * 1024 * 1024 bytes)
    const buffer = Buffer.from(base64Str, "base64");
    const maxSize = 2 * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new Error("File size exceeds 2 MB limit.");
    }

    // Return the base64 string directly to be stored in DB
    return base64Data;
  }

  getFileUrl(pathOrKey: string): string {
    return pathOrKey;
  }
}

// Instantiate the active storage provider
const activeStorageProvider: StorageProvider = new Base64StorageProvider();

export async function saveAvatar(base64Data: string): Promise<string> {
  return activeStorageProvider.uploadFile(base64Data, "avatars", "avatar");
}

export function getAvatarUrl(pathOrKey: string | null): string | null {
  if (!pathOrKey) return null;
  return activeStorageProvider.getFileUrl(pathOrKey);
}

export async function saveDishImage(base64Data: string): Promise<string> {
  return activeStorageProvider.uploadFile(base64Data, "dishes", "dish");
}

export function getDishImageUrl(pathOrKey: string | null): string | null {
  if (!pathOrKey) return null;
  return activeStorageProvider.getFileUrl(pathOrKey);
}
