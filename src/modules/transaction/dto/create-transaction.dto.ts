import { ApiProperty } from '@nestjs/swagger'
import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
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
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items: CreateTransactionItemDto[]
}
