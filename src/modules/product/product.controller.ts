import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto'; 
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { ApiBody, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ProductResponseDto } from './dto/product.dto';

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
  findAll() {
    return this.productService.findAll();
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
