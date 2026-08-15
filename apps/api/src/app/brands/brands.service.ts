import { Injectable, NotFoundException } from '@nestjs/common';
import { BrandsRepository } from './brands.repository';

@Injectable()
export class BrandsService {
  constructor(private readonly brandsRepo: BrandsRepository) {}

  findAll() {
    return this.brandsRepo.findAll();
  }

  async getBySlug(slug: string) {
    const brand = await this.brandsRepo.findBySlug(slug);
    if (!brand) throw new NotFoundException(`Brand "${slug}" not found`);
    return brand;
  }
}
