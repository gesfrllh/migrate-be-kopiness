import { ApiProperty } from '@nestjs/swagger';

export class BrewStepDto {
  @ApiProperty()
  step: string;

  @ApiProperty()
  detail: string;
}

export class ProblemContextDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: ['RENDAH', 'SEDANG', 'TINGGI'] })
  severity: 'RENDAH' | 'SEDANG' | 'TINGGI';
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

  @ApiProperty({ type: [ProblemContextDto], required: false })
  potentialProblems?: ProblemContextDto[];
}
