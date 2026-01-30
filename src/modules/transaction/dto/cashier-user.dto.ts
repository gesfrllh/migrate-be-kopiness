import { ApiProperty } from "@nestjs/swagger";

export class CashierUserDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  email: string
}