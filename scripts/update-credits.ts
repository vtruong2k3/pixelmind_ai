import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.feature.updateMany({
    data: { creditCost: 10 },
  });
  console.log(`Updated ${result.count} features to 10 credits each`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
