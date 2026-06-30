import { MAX_STORED_IMAGE_CHARS, MAX_IMAGE_FILE_BYTES } from "./media-limits";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function isAcceptedImage(file: File): boolean {
  return ACCEPT.includes(file.type) || file.type.startsWith("image/");
}

export function fileToObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}

export async function fileToStoredImageUrl(file: File): Promise<string> {
  if (!isAcceptedImage(file)) {
    throw new Error("Use JPG, PNG, or WebP.");
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    throw new Error("Image must be under 3MB.");
  }

  const bitmap = await createImageBitmap(file);
  const maxDim = 1280;
  let { width, height } = bitmap;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.88;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_STORED_IMAGE_CHARS && quality > 0.45) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  if (dataUrl.length > MAX_STORED_IMAGE_CHARS) {
    throw new Error("Image is still too large. Try a smaller photo.");
  }

  return dataUrl;
}

export function isDataImageUrl(url: string): boolean {
  return url.startsWith("data:image/");
}
