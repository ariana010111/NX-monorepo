import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permission, Permissions } from '../auth/permissions';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOkResponse({ type: CategoryResponseDto, isArray: true })
  getTree() {
    return this.categoriesService.getTree();
  }

  @Public()
  @Get(':slug')
  @ApiOkResponse({ type: CategoryResponseDto })
  getBySlug(@Param('slug') slug: string) {
    return this.categoriesService.getBySlug(slug);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @Permissions(Permission.CategoriesWrite)
  @ApiBearerAuth()
  @Post()
  @ApiCreatedResponse({ type: CategoryResponseDto })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @Permissions(Permission.CategoriesWrite)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOkResponse({ type: CategoryResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @Permissions(Permission.CategoriesWrite)
  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
