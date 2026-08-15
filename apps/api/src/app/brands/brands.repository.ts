import { Injectable } from '@nestjs/common';
import { BrandResponseDto } from './dto/brand-response.dto';

export abstract class BrandsRepository {
  abstract findAll(): Promise<BrandResponseDto[]>;
  abstract findBySlug(slug: string): Promise<BrandResponseDto | null>;
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
}
