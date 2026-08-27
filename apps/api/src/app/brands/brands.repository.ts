import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import crypto from 'node:crypto';
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

@Injectable()
export class PrismaBrandsRepository implements BrandsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(brand: any): BrandResponseDto {
    return { id: brand.id, name: brand.name, slug: brand.slug, logoUrl: brand.logoUrl ?? undefined };
  }

  async findAll() { return (await this.prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })).map((brand) => this.map(brand)); }
  async findBySlug(slug: string) { const brand = await this.prisma.brand.findFirst({ where: { slug, isActive: true } }); return brand ? this.map(brand) : null; }
  async create(dto: CreateBrandDto) { return this.map(await this.prisma.brand.create({ data: { id: crypto.randomUUID(), name: dto.name, slug: dto.slug, logoUrl: dto.logoUrl, updatedAt: new Date() } })); }
  async update(id: string, dto: UpdateBrandDto) { const result = await this.prisma.brand.updateMany({ where: { id, isActive: true }, data: dto }); if (!result.count) return null; return this.map(await this.prisma.brand.findUniqueOrThrow({ where: { id } })); }
  async delete(id: string) { const result = await this.prisma.brand.updateMany({ where: { id, isActive: true }, data: { isActive: false } }); return result.count > 0; }
}

