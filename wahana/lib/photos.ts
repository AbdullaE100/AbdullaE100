"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "@/lib/env";

export type ProcessedImage = { full: Blob; thumb: Blob; width: number; height: number; ext: "webp" | "jpg" };

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function render(src: ImageBitmap | HTMLImageElement, maxEdge: number, quality: number) {
  const w0 = "naturalWidth" in src ? src.naturalWidth : src.width;
  const h0 = "naturalHeight" in src ? src.naturalHeight : src.height;
  const scale = Math.min(1, maxEdge / Math.max(w0, h0));
  const w = Math.round(w0 * scale);
  const h = Math.round(h0 * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, w, h);
  let blob = await toBlob(canvas, "image/webp", quality);
  let ext: "webp" | "jpg" = "webp";
  // Older Safari can't encode WebP and silently returns PNG.
  if (!blob || blob.type !== "image/webp") {
    blob = await toBlob(canvas, "image/jpeg", quality);
    ext = "jpg";
  }
  if (!blob) throw new Error("Couldn't process this photo");
  return { blob, w, h, ext };
}

/** Resize on the device so uploads are fast on mobile data. */
export async function processImage(file: File): Promise<ProcessedImage> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't a photo");
  const src = await decode(file).catch(() => {
    throw new Error("This photo format isn't supported. Try a JPG or PNG.");
  });
  const full = await render(src, 1600, 0.82);
  const thumb = await render(src, 640, 0.72);
  if ("close" in src) src.close();
  return { full: full.blob, thumb: thumb.blob, width: full.w, height: full.h, ext: full.ext };
}

export async function uploadImage(userId: string, folder: string, img: ProcessedImage) {
  const db = supabaseBrowser();
  const id = crypto.randomUUID();
  const path = `${userId}/${folder}/${id}.${img.ext}`;
  const thumb_path = `${userId}/${folder}/${id}_t.${img.ext}`;
  const contentType = img.ext === "webp" ? "image/webp" : "image/jpeg";
  const opts = { contentType, cacheControl: "31536000", upsert: false };
  const [a, b] = await Promise.all([
    db.storage.from(PHOTO_BUCKET).upload(path, img.full, opts),
    db.storage.from(PHOTO_BUCKET).upload(thumb_path, img.thumb, opts),
  ]);
  if (a.error || b.error) throw new Error((a.error || b.error)!.message || "Upload failed");
  return { path, thumb_path, width: img.width, height: img.height };
}

export async function removeImages(paths: string[]) {
  if (!paths.length) return;
  await supabaseBrowser().storage.from(PHOTO_BUCKET).remove(paths);
}
