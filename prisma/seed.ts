import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const features = [
  {
    slug: "insert_object",
    name: "Ghép vật thể",
    nameEn: "Object Insertion",
    description: "Ghép vật thể từ ảnh 2 vào ảnh 1 một cách tự nhiên",
    prompt:
      "Have the woman in Figure 1 hold the bag in Figure 2 while displaying the bag, keeping the woman's facial features unchanged.",
    category: "fashion",
    imageCount: 2,
    sortOrder: 1,
    creditCost: 2,
  },
  {
    slug: "swap_swimsuit",
    name: "Thay đồ bơi",
    nameEn: "Swimsuit Swap",
    description: "Thay đồ bơi từ ảnh 2 vào người trong ảnh 1",
    prompt:
      "Replace the swimsuit in Figure 1 with the swimsuit in Figure 2, while keeping the composition and lighting of Figure 1 unchanged.",
    category: "fashion",
    imageCount: 2,
    sortOrder: 2,
    creditCost: 2,
  },
  {
    slug: "swap_background",
    name: "Ghép background",
    nameEn: "Background Swap",
    description: "Thay nền / phong cảnh từ ảnh 2 vào ảnh 1",
    prompt:
      "If the scene in Figure 1 is replaced with the scene in Figure 2, the objects and the scene are physically integrated in terms of perspective, lighting, and material mapping, while the object poses remain unchanged.",
    category: "photo_edit",
    imageCount: 2,
    sortOrder: 3,
    creditCost: 2,
  },
  {
    slug: "swap_face",
    name: "Thay khuôn mặt",
    nameEn: "Face Swap",
    description: "Thay khuôn mặt từ ảnh 2 vào ảnh 1",
    prompt:
      "Replace the face in Figure 1 with the face in Figure 2, keeping the shape of the surrounding landscape and objects unchanged.",
    category: "fashion",
    imageCount: 2,
    sortOrder: 4,
    creditCost: 2,
  },
  {
    slug: "swap_shirt",
    name: "Thay áo",
    nameEn: "Shirt Swap",
    description: "Thay chiếc áo từ ảnh 1 vào người trong ảnh 2",
    prompt:
      "Replace the shirt in image 2 with the shirt in image 1, keeping the printed pattern and colors on the shirt in image 2 the same.",
    category: "fashion",
    imageCount: 2,
    sortOrder: 5,
    creditCost: 2,
  },
  {
    slug: "change_color",
    name: "Thay màu quần áo",
    nameEn: "Change Outfit Color",
    description: "Đổi màu quần áo trong ảnh",
    prompt:
      "The color of the outfit in the photo turns red, keeping the object in the same light and color as the surrounding object.",
    category: "fashion",
    imageCount: 1,
    sortOrder: 6,
    creditCost: 1,
  },
  {
    slug: "extract_clothing",
    name: "Lấy quần áo khỏi người",
    nameEn: "Extract Clothing",
    description: "Tách quần áo từ người và trải phẳng",
    prompt: "Extract the clothing from the photo and lay it flat.",
    category: "fashion",
    imageCount: 1,
    sortOrder: 7,
    creditCost: 1,
  },
  {
    slug: "to_anime",
    name: "Ảnh thật → Anime",
    nameEn: "Photo to Anime",
    description: "Biến ảnh thật thành phong cách anime",
    prompt: "Transform photos into anime style",
    category: "creative",
    imageCount: 1,
    sortOrder: 8,
    creditCost: 1,
  },
  {
    slug: "drawing_to_photo",
    name: "Tranh vẽ → Ảnh thật",
    nameEn: "Drawing to Photo",
    description: "Biến tranh vẽ đen trắng thành ảnh thật",
    prompt:
      "Transforming black and white images into images with realistic human skin tones, harmonious lighting, and preserving details and objects in the image.",
    category: "creative",
    imageCount: 1,
    sortOrder: 9,
    creditCost: 1,
  },
  {
    slug: "restore_photo",
    name: "Phục hồi ảnh cũ",
    nameEn: "Old Photo Restoration",
    description: "Phục hồi và làm mới ảnh cũ bị hỏng",
    prompt:
      "Restore this old photo into a clean, high-quality modern photograph. Remove scratches, stains, dust, noise, blur, and damage. Enhance sharpness and clarity while preserving the original face, identity, expression, and details. Improve lighting, contrast, and dynamic range. High resolution, ultra-detailed, natural skin texture, realistic colors, professional photography quality.",
    category: "photo_edit",
    imageCount: 1,
    sortOrder: 10,
    creditCost: 1,
  },
];

async function main() {
  console.log("🌱 Seeding features...");

  for (const feature of features) {
    const upserted = await prisma.feature.upsert({
      where: { slug: feature.slug },
      update: {
        name: feature.name,
        nameEn: feature.nameEn,
        description: feature.description,
        prompt: feature.prompt,
        category: feature.category,
        imageCount: feature.imageCount,
        sortOrder: feature.sortOrder,
        creditCost: feature.creditCost,
      },
      create: feature,
    });
    console.log(`  ✅ ${upserted.name} (${upserted.slug})`);
  }

  console.log(`\n✨ Seeded ${features.length} features successfully!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
