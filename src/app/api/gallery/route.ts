import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = (session?.user as any)?.id as string | undefined;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "30");
    const featureSlug = searchParams.get("feature") ?? undefined;

    const where = {
      status: "done",
      isPublic: true,
      outputUrl: { not: null },
      ...(featureSlug ? { featureSlug } : {}),
    };

    const items = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        featureSlug: true,
        featureName: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        _count: {
          select: { likes: true },
        },
        likes: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
      },
    });

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : undefined;

    const result = data.map((item: typeof data[0]) => ({
      id: item.id,
      featureSlug: item.featureSlug,
      featureName: item.featureName,
      // Trả URL proxy thay vì base64 để JSON response nhẹ hơn
      outputUrl: `/api/image/${item.id}`,
      userName: item.user.name,
      userImage: item.user.image,
      createdAt: item.createdAt,
      likeCount: item._count.likes,
      isLikedByMe: currentUserId
        ? (item.likes as { id: string }[])?.length > 0
        : false,
    }));

    return NextResponse.json({
      items: result,
      total: result.length,
      cursor: nextCursor,
    });
  } catch (error) {
    console.error("[/api/gallery] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
