/**
 * lib/r2.ts — Storage abstraction
 *
 * Hiện tại: lưu ảnh dưới dạng base64 data URL vào DB (không cần R2/S3).
 * Khi có tiền/muốn dùng Cloudflare R2: uncomment phần S3Client bên dưới
 * và comment lại phần base64.
 *
 * Base64 pros: miễn phí, không cần env vars, hoạt động ngay lập tức.
 * Base64 cons: tốn dung lượng DB (~33% lớn hơn file gốc).
 * Với NeonDB free tier (512MB) và ảnh ~200-500KB → ổn cho dev/test.
 */

export type UploadFolder = "inputs" | "outputs";

/**
 * "Upload" buffer → trả về base64 data URL
 * Thay thế R2 hoàn toàn, không cần credentials.
 */
export async function uploadToR2(
  buffer: Uint8Array,
  _folder: UploadFolder = "outputs",
  _extension = "png",
  contentType = "image/png"
): Promise<string> {
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

/**
 * Download URL → base64 data URL
 */
export async function uploadUrlToR2(
  url: string,
  folder: UploadFolder = "inputs"
): Promise<string> {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
  return uploadToR2(buffer, folder, "jpg", contentType);
}

/**
 * Presigned URL — không áp dụng với base64 storage.
 */
export async function createPresignedUploadUrl(
  _key: string,
  _contentType: string
): Promise<string> {
  return "";
}

/**
 * Xoá file — no-op với base64 storage (xoá trong DB).
 */
export async function deleteFromR2(_url: string): Promise<void> {
  // Xoá record trong DB là đủ
}
