import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';

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
}
