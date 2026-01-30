import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import {
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiTags,
  ApiBearerAuth
} from '@nestjs/swagger';
import { ProductResponseDto } from './dto/product.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decarotar';
import type { JwtPayload } from 'jsonwebtoken';
import { ProductListResponseDto } from './dto/productListRespons.dto';
import { PaginationQueryDto } from './dto/paginationQueryDto';

@ApiTags('Product')
@ApiBearerAuth()
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  @UseGuards(JwtGuard)
  @ApiBody({ type: CreateProductDto })
  @ApiCreatedResponse({
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  create(
    @Body() dto: CreateProductDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.productService.create(dto, userId);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiOkResponse({
    description: 'List All Product',
    type: ProductListResponseDto,
  })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.productService.findAllByUser(
      user.id,
      Number(query.page) || 1,
      Number(query.limit) || 10,
      query.search,
    );

    return {
      data: result.data,
      meta: result.meta
    }
  }


  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
