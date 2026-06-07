import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StorageProvider {
  uploadFile(base64Data: string, folder: string): Promise<string>;
  getFileUrl(pathOrKey: string): string;
}

class LocalStorageProvider implements StorageProvider {
  async uploadFile(base64Data: string, folder: string): Promise<string> {
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

    const buffer = Buffer.from(base64Str, "base64");

    // 3. Validate file size (2 MB limit = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (buffer.length > maxSize) {
      throw new Error("File size exceeds 2 MB limit.");
    }

    // 4. Determine file extension
    let extension = "png";
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
      extension = "jpg";
    } else if (mimeType.includes("webp")) {
      extension = "webp";
    }

    // 5. Generate unique filename (using a short random byte string and timestamp)
    const uniqueId = crypto.randomBytes(6).toString("hex");
    const filename = `avatar-${Date.now()}-${uniqueId}.${extension}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

    // Ensure directories exist
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    // Return the relative static URL path
    return `/uploads/${folder}/${filename}`;
  }

  getFileUrl(pathOrKey: string): string {
    // For local storage, the stored value is already the relative static URL
    return pathOrKey;
  }
}

// Instantiate the active storage provider (can be swapped to Cloudinary / Vercel Blob here)
const activeStorageProvider: StorageProvider = new LocalStorageProvider();

export async function saveAvatar(base64Data: string): Promise<string> {
  return activeStorageProvider.uploadFile(base64Data, "avatars");
}

export function getAvatarUrl(pathOrKey: string | null): string | null {
  if (!pathOrKey) return null;
  return activeStorageProvider.getFileUrl(pathOrKey);
}
