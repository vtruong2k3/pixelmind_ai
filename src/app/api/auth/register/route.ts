import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/mail";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ thông tin." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu phải có ít nhất 6 ký tự." }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email này đã được sử dụng." }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, token);
    
    if (!emailSent) {
       console.warn("Could not send verification email to:", email, "but account was created.");
    }

    return NextResponse.json({ message: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản." }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Lỗi máy chủ. Vui lòng thử lại." }, { status: 500 });
  }
}
