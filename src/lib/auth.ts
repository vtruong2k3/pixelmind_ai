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
        token.role = (user.role ?? "USER") as UserRole;
      }

      // Khi session được update thủ công (trigger === "update") — đọc role mới từ DB
      if (token.id && trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) token.role = dbUser.role as UserRole;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id   = token.id as string;
        session.user.role = (token.role ?? "USER") as UserRole;

        // Lấy credits + plan từ DB — chỉ khi chưa có trong token
        // (token được cache theo JWT, tránh query DB mỗi request)
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.id as string },
          select: { credits: true, plan: true, planExpiresAt: true },
        });
        if (dbUser) {
          session.user.credits      = dbUser.credits;
          session.user.plan         = dbUser.plan;
          session.user.planExpiresAt = dbUser.planExpiresAt?.toISOString() ?? null;
        }
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});
