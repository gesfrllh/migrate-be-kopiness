import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOkResponse({ type: CartResponseDto })
  getCart(@Req() req): Promise<CartResponseDto> {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  @ApiBody({ type: AddCartItemDto })
  addItem(@Req() req, @Body() dto: AddCartItemDto): Promise<CartResponseDto> {
    return this.cartService.addItem(req.user.id, dto);
  }

  @Patch('items/:productId')
  @ApiBody({ type: UpdateCartItemDto })
  updateItem(
    @Req() req,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItem(req.user.id, productId, dto);
  }

  @Delete('items/:productId')
  removeItem(@Req() req, @Param('productId') productId: string): Promise<CartResponseDto> {
    return this.cartService.removeItem(req.user.id, productId);
  }

  @Delete()
  clearCart(@Req() req): Promise<{ message: string }> {
    return this.cartService.clearCart(req.user.id);
  }
}
