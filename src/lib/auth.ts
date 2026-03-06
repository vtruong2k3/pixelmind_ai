import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Admin emails — set in env: ADMIN_EMAILS="email1@x.com,email2@x.com"
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase());

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    // Keep Google from authConfig
    ...authConfig.providers,
    // Add Credentials provider (Node.js only – bcrypt not edge-compatible)
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null; // OAuth-only user or not found

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = ADMIN_EMAILS.includes((user.email ?? "").toLowerCase());
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
        (session.user as any).isAdmin = token.isAdmin ?? false;
        // Lấy credits + plan từ DB
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { credits: true, plan: true, planExpiresAt: true },
        });
        if (dbUser) {
          (session.user as any).credits = dbUser.credits;
          (session.user as any).plan = dbUser.plan;
          (session.user as any).planExpiresAt = dbUser.planExpiresAt?.toISOString() ?? null;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

