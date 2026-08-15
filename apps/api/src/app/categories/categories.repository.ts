import { Injectable } from '@nestjs/common';
import { CategoryResponseDto } from './dto/category-response.dto';

export abstract class CategoriesRepository {
  abstract findTree(): Promise<CategoryResponseDto[]>;
  abstract findBySlug(slug: string): Promise<CategoryResponseDto | null>;
}

/**
 * TEMPORARY in-memory implementation — see apps/api/src/app/catalog/products.repository.ts
 * for the full explanation. Swap for a Prisma-backed CategoriesRepository
 * (querying Category where parentId is null, include: { children: true })
 * once `prisma generate` has run locally.
 */
@Injectable()
export class InMemoryCategoriesRepository implements CategoriesRepository {
  private categories: CategoryResponseDto[] = [
    {
      id: 'c1',
      name: 'Makeup',
      slug: 'makeup',
      parentId: null,
      children: [
        { id: 'c1a', name: 'Lips', slug: 'makeup-lips', parentId: 'c1' },
        { id: 'c1b', name: 'Face', slug: 'makeup-face', parentId: 'c1' },
      ],
    },
    {
      id: 'c2',
      name: 'Skincare',
      slug: 'skincare',
      parentId: null,
      children: [
        { id: 'c2a', name: 'Serums', slug: 'skincare-serums', parentId: 'c2' },
        { id: 'c2b', name: 'Moisturizers', slug: 'skincare-moisturizers', parentId: 'c2' },
      ],
    },
  ];

  async findTree() {
    return this.categories;
  }

  async findBySlug(slug: string) {
    const flat = this.categories.flatMap((c) => [c, ...(c.children ?? [])]);
    return flat.find((c) => c.slug === slug) ?? null;
  }
}
