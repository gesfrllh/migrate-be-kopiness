import { PrismaClient, RoastLevel, UserRole } from "@prisma/client";
import * as argon2 from 'argon2'

const prisma = new PrismaClient();

async function main() {
  // ── SUPERADMIN ──
  const hashed = await argon2.hash('adminPassword')
  const superadmin = await prisma.user.upsert({
    where: { email: "superadmin@kopi.com" },
    update: {},
    create: {
      name: "Superadmin Kopi",
      email: "superadmin@kopi.com",
      password: hashed,
      role: UserRole.SUPERADMIN,
    },
  });

  // ── CUSTOMER ──
  const customerHashed = await argon2.hash('customerPassword')
  await prisma.user.upsert({
    where: { email: "customer@kopi.com" },
    update: {},
    create: {
      name: "Customer Satu",
      email: "customer@kopi.com",
      password: customerHashed,
      role: UserRole.CUSTOMER,
    },
  });

  // ── STOREOWNER + STORE ──
  const ownerHashed = await argon2.hash('ownerPassword')
  const storeOwner = await prisma.user.upsert({
    where: { email: "owner@kopi.com" },
    update: {},
    create: {
      name: "Budi Pemilik Toko",
      email: "owner@kopi.com",
      password: ownerHashed,
      role: UserRole.STOREOWNER,
    },
  });

  await prisma.store.upsert({
    where: { slug: "kopiness-store" },
    update: {},
    create: {
      name: "Kopiness Store",
      slug: "kopiness-store",
      description: "Toko kopi premium",
      address: "Jl. Sudirman No. 1, Jakarta",
      phone: "021-12345678",
      latitude: -6.2088,
      longitude: 106.8456,
      ownerId: storeOwner.id,
    },
  });

  // ── PRODUCTS ──
  const store = await prisma.store.findUnique({ where: { slug: "kopiness-store" } });
  const storeId = store?.id ?? undefined;

  const productNames = [
    "Gayo Arabica",
    "Toraja Kalosi",
    "Kintamani Bali",
    "Flores Bajawa",
    "Java Preanger",
  ];

  await prisma.product.deleteMany({
    where: { name: { in: productNames } },
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
        imageUrl: ["https://example.com/gayo.jpg"],
        createdById: storeOwner.id,
        storeId,
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
        imageUrl: ["https://example.com/toraja.jpg"],
        createdById: storeOwner.id,
        storeId,
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
        imageUrl: ["https://example.com/kintamani.jpg"],
        createdById: storeOwner.id,
        storeId,
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
        imageUrl: ["https://example.com/flores.jpg"],
        createdById: storeOwner.id,
        storeId,
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
        imageUrl: ["https://example.com/preanger.jpg"],
        createdById: storeOwner.id,
        storeId,
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
