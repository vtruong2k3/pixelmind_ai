import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Mật khẩu phải có ít nhất 8 ký tự" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Tìm token trong DB
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { email: normalizedEmail, token },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Token không hợp lệ hoặc đã được sử dụng" }, { status: 400 });
    }

    // Kiểm tra hết hạn
    if (new Date() > resetToken.expires) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return NextResponse.json({ error: "Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới." }, { status: 400 });
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(password, 12);

    // Cập nhật mật khẩu + xóa token trong 1 transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { email: normalizedEmail },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
    ]);

    return NextResponse.json({ success: true, message: "Mật khẩu đã được đặt lại thành công." });
  } catch (error) {
    console.error("[reset-password] Error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi, thử lại sau." }, { status: 500 });
  }
}
