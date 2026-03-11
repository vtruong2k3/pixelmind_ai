import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import type { UserRole } from "@/lib/roles";
import { hasMinRole } from "@/lib/roles";

const { auth } = NextAuth(authConfig);

export default auth(function middleware(req) {
  const { nextUrl } = req;
  const session     = req.auth;
  const isLoggedIn  = !!session?.user;
  const role        = ((session?.user as any)?.role ?? "USER") as UserRole;
  const pathname    = nextUrl.pathname;

  // Helper: forward pathname header để Server Components đọc được
  function nextWithPathname() {
    const res = NextResponse.next();
    res.headers.set("x-pathname", pathname);
    return res;
  }

  // ── /dashboard/login — trang admin login ──────────────────────────
  if (pathname === "/dashboard/login") {
    // STAFF / ADMIN đã đăng nhập → redirect thẳng vào dashboard
    if (isLoggedIn && hasMinRole(role, "STAFF")) {
      return Response.redirect(new URL("/dashboard", nextUrl.origin));
    }
    // Chưa đăng nhập hoặc USER thường → cho vào trang login
    return nextWithPathname();
  }

  // ── /dashboard — yêu cầu đăng nhập + ít nhất STAFF ─────────────
  if (pathname.startsWith("/dashboard")) {
    // Chưa đăng nhập → về trang admin login
    if (!isLoggedIn) {
      return Response.redirect(new URL("/dashboard/login", nextUrl.origin));
    }

    // Đăng nhập nhưng không đủ quyền (USER thường) → về trang admin login
    if (!hasMinRole(role, "STAFF")) {
      return Response.redirect(new URL("/dashboard/login", nextUrl.origin));
    }

    // Sub-routes chỉ ADMIN
    const adminOnly = [
      "/dashboard/users",
      "/dashboard/features",
      "/dashboard/stats",
    ];
    if (adminOnly.some(r => pathname === r || pathname.startsWith(r + "/"))) {
      if (!hasMinRole(role, "ADMIN")) {
        return Response.redirect(new URL("/dashboard", nextUrl.origin));
      }
    }

    // Sub-routes STAFF + ADMIN
    const staffAndAdmin = [
      "/dashboard/jobs",
      "/dashboard/credits",
    ];
    if (staffAndAdmin.some(r => pathname === r || pathname.startsWith(r + "/"))) {
      if (!hasMinRole(role, "STAFF")) {
        return Response.redirect(new URL("/dashboard", nextUrl.origin));
      }
    }

    return nextWithPathname();
  }

  // ── PROTECTED USER ROUTES ────────────────────────────────────────
  const protectedRoutes = ["/history", "/profile"];
  if (protectedRoutes.some(r => pathname === r || pathname.startsWith(r + "/"))) {
    if (!isLoggedIn) {
      const url = new URL("/login", nextUrl.origin);
      url.searchParams.set("callbackUrl", pathname);
      return Response.redirect(url);
    }
  }

  // Redirect logged-in users away from /login
  if (pathname === "/login" && isLoggedIn) {
    // STAFF/ADMIN → dashboard, USER thường → studio
    const target = hasMinRole(role, "STAFF") ? "/dashboard" : "/studio";
    return Response.redirect(new URL(target, nextUrl.origin));
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/studio/:path*",
    "/history/:path*",
    "/profile/:path*",
    "/login",
  ],
};
