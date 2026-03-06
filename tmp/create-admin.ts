import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@gmail.com";
  const password = "admin"; // Default admin password
  const name = "Admin User";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`User ${email} already exists. Updating credits and plan...`);
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        credits: 9999,
        plan: "pro",
      },
    });
  } else {
    console.log(`Creating user ${email}...`);
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        credits: 9999,
        plan: "pro",
      },
    });
  }

  console.log("Admin account setup complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
