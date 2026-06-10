import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateProductDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) throw new NotFoundException('User not found');

    let storeId = dto.storeId;

    if (!storeId && user.role === UserRole.STOREOWNER) {
      const store = await this.prisma.store.findFirst({
        where: { ownerId: userId, isActive: true },
        select: { id: true },
      });
      if (!store) throw new BadRequestException('You have no active store');
      storeId = store.id;
    }

    if (storeId && user.role === UserRole.STOREOWNER) {
      const owned = await this.prisma.store.findFirst({
        where: { id: storeId, ownerId: userId },
        select: { id: true },
      });
      if (!owned) throw new ForbiddenException('Store does not belong to you');
    }

    return this.prisma.product.create({
      data: {
        ...dto,
        storeId,
        createdById: userId,
      },
    });
  }
  async findAllByUser(
    userId: string,
    role: UserRole,
    page = 1,
    limit = 10,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role === UserRole.STOREOWNER) {
      const storeIds = await this.prisma.store.findMany({
        where: { ownerId: userId, isActive: true },
        select: { id: true },
      });
      where.storeId = { in: storeIds.map((s) => s.id) };
    } else if (role === UserRole.CUSTOMER) {
      where.storeId = { not: null };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });

    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const product = await this.findOne(id);

    if (product.createdBy.id !== userId) {
      throw new ForbiddenException('You do not own this product');
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const product = await this.findOne(id);

    if (product.createdBy.id !== userId) {
      throw new ForbiddenException('You do not own this product');
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
