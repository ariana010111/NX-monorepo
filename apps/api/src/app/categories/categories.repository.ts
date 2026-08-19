import { Injectable } from '@nestjs/common';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export abstract class CategoriesRepository {
  abstract findTree(): Promise<CategoryResponseDto[]>;
  abstract findBySlug(slug: string): Promise<CategoryResponseDto | null>;
  abstract create(dto: CreateCategoryDto): Promise<CategoryResponseDto>;
  abstract update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto | null>;
  abstract delete(id: string): Promise<boolean>;
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

  async create(dto: CreateCategoryDto) {
    const created: CategoryResponseDto = { id: `c${Date.now()}`, parentId: dto.parentId ?? null, ...dto };
    if (dto.parentId) {
      const parent = this.categories.find((c) => c.id === dto.parentId);
      if (parent) {
        parent.children = [...(parent.children ?? []), created];
        return created;
      }
    }
    this.categories.push(created);
    return created;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    // Categories are a two-level tree here (top-level + children) — has
    // to check both, since a category being edited could be either.
    const topLevel = this.categories.find((c) => c.id === id);
    if (topLevel) {
      Object.assign(topLevel, dto);
      return topLevel;
    }
    for (const parent of this.categories) {
      const child = parent.children?.find((c) => c.id === id);
      if (child) {
        Object.assign(child, dto);
        return child;
      }
    }
    return null;
  }

  async delete(id: string) {
    const topLevelIndex = this.categories.findIndex((c) => c.id === id);
    if (topLevelIndex !== -1) {
      // Deleting a parent orphans its children rather than cascading —
      // matches the schema's onDelete: SetNull on Category.parentId, not
      // a cascade delete, so a parent's removal never silently destroys
      // its children's data.
      this.categories.splice(topLevelIndex, 1);
      return true;
    }
    for (const parent of this.categories) {
      if (!parent.children) continue;
      const childIndex = parent.children.findIndex((c) => c.id === id);
      if (childIndex !== -1) {
        parent.children.splice(childIndex, 1);
        return true;
      }
    }
    return false;
  }
}
