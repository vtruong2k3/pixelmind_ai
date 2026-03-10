import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/lib/roles";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email    = credentials?.email    as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        // Bỏ qua check emailVerified cho ADMIN và STAFF (tạo bằng script)
        const isAdminOrStaff = user.role === "ADMIN" || user.role === "STAFF";
        if (!isAdminOrStaff && !user.emailVerified) {
          throw new Error("Email chưa được xác thực. Vui lòng kiểm tra hộp thư của bạn.");
        }

        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          image: user.image,
          role:  user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Khi login lần đầu
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role ?? "USER";
      }
      // Khi session refresh hoặc update — đọc role mới nhất từ DB
      if (token.id && (trigger === "update" || !token.role)) {
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role ?? "USER";

        // Lấy credits + plan từ DB (fresh mỗi session call)
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.id as string },
          select: { credits: true, plan: true, planExpiresAt: true, role: true },
        });
        if (dbUser) {
          (session.user as any).credits      = dbUser.credits;
          (session.user as any).plan         = dbUser.plan;
          (session.user as any).planExpiresAt = dbUser.planExpiresAt?.toISOString() ?? null;
          (session.user as any).role          = dbUser.role; // always fresh
        }
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});
