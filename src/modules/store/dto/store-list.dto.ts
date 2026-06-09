import { ApiProperty } from '@nestjs/swagger'

class StoreListItemDto {
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
  @ApiProperty() productCount: number
}

export class StoreListResponseDto {
  @ApiProperty({ type: [StoreListItemDto] })
  data: StoreListItemDto[]
}
