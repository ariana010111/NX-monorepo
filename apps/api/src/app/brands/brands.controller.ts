import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { BrandResponseDto } from './dto/brand-response.dto';

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
}
