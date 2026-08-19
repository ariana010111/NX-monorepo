import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiQuery, ApiNoContentResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { AddImageDto } from './dto/add-image.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'brand', required: false, type: String })
  list(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
  ) {
    return this.productsService.list(page, pageSize, category, brand);
  }

  // Admin-only lookup by internal id (customer-facing lookups go through
  // getBySlug below). Requires auth — no @Public() here.
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @Get('by-id/:id')
  @ApiOkResponse({ type: ProductResponseDto })
  getById(@Param('id') id: string) {
    return this.productsService.getById(id);
  }

  @Public()
  @Get(':slug')
  @ApiOkResponse({ type: ProductResponseDto })
  getBySlug(@Param('slug') slug: string) {
    return this.productsService.getBySlug(slug);
  }

  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @Post()
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOkResponse({ type: ProductResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  // Closes the gap that made admin-created products unpurchasable: a
  // product with no variants has nothing to select or add to cart, and
  // reserveForOrder() has no inventory row to find. This creates both the
  // variant AND its inventory record together (see ProductsService.addVariant).
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @Post(':id/variants')
  @ApiCreatedResponse({ type: ProductResponseDto })
  addVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.productsService.addVariant(id, dto);
  }

  // URL-based, not a file upload — no object storage wired into this
  // sandbox (see AddImageDto for why).
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @Post(':id/images')
  @ApiCreatedResponse({ type: ProductResponseDto })
  addImage(@Param('id') id: string, @Body() dto: AddImageDto) {
    return this.productsService.addImage(id, dto);
  }
}
