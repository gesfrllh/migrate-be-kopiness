import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { RoastLevel } from '@prisma/client'

export class CreateProductDto {
  @ApiProperty({
    example: 'Gayo Arabica',
    description: 'Nama produk kopi',
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    example: 'Kopi arabica dari dataran tinggi Gayo',
    description: 'Deskripsi produk',
  })
  @IsString()
  description: string

  @ApiProperty({
    example: 'Aceh, Indonesia',
    description: 'Asal daerah kopi',
  })
  @IsString()
  origin: string

  @ApiProperty({
    enum: RoastLevel,
    example: RoastLevel.MEDIUM,
    description: 'Tingkat roasting kopi',
  })
  @IsEnum(RoastLevel)
  roastLevel: RoastLevel

  @ApiProperty({
    example: 'Washed',
    description: 'Metode proses kopi',
  })
  @IsString()
  process: string

  @ApiProperty({
    example: 'Citrus, Floral, Clean',
    description: 'Catatan rasa kopi',
  })
  @IsString()
  flavorNotes: string

  @ApiProperty({
    example: 85000,
    description: 'Harga produk (dalam rupiah)',
  })
  @IsInt()
  price: number

  @ApiProperty({
    example: 100,
    description: 'Jumlah stok tersedia',
  })
  @IsInt()
  stock: number

  @ApiPropertyOptional({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    description: 'Daftar URL gambar produk',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[]
}
