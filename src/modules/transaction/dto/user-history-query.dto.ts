import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsInt,
  Min
} from "class-validator";
import { Type } from "class-transformer";

export class UserHistoryQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10

  @ApiPropertyOptional({ example: 'ORD-0001' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsString()
  endDate?: string
}
