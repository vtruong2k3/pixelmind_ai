/**
 * Script tạo tài khoản ADMIN và STAFF
 * Chạy: npx tsx scripts/create-admin.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const SALT_ROUNDS = 12;

  const accounts = [
    {
      name:     "Super Admin",
      email:    "admin@pixelmind.ai",
      password: "Admin@123456",       // ← đổi mật khẩu theo ý
      role:     "ADMIN" as const,
      credits:  9999,
      plan:     "max",
    },
    {
      name:     "Staff Member",
      email:    "staff@pixelmind.ai",
      password: "Staff@123456",       // ← đổi mật khẩu theo ý
      role:     "STAFF" as const,
      credits:  999,
      plan:     "pro",
    },
  ];

  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, SALT_ROUNDS);

    const user = await prisma.user.upsert({
      where:  { email: acc.email },
      update: { role: acc.role, password: hash },
      create: {
        name:     acc.name,
        email:    acc.email,
        password: hash,
        role:     acc.role,
        credits:  acc.credits,
        plan:     acc.plan,
      },
    });

    console.log(`✅ [${user.role}] ${user.email} — id: ${user.id}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
