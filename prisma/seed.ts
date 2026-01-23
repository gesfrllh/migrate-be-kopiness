import { PrismaClient, RoastLevel, UserRole } from "@prisma/client";
import * as argon2 from 'argon2'
 
const prisma = new PrismaClient();


async function main() {
  
  const hashed = await argon2.hash('adminPassword')
  const admin = await prisma.user.upsert({
    where: { email: "admin@kopi.com" },
    update: {},
    create: {
      name: "Admin Kopi",
      email: "admin@kopi.com",
      password: hashed,
      role: UserRole.ADMIN,
    },
  });

  await prisma.product.createMany({
    data: [
      {
        name: "Gayo Arabica",
        description: "Kopi Arabica dari dataran tinggi Gayo, Aceh",
        origin: "Aceh, Indonesia",
        roastLevel: RoastLevel.MEDIUM,
        process: "Washed",
        flavorNotes: "Citrus, Floral, Clean",
        price: 85000,
        stock: 100,
        imageUrl: "https://example.com/gayo.jpg",
        createdById: admin.id,
      },
      {
        name: "Toraja Kalosi",
        description: "Kopi khas Toraja dengan body tebal dan earthy",
        origin: "Toraja, Sulawesi",
        roastLevel: RoastLevel.DARK,
        process: "Semi Washed",
        flavorNotes: "Earthy, Dark Chocolate, Spices",
        price: 90000,
        stock: 80,
        imageUrl: "https://example.com/toraja.jpg",
        createdById: admin.id,
      },
      {
        name: "Kintamani Bali",
        description: "Kopi Bali dengan karakter asam segar dan fruity",
        origin: "Kintamani, Bali",
        roastLevel: RoastLevel.LIGHT,
        process: "Washed",
        flavorNotes: "Orange, Fruity, Sweet",
        price: 80000,
        stock: 120,
        imageUrl: "https://example.com/kintamani.jpg",
        createdById: admin.id,
      },
      {
        name: "Flores Bajawa",
        description: "Kopi dari Flores dengan rasa coklat dan karamel",
        origin: "Flores, NTT",
        roastLevel: RoastLevel.MEDIUM,
        process: "Honey",
        flavorNotes: "Chocolate, Caramel, Nutty",
        price: 88000,
        stock: 70,
        imageUrl: "https://example.com/flores.jpg",
        createdById: admin.id,
      },
      {
        name: "Java Preanger",
        description: "Kopi klasik dari Jawa Barat dengan rasa balance",
        origin: "Jawa Barat",
        roastLevel: RoastLevel.MEDIUM,
        process: "Washed",
        flavorNotes: "Nutty, Sweet, Mild Acidity",
        price: 82000,
        stock: 90,
        imageUrl: "https://example.com/preanger.jpg",
        createdById: admin.id,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
