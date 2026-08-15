import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  list(@Query('page') page?: number, @Query('pageSize') pageSize?: number) {
    return this.productsService.list(page, pageSize);
  }

  @Get(':slug')
  @ApiOkResponse({ type: ProductResponseDto })
  getBySlug(@Param('slug') slug: string) {
    return this.productsService.getBySlug(slug);
  }

  @Post()
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
