import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async ensureCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }
    return cart;
  }

  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, price: true, stock: true, imageUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!cart) return { id: '', totalItems: 0, totalPrice: 0, items: [] };

    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.imageUrl?.[0] ?? '',
      price: item.product.price,
      quantity: item.quantity,
      subTotal: item.product.price * item.quantity,
      stock: item.product.stock,
    }));

    return {
      id: cart.id,
      totalItems: items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: items.reduce((s, i) => s + i.subTotal, 0),
      items,
    };
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartResponseDto> {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.stock < 1) throw new BadRequestException('Product out of stock');

    const cart = await this.ensureCart(userId);

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
    });

    const newQty = existing ? existing.quantity + dto.quantity : dto.quantity;
    if (newQty > product.stock) throw new BadRequestException(`Only ${product.stock} items available`);

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, productId: dto.productId, quantity: dto.quantity },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, productId: string, dto: UpdateCartItemDto): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (!item) throw new NotFoundException('Item not in cart');

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (dto.quantity > product.stock) throw new BadRequestException(`Only ${product.stock} items available`);

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (!item) throw new NotFoundException('Item not in cart');

    await this.prisma.cartItem.delete({ where: { id: item.id } });

    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<{ message: string }> {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { message: 'Cart cleared' };
  }
}
