import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepo: CategoriesRepository) {}

  getTree() {
    return this.categoriesRepo.findTree();
  }

  async getBySlug(slug: string) {
    const category = await this.categoriesRepo.findBySlug(slug);
    if (!category) throw new NotFoundException(`Category "${slug}" not found`);
    return category;
  }

  create(dto: CreateCategoryDto) {
    return this.categoriesRepo.create(dto);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const updated = await this.categoriesRepo.update(id, dto);
    if (!updated) throw new NotFoundException(`Category "${id}" not found`);
    return updated;
  }

  async delete(id: string) {
    const deleted = await this.categoriesRepo.delete(id);
    if (!deleted) throw new NotFoundException(`Category "${id}" not found`);
  }
}
