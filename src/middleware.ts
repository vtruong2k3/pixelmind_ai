import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge-compatible middleware — use authConfig (no Prisma/Node.js imports)
const { auth } = NextAuth(authConfig);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

export default auth(function middleware(req) {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const userEmail = (session?.user?.email ?? "").toLowerCase();
  // isAdmin is set in JWT callback in auth.ts
  const isAdmin =
    (session?.user as any)?.isAdmin === true ||
    ADMIN_EMAILS.includes(userEmail);
  const pathname = nextUrl.pathname;

  // ── ADMIN ROUTES ──────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    // /admin/login — already admin → redirect to /admin
    if (pathname === "/admin/login") {
      if (isLoggedIn && isAdmin) {
        return Response.redirect(new URL("/admin", nextUrl.origin));
      }
      return; // allow through
    }

    // /admin/forbidden — always allow
    if (pathname === "/admin/forbidden") return;

    // Other /admin/* pages — must be logged-in admin
    if (!isLoggedIn) {
      const url = new URL("/admin/login", nextUrl.origin);
      url.searchParams.set("callbackUrl", pathname);
      return Response.redirect(url);
    }
    if (!isAdmin) {
      return Response.redirect(new URL("/admin/forbidden", nextUrl.origin));
    }
    return; // allow admin
  }

  // ── USER DASHBOARD ────────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const url = new URL("/login", nextUrl.origin);
      url.searchParams.set("callbackUrl", pathname);
      return Response.redirect(url);
    }
    return;
  }

  // ── PROTECTED USER ROUTES ──────────────────────────────────────
  const protectedRoutes = ["/studio", "/history", "/profile"];
  const isProtected = protectedRoutes.some(
    r => pathname === r || pathname.startsWith(r + "/")
  );
  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return Response.redirect(url);
  }

  // Redirect logged-in users away from /login
  if (pathname === "/login" && isLoggedIn) {
    return Response.redirect(new URL("/studio", nextUrl.origin));
  }
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/studio/:path*",
    "/history/:path*",
    "/profile/:path*",
    "/login",
  ],
};
