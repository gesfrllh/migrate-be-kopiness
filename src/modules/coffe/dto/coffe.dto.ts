// src/modules/coffee-assistant/dto/coffee-assistant.dto.ts
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type DrinkType = 'BREW' | 'MILK' | 'COLD'
export type DrinkName =
  | 'LATTE' | 'CAPPUCCINO' | 'FLAT_WHITE' | 'MOCHA' | 'ESPRESSO'
  | 'ICED_COFFEE' | 'KOPI_SUSU' | 'V60' | 'FRENCH_PRESS'
  | 'AEROPRESS' | 'KALITA' | 'CLEVER';


export class CoffeeAssistantDto {
  @ApiProperty({ enum: ['BREW', 'MILK', 'COLD'] })
  @IsEnum(['BREW', 'MILK', 'COLD'])
  drinkType: DrinkType;

  @ApiProperty({
    enum: [
      'LATTE', 'CAPPUCCINO', 'FLAT_WHITE', 'MOCHA', 'ESPRESSO', 'ICED_COFFEE',
      'KOPI_SUSU', 'V60', 'FRENCH_PRESS', 'AEROPRESS', 'KALITA', 'CLEVER'
    ]
  })
  @IsEnum([
    'LATTE', 'CAPPUCCINO', 'FLAT_WHITE', 'MOCHA', 'ESPRESSO', 'ICED_COFFEE',
    'KOPI_SUSU', 'V60', 'FRENCH_PRESS', 'AEROPRESS', 'KALITA', 'CLEVER'
  ])
  drinkName: DrinkName;

  @ApiProperty({ type: Number, description: 'Coffee dose in grams' })
  @IsNumber()
  dose: number;

  @ApiProperty({ enum: ['LIGHT', 'MEDIUM', 'DARK'] })
  @IsEnum(['LIGHT', 'MEDIUM', 'DARK'])
  roastLevel: string;

  @ApiProperty({ enum: ['LIGHT', 'BALANCED', 'STRONG'] })
  @IsEnum(['LIGHT', 'BALANCED', 'STRONG'])
  strength: string;

  @ApiPropertyOptional({ enum: ['WHOLE', 'SKIM', 'OAT', 'ALMOND'] })
  @IsOptional()
  @IsString()
  milkType?: 'WHOLE' | 'SKIM' | 'OAT' | 'ALMOND';

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  syrupType?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  ice?: boolean;
}
