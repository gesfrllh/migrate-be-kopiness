import { Injectable, NotFoundException, Req } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateProductDto, userId: string) {
    return this.prisma.product.create({
      data: {
        ...dto,
        createdById: userId,
      },
    });
  }

  async findAllByUser(userId: string) {
   const products = await this.prisma.product.findMany({
      where: {
        createdById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    return products
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

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
