import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { BrandResponseDto } from './dto/brand-response.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permission, Permissions } from '../auth/permissions';

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

  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @Permissions(Permission.BrandsWrite)
  @ApiBearerAuth()
  @Post()
  @ApiCreatedResponse({ type: BrandResponseDto })
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @Permissions(Permission.BrandsWrite)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOkResponse({ type: BrandResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @Permissions(Permission.BrandsWrite)
  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  delete(@Param('id') id: string) {
    return this.brandsService.delete(id);
  }
}
