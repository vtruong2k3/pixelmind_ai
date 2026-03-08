const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.feature.updateMany({
    where: { slug: 'text_to_image' },
    data: { imageCount: 0 }
  });
  console.log('Update successful. Checking DB row...');
  const f = await prisma.feature.findUnique({ where: { slug: 'text_to_image' } });
  console.log(f);
}

main().catch(console.error).finally(() => prisma.$disconnect());
