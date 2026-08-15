import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOkResponse({ type: CategoryResponseDto, isArray: true })
  getTree() {
    return this.categoriesService.getTree();
  }

  @Get(':slug')
  @ApiOkResponse({ type: CategoryResponseDto })
  getBySlug(@Param('slug') slug: string) {
    return this.categoriesService.getBySlug(slug);
  }

  @Post()
  @ApiCreatedResponse({ type: CategoryResponseDto })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }
}
