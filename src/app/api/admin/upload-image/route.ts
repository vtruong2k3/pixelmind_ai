import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToR2 } from "@/lib/r2";

// POST /api/admin/upload-image
// Body: FormData { file: File }
// Uploads the image to Cloudflare R2 and returns the public URL.
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role === "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Không có file" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Chỉ hỗ trợ JPEG, PNG, WEBP, GIF" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File tối đa 5MB" }, { status: 400 });
    }
    // // Convert to base64 data URL (stored in DB)
    // const buffer  = Buffer.from(await file.arrayBuffer());
    // const base64  = buffer.toString("base64");
    // const url     = `data:${file.type};base64,${base64}`;
    // Upload lên Cloudflare R2
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.type.split("/")[1] || "png";
    const url = await uploadToR2(buffer, "uploads", extension, file.type);

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("[UPLOAD_IMAGE]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
