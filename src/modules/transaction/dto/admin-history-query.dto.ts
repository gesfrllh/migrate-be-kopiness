import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { TransactionStatus, PaymentMethod } from '@prisma/client'

export class AdminHistoryQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20

  @ApiPropertyOptional({ example: 'ORD-2024' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  status?: TransactionStatus

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  method?: PaymentMethod

  @ApiPropertyOptional({ example: 'user-id-uuid' })
  @IsOptional()
  @IsString()
  userId?: string

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string

  @ApiPropertyOptional({ example: '2024-01-31' })
  @IsOptional()
  @IsString()
  endDate?: string
}
