import { ApiProperty } from '@nestjs/swagger'
import { RoastLevel } from '@prisma/client'

class StoreProductDto {
  @ApiProperty() id: string
  @ApiProperty() name: string
  @ApiProperty() description: string
  @ApiProperty() origin: string
  @ApiProperty({ enum: RoastLevel }) roastLevel: RoastLevel
  @ApiProperty() process: string
  @ApiProperty() flavorNotes: string
  @ApiProperty() price: number
  @ApiProperty() stock: number
  @ApiProperty({ type: [String] }) imageUrl: string[]
}

class StoreOwnerDto {
  @ApiProperty() id: string
  @ApiProperty() name: string
}

export class StoreDetailResponseDto {
  @ApiProperty() id: string
  @ApiProperty() name: string
  @ApiProperty() slug: string
  @ApiProperty({ required: false }) description?: string
  @ApiProperty({ required: false }) logoUrl?: string
  @ApiProperty({ required: false }) address?: string
  @ApiProperty({ required: false }) phone?: string
  @ApiProperty({ required: false }) latitude?: number
  @ApiProperty({ required: false }) longitude?: number
  @ApiProperty({ required: false }) distance?: number
  @ApiProperty({ type: StoreOwnerDto }) owner: StoreOwnerDto
  @ApiProperty({ type: [StoreProductDto] }) products: StoreProductDto[]
}
