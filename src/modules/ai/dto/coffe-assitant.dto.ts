import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CoffeeAssistantDto {
  @ApiProperty({
    example: 'V60',
    enum: ['V60', 'French Press', 'Espresso', 'Latte', 'Aeropress'],
  })
  @IsString()
  @IsIn(['V60', 'French Press', 'Espresso', 'Latte', 'Aeropress'])
  method: string;

  @ApiProperty({
    example: 'medium',
    enum: ['light', 'medium', 'dark'],
  })
  @IsString()
  @IsIn(['light', 'medium', 'dark'])
  roastLevel: string;

  @ApiProperty({
    example: 'balanced and sweet',
  })
  @IsString()
  tastePreference: string;

  @ApiPropertyOptional({
    example: 'terlalu asam',
  })
  @IsOptional()
  @IsString()
  problem?: string;

  @ApiPropertyOptional({
    example: 'beginner',
  })
  @IsOptional()
  @IsString()
  experienceLevel?: string;
}
