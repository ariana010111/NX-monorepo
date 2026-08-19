import { Injectable } from '@nestjs/common';
import { BrandResponseDto } from './dto/brand-response.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

export abstract class BrandsRepository {
  abstract findAll(): Promise<BrandResponseDto[]>;
  abstract findBySlug(slug: string): Promise<BrandResponseDto | null>;
  abstract create(dto: CreateBrandDto): Promise<BrandResponseDto>;
  abstract update(id: string, dto: UpdateBrandDto): Promise<BrandResponseDto | null>;
  abstract delete(id: string): Promise<boolean>;
}

/** TEMPORARY in-memory implementation — same pattern as ProductsRepository. */
@Injectable()
export class InMemoryBrandsRepository implements BrandsRepository {
  private brands: BrandResponseDto[] = [
    { id: 'b1', name: 'Lumière', slug: 'lumiere' },
    { id: 'b2', name: 'Verdant Botanics', slug: 'verdant-botanics' },
  ];

  async findAll() {
    return this.brands;
  }
  async findBySlug(slug: string) {
    return this.brands.find((b) => b.slug === slug) ?? null;
  }
  async create(dto: CreateBrandDto) {
    const created: BrandResponseDto = { id: `b${Date.now()}`, ...dto };
    this.brands.push(created);
    return created;
  }
  async update(id: string, dto: UpdateBrandDto) {
    const brand = this.brands.find((b) => b.id === id);
    if (!brand) return null;
    Object.assign(brand, dto);
    return brand;
  }
  async delete(id: string) {
    const index = this.brands.findIndex((b) => b.id === id);
    if (index === -1) return false;
    this.brands.splice(index, 1);
    return true;
  }
}
