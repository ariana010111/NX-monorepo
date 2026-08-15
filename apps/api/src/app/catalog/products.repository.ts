import { Injectable } from '@nestjs/common';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';

/**
 * Contract the service depends on. The Prisma-backed implementation
 * (ProductsPrismaRepository, using PrismaService — see apps/api/src/app/prisma)
 * is a drop-in replacement once `prisma generate` has run locally.
 * This in-memory version exists ONLY to validate the rest of the
 * architecture (build, OpenAPI, Orval, Angular consumption) without
 * being blocked by the sandbox's Prisma engine download restriction.
 */
export abstract class ProductsRepository {
  abstract findBySlug(slug: string): Promise<ProductResponseDto | null>;
  abstract findMany(page: number, pageSize: number): Promise<ProductResponseDto[]>;
  abstract create(dto: CreateProductDto): Promise<ProductResponseDto>;
}

@Injectable()
export class InMemoryProductsRepository implements ProductsRepository {
  private products: ProductResponseDto[] = [
    { id: 'p1', name: 'Velvet Matte Lipstick', slug: 'velvet-matte-lipstick', status: 'ACTIVE', description: 'Long-wear matte finish.' },
    { id: 'p2', name: 'Hydrating Rose Serum', slug: 'hydrating-rose-serum', status: 'ACTIVE', description: '30ml, all skin types.' },
  ];

  async findBySlug(slug: string) {
    return this.products.find((p) => p.slug === slug) ?? null;
  }
  async findMany(page: number, pageSize: number) {
    const start = (page - 1) * pageSize;
    return this.products.slice(start, start + pageSize);
  }
  async create(dto: CreateProductDto) {
    const created: ProductResponseDto = { id: `p${this.products.length + 1}`, status: 'DRAFT', ...dto };
    this.products.push(created);
    return created;
  }
}
