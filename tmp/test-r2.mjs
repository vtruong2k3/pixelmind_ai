/**
 * Quick test: verify R2 connection & upload a small test file.
 * Run: node tmp/test-r2.mjs
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";

// Parse .env file (đơn giản, không dùng dotenv để tránh dependencies)
const envText = readFileSync(".env", "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    // Bỏ comment cuối dòng (# ...) và bỏ quotes
    let val = trimmed.slice(eqIdx + 1).trim()
        .replace(/#.*$/, "").trim()          // bỏ inline comment
        .replace(/^["']|["']$/g, "").trim(); // bỏ quotes bao ngoài
    env[key] = val;
}

const accountId = env["CLOUDFLARE_ACCOUNT_ID"] || "";
const accessKeyId = env["R2_ACCESS_KEY_ID"] || "";
const secretAccessKey = env["R2_SECRET_ACCESS_KEY"] || "";
const bucket = env["R2_BUCKET_NAME"] || "";
const publicUrl = (env["R2_PUBLIC_URL"] || "").replace(/\/$/, "");

console.log("📦 Bucket     :", bucket);
console.log("🌐 Public URL :", publicUrl);
console.log("🔑 Account ID :", accountId.slice(0, 8) + "...");
console.log("🗝️  Access Key :", accessKeyId.slice(0, 8) + "...");

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    console.error("\n❌ Thiếu biến môi trường R2. Kiểm tra lại .env");
    process.exit(1);
}

const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
});

// Test: Upload một file nhỏ rồi xóa ngay
const testKey = `test/r2-ping-${Date.now()}.txt`;
const testContent = Buffer.from(`PixelMind R2 ping - ${new Date().toISOString()}`);

try {
    console.log("\n⬆️  Đang upload file test...");
    await s3.send(new PutObjectCommand({
        Bucket: bucket, Key: testKey,
        Body: testContent, ContentType: "text/plain",
    }));
    const testUrl = `${publicUrl}/${testKey}`;
    console.log("✅ Upload OK :", testUrl);

    console.log("🗑️  Đang xóa file test...");
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
    console.log("✅ Delete OK");

    console.log("\n🎉 R2 kết nối thành công! Code sẵn sàng production.");
} catch (err) {
    console.error("\n❌ R2 Error:", err.message);
    if (err.$metadata) console.error("   HTTP Status:", err.$metadata.httpStatusCode);
    if (err.Code) console.error("   Code:", err.Code);
}
