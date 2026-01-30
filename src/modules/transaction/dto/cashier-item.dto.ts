import { ApiProperty } from "@nestjs/swagger";

export class CashierItemDto {
  @ApiProperty()
  productId: string

  @ApiProperty()
  productName: string

  @ApiProperty()
  price: number

  @ApiProperty()
  quantity: number

  @ApiProperty()
  subTotal: number
}