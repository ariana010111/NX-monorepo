import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { BrandResponseDto } from './dto/brand-response.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Public()
  @Get()
  @ApiOkResponse({ type: BrandResponseDto, isArray: true })
  findAll() {
    return this.brandsService.findAll();
  }

  @Public()
  @Get(':slug')
  @ApiOkResponse({ type: BrandResponseDto })
  getBySlug(@Param('slug') slug: string) {
    return this.brandsService.getBySlug(slug);
  }

  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @Post()
  @ApiCreatedResponse({ type: BrandResponseDto })
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }
}
