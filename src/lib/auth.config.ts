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
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    // Propagate role vào JWT (edge-safe — chỉ đọc token, không query DB)
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).role = token.role ?? "USER";
      if (token.id) session.user.id = token.id as string;
      return session;
    },
    authorized() {
      // Middleware.ts handles all route protection
      return true;
    },
  },
};
