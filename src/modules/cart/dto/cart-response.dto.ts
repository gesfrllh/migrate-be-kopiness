import { ApiProperty } from '@nestjs/swagger';

class CartItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() productId: string;
  @ApiProperty() productName: string;
  @ApiProperty() productImage: string;
  @ApiProperty() price: number;
  @ApiProperty() quantity: number;
  @ApiProperty() subTotal: number;
  @ApiProperty() stock: number;
}

export class CartResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() totalItems: number;
  @ApiProperty() totalPrice: number;
  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];
}
