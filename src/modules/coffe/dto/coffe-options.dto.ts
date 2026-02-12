import { ApiProperty } from '@nestjs/swagger';

class SelectOptionDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string;
}

export class CoffeeAssistantOptionsDto {
  @ApiProperty({ type: [SelectOptionDto] })
  roastLevels: SelectOptionDto[];

  @ApiProperty({ type: [SelectOptionDto] })
  strength: SelectOptionDto[];

  @ApiProperty({ type: [SelectOptionDto] })
  drinkTypes: SelectOptionDto[];

  @ApiProperty({ type: [SelectOptionDto] })
  drinkNames: SelectOptionDto[];

  @ApiProperty({ type: [SelectOptionDto] })
  milkTypes: SelectOptionDto[];

  @ApiProperty({ type: [SelectOptionDto] })
  syrupTypes: SelectOptionDto[];
}
