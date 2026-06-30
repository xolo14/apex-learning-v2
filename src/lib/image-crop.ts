import {
  COURSE_COVER_HEIGHT,
  COURSE_COVER_WIDTH,
  MAX_STORED_IMAGE_CHARS,
} from "./media-limits";

export type CropTransform = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = src;
  });
}

export function fileToObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}

/** Fit image in crop frame; default scale = 1 covers the frame. */
export function initialCropTransform(
  imgW: number,
  imgH: number,
  frameW: number,
  frameH: number,
): CropTransform {
  const scaleX = frameW / imgW;
  const scaleY = frameH / imgH;
  const baseScale = Math.max(scaleX, scaleY);
  return { offsetX: 0, offsetY: 0, scale: baseScale };
}

export function withZoom(transform: CropTransform, baseScale: number, zoom: number): CropTransform {
  return { ...transform, scale: baseScale * zoom };
}

export function exportCroppedImage(
  image: HTMLImageElement,
  frameW: number,
  frameH: number,
  transform: CropTransform,
  outputW = COURSE_COVER_WIDTH,
  outputH = COURSE_COVER_HEIGHT,
): string {
  const { offsetX, offsetY, scale } = transform;
  const displayW = image.naturalWidth * scale;
  const displayH = image.naturalHeight * scale;
  const x = (frameW - displayW) / 2 + offsetX;
  const y = (frameH - displayH) / 2 + offsetY;

  const sx = Math.max(0, (-x / displayW) * image.naturalWidth);
  const sy = Math.max(0, (-y / displayH) * image.naturalHeight);
  const sw = Math.min(image.naturalWidth - sx, (frameW / displayW) * image.naturalWidth);
  const sh = Math.min(image.naturalHeight - sy, (frameH / displayH) * image.naturalHeight);

  const canvas = document.createElement("canvas");
  canvas.width = outputW;
  canvas.height = outputH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not crop image.");
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outputW, outputH);

  let quality = 0.9;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_STORED_IMAGE_CHARS && quality > 0.5) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > MAX_STORED_IMAGE_CHARS) {
    throw new Error("Cropped image is too large. Try zooming in more.");
  }
  return dataUrl;
}
