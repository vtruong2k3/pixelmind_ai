/**
 * next-auth.d.ts — Mở rộng NextAuth types để loại bỏ `(session.user as any)`
 * Đặt tại src/types/ để TypeScript tự động pick up.
 *
 * Note: Các field trên `User` phải optional vì `AdapterUser` (PrismaAdapter)
 * không có `role`/`credits` — chúng chỉ được set trong JWT/session callback.
 */
import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/roles";

declare module "next-auth" {
  interface User {
    id?:            string;
    role?:          UserRole;
    credits?:       number;
    plan?:          string;
    planExpiresAt?: string | null;
  }

  interface Session {
    user: {
      id:            string;
      role:          UserRole;
      credits:       number;
      plan:          string;
      planExpiresAt: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?:            string;
    role?:          UserRole;
    credits?:       number;
    plan?:          string;
    planExpiresAt?: string | null;
  }
}
