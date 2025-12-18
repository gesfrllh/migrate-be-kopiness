import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto'; 
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ProductResponseDto } from './dto/product.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decarotar';
import type { JwtPayload } from 'jsonwebtoken';
import { successResponse } from 'src/common/utils/api-response';

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
    type: ProductResponseDto,
    isArray: true
  })
  async findAll(@CurrentUser() user: JwtPayload) {
    const products = await this.productService.findAllByUser(user.id);
    if(products.length === 0) {
      return successResponse([], 'No Products Founds')
    }
    return successResponse(products, 'Products Fetched Successfuly')
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
