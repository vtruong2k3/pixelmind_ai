import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * proxy.ts — Chạy trong Edge runtime (không import Prisma)
 * Dùng authConfig (edge-safe) thay vì auth.ts đầy đủ.
 * Bảo vệ /studio và /history, redirect /login khi đã đăng nhập.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/auth).*)",
  ],
};
