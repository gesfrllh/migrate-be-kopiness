// dto/product-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { RoastLevel } from '@prisma/client';

class CreatedByDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  origin: string;

  @ApiProperty({ enum: RoastLevel })
  roastLevel: RoastLevel;

  @ApiProperty()
  process: string;

  @ApiProperty()
  flavorNotes: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stock: number;

  @ApiProperty({ required: false })
  imageUrl?: string;

  @ApiProperty({ type: CreatedByDto })
  createdBy: CreatedByDto;
}
