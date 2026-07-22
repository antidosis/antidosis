/**
 * Client-side image compression for uploads.
 *
 * Large phone photos (4-8MB) can exceed the platform's ~4.5MB serverless body
 * cap and fail before reaching the API. Downscaling to a max dimension and
 * re-encoding as JPEG keeps uploads well under the cap with no visible quality
 * loss at display sizes. GIFs and small files pass through untouched; on any
 * failure the original file is returned so the upload can proceed.
 */

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;
const COMPRESS_ABOVE_BYTES = 1.5 * 1024 * 1024;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  if (file.size < COMPRESS_ABOVE_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
