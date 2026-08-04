import { ApiProperty } from '@nestjs/swagger'
import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  ArrayMinSize,
  IsString,
  IsLatitude,
  IsLongitude,
  MaxLength,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateTransactionItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number
}

export class CreateTransactionDto {
  @ApiProperty({ type: [CreateTransactionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items: CreateTransactionItemDto[]

  @ApiProperty({ example: 'Jl. Sudirman No. 1, Jakarta' })
  @IsString()
  @MaxLength(300)
  deliveryAddress: string

  @ApiProperty({ example: -6.4 })
  @IsLatitude()
  deliveryLatitude: number

  @ApiProperty({ example: 106.8 })
  @IsLongitude()
  deliveryLongitude: number
}
