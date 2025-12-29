import { ApiProperty } from '@nestjs/swagger'
import { RoastLevel } from '@prisma/client'

class CreatedByDto {
  @ApiProperty({ example: 'string' })
  id: string

  @ApiProperty({ example: 'string' })
  name: string
}

export class ProductResponseDto {
  @ApiProperty({ example: 'string' })
  id: string

  @ApiProperty({ example: 'string' })
  name: string

  @ApiProperty({ example: 'string' })
  description: string

  @ApiProperty({ example: 'string' })
  origin: string

  @ApiProperty({ enum: RoastLevel })
  roastLevel: RoastLevel

  @ApiProperty({ example: 'string' })
  process: string

  @ApiProperty({ example: 'string' })
  flavorNotes: string

  @ApiProperty({ example: 85000 })
  price: number

  @ApiProperty({ example: 100 })
  stock: number

  @ApiProperty({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    type: [String],
  })
  imageUrl: string[]

  @ApiProperty({ type: CreatedByDto })
  createdBy: CreatedByDto
}
