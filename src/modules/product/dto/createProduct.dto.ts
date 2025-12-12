import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RoastLevel } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsString()
  origin: string;

  @IsEnum(RoastLevel)
  roastLevel: RoastLevel;

  @IsString()
  process: string;

  @IsString()
  flavorNotes: string;

  @IsInt()
  price: number;

  @IsInt()
  stock: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
