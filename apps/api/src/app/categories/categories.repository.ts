import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class PrismaCategoriesRepository implements CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}
  private map(category: any): CategoryResponseDto {
    return { id: category.id, name: category.name, slug: category.slug, parentId: category.parentId, imageUrl: category.imageUrl ?? undefined, children: category.children?.map((child: any) => this.map(child)) };
  }
  async findTree() { return (await this.prisma.category.findMany({ where: { parentId: null, isActive: true }, include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } })).map((category) => this.map(category)); }
  async findBySlug(slug: string) { const category = await this.prisma.category.findFirst({ where: { slug, isActive: true }, include: { children: { where: { isActive: true } } } }); return category ? this.map(category) : null; }
  async create(dto: CreateCategoryDto) { return this.map(await this.prisma.category.create({ data: dto })); }
  async update(id: string, dto: UpdateCategoryDto) { const result = await this.prisma.category.updateMany({ where: { id, isActive: true }, data: dto }); if (!result.count) return null; return this.map(await this.prisma.category.findUniqueOrThrow({ where: { id } })); }
  async delete(id: string) { const result = await this.prisma.category.updateMany({ where: { id, isActive: true }, data: { isActive: false } }); return result.count > 0; }
}

