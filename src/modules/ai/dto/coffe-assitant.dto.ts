import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsNumber,
  IsInt,
  Min,
  Max
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CoffeeAssistantDto {

  @ApiProperty({
    example: 'ESPRESSO',
    enum: ['V60', 'FRENCH_PRESS', 'ESPRESSO', 'LATTE', 'AEROPRESS'],
  })
  @IsString()
  @IsIn(['V60', 'FRENCH_PRESS', 'ESPRESSO', 'LATTE', 'AEROPRESS'])
  method: string;

  @ApiProperty({
    example: 'medium',
    enum: ['light', 'medium', 'dark'],
  })
  @IsString()
  @IsIn(['light', 'medium', 'dark'])
  roastLevel: string;

  @ApiProperty({
    example: 'balanced',
    description: 'User taste preference'
  })
  @IsString()
  tastePreference: string;

  @ApiPropertyOptional({
    example: 'FULL_CREAM',
    enum: ['FULL_CREAM', 'OAT', 'SOY', 'ALMOND']
  })
  @IsOptional()
  @IsString()
  milkType?: string;

  @ApiPropertyOptional({
    example: 'VANILLA',
    enum: ['VANILLA', 'CARAMEL', 'HAZELNUT']
  })
  @IsOptional()
  @IsString()
  syrupType?: string;

  @ApiPropertyOptional({
    example: 'BREW',
    enum: ['BREW', 'MILK']
  })
  @IsOptional()
  @IsString()
  drinkType?: string;

  @ApiPropertyOptional({
    example: true
  })
  @IsOptional()
  @IsBoolean()
  ice?: boolean;


  @ApiProperty({ example: 'LIGHT', enum: ['LIGHT', 'BALANCED', 'STRONG'] })
  @IsString()
  strength?: string;

  @ApiPropertyOptional({
    example: 'terlalu asam'
  })
  @IsOptional()
  @IsString()
  problem?: string;

  @ApiPropertyOptional({
    example: 'beginner',
    enum: ['beginner', 'intermediate', 'advanced']
  })
  @IsOptional()
  @IsString()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  experienceLevel?: string;

  /* Optional: Kalau mau AI lebih presisi */

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsNumber()
  coffeeDose?: number;

  @ApiPropertyOptional({ example: 270 })
  @IsOptional()
  @IsNumber()
  waterAmount?: number;

  @ApiPropertyOptional({ example: '1:15' })
  @IsOptional()
  @IsString()
  ratio?: string;

  @ApiPropertyOptional({ example: 93 })
  @IsOptional()
  @IsInt()
  @Min(80)
  @Max(100)
  temperature?: number;

  @ApiPropertyOptional({ example: 'Medium-Fine' })
  @IsOptional()
  @IsString()
  grindSize?: string;
}
