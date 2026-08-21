import { Injectable, NotFoundException } from '@nestjs/common';
import { BrandsRepository } from './brands.repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

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

  create(dto: CreateBrandDto) {
    return this.brandsRepo.create(dto);
  }

  async update(id: string, dto: UpdateBrandDto) {
    const updated = await this.brandsRepo.update(id, dto);
    if (!updated) throw new NotFoundException(`Brand "${id}" not found`);
    return updated;
  }

  async delete(id: string) {
    const deleted = await this.brandsRepo.delete(id);
    if (!deleted) throw new NotFoundException(`Brand "${id}" not found`);
  }
}
