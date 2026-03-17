import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/image/[jobId]
// Proxy / redirect ảnh từ outputUrl về client.
// Hỗ trợ 3 loại URL:
//   1. Base64 data URL  (ảnh cũ trước khi có R2)
//   2. R2 public URL    (pub-xxx.r2.dev) → redirect trực tiếp
//   3. Chainhub S3 URL  (hết hạn sau 7 ngày) → redirect trực tiếp
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { jobId } = await params;

    // Lấy outputUrl từ DB — ưu tiên job của user, fallback public job
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: session.user.id },
      select: { outputUrl: true, isPublic: true },
    });

    const finalJob = job ?? await prisma.job.findFirst({
      where: { id: jobId, isPublic: true },
      select: { outputUrl: true, isPublic: true },
    });

    if (!finalJob?.outputUrl) {
      return new NextResponse("Not found", { status: 404 });
    }

    const outputUrl = finalJob.outputUrl;

    // 1) Base64 cũ — decode và trả về binary
    if (outputUrl.startsWith("data:image")) {
      const [header, b64] = outputUrl.split(",");
      const mimeMatch = header.match(/data:([^;]+)/);
      const mime = mimeMatch?.[1] ?? "image/png";
      const buffer = Buffer.from(b64, "base64");
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // 2) Kéo ảnh trực tiếp từ Chainhub (private URL cần Auth)
    if (outputUrl.includes("chainhub.tech")) {
      const fetchHeaders = {
        "User-Agent": "PixelMind/1.0",
        Authorization: `Bearer ${process.env.CHAINHUB_API_KEY}`,
      };
      const res = await fetch(outputUrl, { headers: fetchHeaders });
      if (!res.ok) {
        return new NextResponse("Failed to fetch image from source", { status: res.status });
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") || "image/png";
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // 3) R2 public URL hoặc Chainhub S3 URL (presigned) → redirect
    return NextResponse.redirect(outputUrl, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[/api/image] Error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
