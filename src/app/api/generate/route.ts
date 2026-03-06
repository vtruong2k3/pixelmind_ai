import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitTask } from "@/lib/chainhub";

// POST /api/generate
// Flow mới (async):
// 1. Kiểm tra auth + credits
// 2. Submit ảnh lên ChainHub → nhận task_id ngay
// 3. Tạo Job trong DB với status="processing" + chainhubTaskId
// 4. Trừ credits ngay (trước khi có kết quả)
// 5. Trả về { jobId } NGAY LẬP TỨC — không đợi ảnh xong
// Frontend sẽ poll /api/generate/status?jobId=xxx mỗi 3 giây

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const isAdmin = (session.user as any).isAdmin === true;

    // 2. Parse form
    const formData = await req.formData();
    const featureSlug = formData.get("featureSlug") as string;
    const quality     = (formData.get("quality") as "sd" | "hd") ?? "sd";
    const orientation = (formData.get("orientation") as string) ?? "portrait";
    const isPublic    = formData.get("isPublic") !== "false";
    const image       = formData.get("image") as File | null;
    const image2      = formData.get("image_2") as File | null;

    if (!featureSlug || !image) {
      return NextResponse.json({ error: "featureSlug và image là bắt buộc" }, { status: 400 });
    }

    // 3. Lấy feature từ DB
    const feature = await prisma.feature.findUnique({ where: { slug: featureSlug } });
    if (!feature) {
      return NextResponse.json({ error: "Tính năng không tồn tại" }, { status: 404 });
    }

    // 4. Kiểm tra credits (admin bypass)
    let user: { credits: number } | null = null;
    if (!isAdmin) {
      user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
      if (!user || user.credits < feature.creditCost) {
        return NextResponse.json(
          { error: `Không đủ credits. Cần ${feature.creditCost}, còn ${user?.credits ?? 0}.` },
          { status: 402 }
        );
      }
    }

    // 5. Đọc image buffers
    const imageBuffer  = Buffer.from(await image.arrayBuffer());
    const image2Buffer = image2 ? Buffer.from(await image2.arrayBuffer()) : undefined;

    // 6. Submit task lên ChainHub → nhận task_id NGAY (không poll)
    const taskId = await submitTask({
      prompt:         feature.prompt,
      image:          imageBuffer,
      image_2:        image2Buffer,
      imageFileName:  image.name,
      image2FileName: image2?.name,
      quality,
      orientation: orientation as "portrait" | "landscape" | "square",
    });

    if (!taskId) {
      return NextResponse.json({ error: "Không thể submit task lên ChainHub" }, { status: 500 });
    }

    // 7. Tạo Job + trừ credits trong 1 transaction
    const dbOps: any[] = [
      prisma.job.create({
        data: {
          userId,
          featureId:   feature.id,
          featureSlug: feature.slug,
          featureName: feature.name,
          promptUsed:  feature.prompt,
          inputUrls:   [],
          quality,
          orientation,
          isPublic,
          status:      "processing",
          creditUsed:  feature.creditCost,
        },
      }),
    ];

    if (!isAdmin) {
      dbOps.push(
        prisma.user.update({
          where: { id: userId },
          data:  { credits: { decrement: feature.creditCost } },
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount:      -feature.creditCost,
            type:        "spend",
            description: `Tạo ảnh: ${feature.name}`,
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
      creditRemaining: isAdmin ? 9999 : (user!.credits - feature.creditCost),
    });
  } catch (error) {
    console.error("[/api/generate] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
