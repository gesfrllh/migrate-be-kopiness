import { RoastLevel } from '@prisma/client';

export class ProductEntity {
  id: string;
  name: string;
  description: string;
  origin: string;
  roastLevel: RoastLevel;
  process: string;
  flavorNotes: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
