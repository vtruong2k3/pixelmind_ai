import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/image/[jobId] — proxy ảnh từ S3 URL về client
// Tránh lỗi CORS/CSP khi browser không load được S3 URL trực tiếp
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

    // Lấy outputUrl từ DB
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId: session.user.id, // Chỉ xem ảnh của mình hoặc public
      },
      select: { outputUrl: true, isPublic: true },
    });

    // Nếu không tìm thấy theo userId, thử tìm public job
    const finalJob = job ?? await prisma.job.findFirst({
      where: { id: jobId, isPublic: true },
      select: { outputUrl: true, isPublic: true },
    });

    if (!finalJob?.outputUrl) {
      return new NextResponse("Not found", { status: 404 });
    }

    const outputUrl = finalJob.outputUrl;

    // 1) Nếu là Base64 cũ (ảnh lưu trữ trước đây)
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

    // 2) S3/HTTP URL: Redirect trực tiếp 
    // S3 URL từ Chainhub là pre-signed public, client GET thẳng không lo bị block thay đổi Header từ Server
    return NextResponse.redirect(outputUrl);
  } catch (error) {
    console.error("[/api/image] Error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
