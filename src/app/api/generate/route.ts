import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitTask } from "@/lib/chainhub";
import { hasMinRole } from "@/lib/roles";

// POST /api/generate
// Flow:
// 1. Kiểm tra auth + credits (đủ không?)
// ... (Logic cũ)

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId  = session.user.id;
    const role    = (session.user as any).role ?? "USER";
    // STAFF và ADMIN đều được miễn credit
    const isAdmin = hasMinRole(role, "STAFF");

    // 2. Parse form
    const formData = await req.formData();
    const featureSlug = formData.get("featureSlug") as string;
    const quality     = (formData.get("quality") as "sd" | "hd") ?? "sd";
    const orientation = (formData.get("orientation") as string) ?? "portrait";
    const isPublic    = formData.get("isPublic") !== "false";
    const image       = formData.get("image") as File | null;
    const image2      = formData.get("image_2") as File | null;

    // Lấy trước feature DB để kiểm tra imageCount
    const featureParams = await prisma.feature.findUnique({ where: { slug: featureSlug } });
    if (!featureParams) {
      return NextResponse.json({ error: "Tính năng không tồn tại" }, { status: 404 });
    }

    if (featureParams.imageCount > 0 && !image) {
      return NextResponse.json({ error: "Vui lòng đính kèm ảnh gốc" }, { status: 400 });
    }

    // 4. Kiểm tra credits (admin bypass)
    let user: { credits: number } | null = null;
    if (!isAdmin) {
      user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
      if (!user || user.credits < featureParams.creditCost) {
        return NextResponse.json(
          { error: `Không đủ credits. Cần ${featureParams.creditCost}, còn ${user?.credits ?? 0}.` },
          { status: 402 }
        );
      }
    }

    // 5. Đọc image buffers (nếu có báo count > 0)
    let imageBuffer: Buffer | undefined;
    let image2Buffer: Buffer | undefined;

    if (featureParams.imageCount > 0 && image) {
      imageBuffer  = Buffer.from(await image.arrayBuffer());
    }
    if (featureParams.imageCount === 2 && image2) {
      image2Buffer = Buffer.from(await image2.arrayBuffer());
    }

    const userPrompt  = formData.get("prompt") as string | null;
    
    // Chỉ lấy prompt của User nếu là tính năng Text To Image (0 ảnh), còn lại luôn dùng prompt mặc định của system. Lấy prompt user nếu có và không rỗng.
    const finalPrompt = (featureParams.imageCount === 0 && userPrompt && userPrompt.trim() !== "") 
      ? userPrompt.trim() 
      : featureParams.prompt;

    // 6. Submit task (chung cho cả 0 ảnh và có ảnh)
    const taskId = await submitTask({
      prompt:         finalPrompt,
      quality,
      orientation:    orientation as "portrait" | "landscape" | "square",
      width:          parseInt(formData.get("width") as string) || 1024,
      height:         parseInt(formData.get("height") as string) || 1536,
      image:          imageBuffer,
      image_2:        image2Buffer,
      imageFileName:  image?.name || "image.png",
      image2FileName: image2?.name,
    });
    if (!taskId) {
      return NextResponse.json({ error: "Không thể submit task lên ChainHub" }, { status: 500 });
    }

    // 7. Tạo Job + trừ credits ngay trong 1 transaction
    const dbOps: any[] = [
      prisma.job.create({
        data: {
          userId,
          featureId:   featureParams.id,
          featureSlug: featureParams.slug,
          featureName: featureParams.name,
          promptUsed:  finalPrompt,
          inputUrls:   [],
          quality,
          orientation,
          isPublic,
          status:      "PROCESSING",
          creditUsed:  featureParams.creditCost,
        },
      }),
    ];

    if (!isAdmin) {
      dbOps.push(
        prisma.user.update({
          where: { id: userId },
          data:  { credits: { decrement: featureParams.creditCost } },
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount:      -featureParams.creditCost,
            type:        "spend",
            description: `Tạo ảnh: ${featureParams.name}`,
          },
        })
      );
    }

    const [job] = await prisma.$transaction(dbOps);

    // Lưu chainhubTaskId riêng (Prisma client types chưa cập nhật)
    await prisma.$executeRaw`
      UPDATE "Job" SET "chainhubTaskId" = ${taskId}, "updatedAt" = NOW()
      WHERE id = ${job.id}
    `;

    // 8. Trả về ngay — frontend sẽ poll status
    return NextResponse.json({
      success: true,
      jobId:   job.id,
      taskId,
      creditRemaining: isAdmin ? 9999 : (user!.credits - featureParams.creditCost),
    });
  } catch (error) {
    console.error("[/api/generate] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
