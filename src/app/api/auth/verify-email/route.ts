import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.redirect(new URL("/login?error=InvalidVerificationData", req.url));
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: token,
      },
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL("/login?error=InvalidToken", req.url));
    }

    if (new Date() > verificationToken.expires) {
      return NextResponse.redirect(new URL("/login?error=TokenExpired", req.url));
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=UserNotFound", req.url));
    }

    // Cập nhật người dùng đã xác thực email
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    });

    // Delete the token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: token,
        },
      },
    });

    return NextResponse.redirect(new URL("/login?verified=true", req.url));
  } catch (error) {
    console.error("[verify-email]", error);
    return NextResponse.redirect(new URL("/login?error=VerificationFailed", req.url));
  }
}
