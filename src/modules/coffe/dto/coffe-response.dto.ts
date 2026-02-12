// src/modules/coffee-assistant/dto/coffe-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class BrewStepDto {
  @ApiProperty()
  step: string;

  @ApiProperty()
  detail: string;
}

export class CoffeeGuideDto {
  @ApiProperty({ type: [BrewStepDto] })
  steps: BrewStepDto[];

  @ApiProperty({ required: false })
  ratio?: number;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  waterTemp?: number;

  @ApiProperty({ required: false })
  grindSize?: 'COARSE' | 'MEDIUM' | 'MEDIUM-FINE' | 'FINE';

  @ApiProperty({ required: false })
  milkVolume?: number;

  @ApiProperty({ required: false })
  milkTemp?: number;

  @ApiProperty({ required: false })
  foamDensity?: 'THIN' | 'MEDIUM' | 'THICK';
}
