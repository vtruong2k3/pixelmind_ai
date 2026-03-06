import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * auth.config.ts — Edge-compatible auth config (NO Prisma/Node.js imports)
 * Dùng bởi middleware.ts (chạy trong Edge runtime)
 * auth.ts đầy đủ (với PrismaAdapter) dùng cho API routes
 */
export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Protect /studio, /history, /profile
      const isProtected = ["/studio", "/history", "/profile"].some(
        route => pathname === route || pathname.startsWith(route + "/")
      );

      if (isProtected && !isLoggedIn) {
        // Redirect to /login with callbackUrl
        const loginUrl = new URL("/login", nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return Response.redirect(loginUrl);
      }

      // Redirect logged-in users away from /login
      if (pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/studio", nextUrl.origin));
      }

      return true;
    },
  },
};
