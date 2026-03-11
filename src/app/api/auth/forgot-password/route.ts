import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResetPasswordEmail } from "@/lib/mail";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Luôn trả về 200 để tránh user enumeration (không tiết lộ email có tồn tại không)
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user && user.password) {
      // Xóa token cũ nếu có
      await prisma.passwordResetToken.deleteMany({ where: { email: normalizedEmail } });

      // Tạo token mới – expire sau 1 giờ
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: { email: normalizedEmail, token, expires },
      });

      await sendResetPasswordEmail(normalizedEmail, token);
    }

    return NextResponse.json({
      success: true,
      message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.",
    });
  } catch (error) {
    console.error("[forgot-password] Error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, thử lại sau." }, { status: 500 });
  }
}
