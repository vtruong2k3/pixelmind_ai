import type { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Admin emails — edge-safe (no Node.js/Prisma)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

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
    //  Propagate isAdmin into JWT so middleware (Edge runtime) can read it
    async jwt({ token, user }) {
      if (user?.email) {
        token.isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).isAdmin = token.isAdmin ?? false;
      return session;
    },
    authorized() {
      // Let middleware.ts handle all route protection logic
      return true;
    },
  },
};
