/**
 * lib/r2.ts — Cloudflare R2 Storage (S3-compatible)
 *
 * Upload ảnh lên R2 thay vì lưu base64 vào DB.
 * R2 free tier: 10GB storage + 1M requests/tháng.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
const publicUrl = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, ""); // bỏ dấu / cuối

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export type UploadFolder = "inputs" | "outputs" | "uploads";

/**
 * Upload buffer lên R2.
 * Trả về URL công khai có thể truy cập trực tiếp.
 */
export async function uploadToR2(
  buffer: Uint8Array | Buffer,
  folder: UploadFolder = "outputs",
  extension = "png",
  contentType = "image/png"
): Promise<string> {
  const key = `${folder}/${uuidv4()}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
      ContentType: contentType,
    })
  );

  return `${publicUrl}/${key}`;
}

/**
 * Download ảnh từ URL rồi upload lên R2.
 * Dùng khi Chainhub trả về pre-signed URL, cần lưu trữ vĩnh viễn.
 */
export async function uploadUrlToR2(
  url: string,
  folder: UploadFolder = "inputs"
): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "PixelMind/1.0" } });
  if (!res.ok) {
    throw new Error(`[r2] Download thất bại: ${res.status} ${url}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/png";
  const extension = contentType.split("/")[1]?.split(";")[0] || "png";

  return uploadToR2(buffer, folder, extension, contentType);
}

/**
 * Xóa file khỏi R2 theo public URL.
 * Ví dụ: https://pub-xxx.r2.dev/outputs/uuid.png
 */
export async function deleteFromR2(url: string): Promise<void> {
  try {
    // Tách key từ URL: bỏ phần publicUrl ở đầu
    const key = url.replace(`${publicUrl}/`, "");
    if (!key || key === url) return; // URL không phải R2 → bỏ qua

    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    console.log(`[r2] Deleted: ${key}`);
  } catch (err) {
    console.error("[r2] deleteFromR2 error:", err);
  }
}

/**
 * Presigned upload URL (dành cho future use / client-side upload).
 */
export async function createPresignedUploadUrl(
  _key: string,
  _contentType: string
): Promise<string> {
  // Chưa implement — dùng uploadToR2 server-side thay thế
  return "";
}
