import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { BrandResponseDto } from './dto/brand-response.dto';
import { CreateBrandDto } from './dto/create-brand.dto';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @ApiOkResponse({ type: BrandResponseDto, isArray: true })
  findAll() {
    return this.brandsService.findAll();
  }

  @Get(':slug')
  @ApiOkResponse({ type: BrandResponseDto })
  getBySlug(@Param('slug') slug: string) {
    return this.brandsService.getBySlug(slug);
  }

  @Post()
  @ApiCreatedResponse({ type: BrandResponseDto })
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }
}
