import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export abstract class ProductsRepository {
  abstract findBySlug(slug: string): Promise<ProductResponseDto | null>;
  abstract findById(id: string): Promise<ProductResponseDto | null>;
  abstract findMany(params: { page: number; pageSize: number; categorySlug?: string; brandSlug?: string }): Promise<ProductResponseDto[]>;
  abstract create(dto: CreateProductDto): Promise<ProductResponseDto>;
  abstract update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto | null>;
  abstract delete(id: string): Promise<boolean>;
  abstract addVariant(productId: string, variant: Omit<ProductResponseDto['variants'][number], 'id'>): Promise<ProductResponseDto | null>;
  abstract addImage(productId: string, image: ProductResponseDto['images'][number]): Promise<ProductResponseDto | null>;
}

@Injectable()
export class PrismaProductsRepository implements ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    brand: true,
    productimage: { orderBy: { position: 'asc' as const } },
    productvariant: {
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' as const },
      include: {
        productimage: { where: { isPrimary: true }, orderBy: { position: 'asc' as const }, take: 1 },
        variantattributevalue: { include: { attributevalue: { include: { attribute: true } } } },
      },
    },
  };

  private mapProduct(product: any): ProductResponseDto {
    const variants = product.productvariant.map((variant: any) => ({
      id: variant.id,
      sku: variant.sku,
      price: Number(variant.price),
      compareAtPrice: variant.compareAtPrice == null ? undefined : Number(variant.compareAtPrice),
      isActive: variant.isActive,
      attributes: variant.variantattributevalue.map((link: any) => ({
        attributeName: link.attributevalue.attribute.name,
        value: link.attributevalue.value,
        colorHex: link.attributevalue.colorHex ?? undefined,
      })),
      imageUrl: variant.productimage[0]?.url,
    }));
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? undefined,
      shortDescription: product.shortDescription ?? undefined,
      brandName: product.brand?.name,
      brandSlug: product.brand?.slug,
      status: product.status,
      images: product.productimage.map((image: any) => ({ url: image.url, altText: image.altText ?? undefined, isPrimary: image.isPrimary })),
      variants,
      fromPrice: variants.length ? Math.min(...variants.map((variant: any) => variant.price)) : undefined,
    };
  }

  private async findSellerId() {
    const seller = await this.prisma.seller.findFirst({ where: { type: 'PLATFORM', status: 'ACTIVE' } });
    if (!seller) throw new Error('No active platform seller exists. Run the Prisma seed first.');
    return seller.id;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({ where: { slug, deletedAt: null }, include: this.include });
    return product ? this.mapProduct(product) : null;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null }, include: this.include });
    return product ? this.mapProduct(product) : null;
  }

  async findMany(params: { page: number; pageSize: number; categorySlug?: string; brandSlug?: string }) {
    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        brand: params.brandSlug ? { slug: params.brandSlug } : undefined,
        productcategory: params.categorySlug ? { some: { category: { slug: params.categorySlug } } } : undefined,
      },
      skip: Math.max(0, (params.page - 1) * params.pageSize),
      take: params.pageSize,
      orderBy: { createdAt: 'desc' },
      include: this.include,
    });
    return products.map((product) => this.mapProduct(product));
  }

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: { id: crypto.randomUUID(), name: dto.name, slug: dto.slug, description: dto.description, sellerId: await this.findSellerId(), updatedAt: new Date() } as any,
      include: this.include,
    });
    return this.mapProduct(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) return null;
    const product = await this.prisma.product.update({ where: { id }, data: dto as any, include: this.include });
    return this.mapProduct(product);
  }

  async delete(id: string) {
    const result = await this.prisma.product.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
    return result.count > 0;
  }

  async addVariant(productId: string, variant: Omit<ProductResponseDto['variants'][number], 'id'>) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) return null;
    const sellerId = product.sellerId;
    await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.productvariant.create({
        data: {
          id: crypto.randomUUID(),
          productId,
          sellerId,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          isActive: variant.isActive,
        } as any,
      });
      for (const attribute of variant.attributes) {
        const definition = await transaction.attribute.upsert({ where: { name: attribute.attributeName }, update: {}, create: { id: crypto.randomUUID(), name: attribute.attributeName, slug: attribute.attributeName.toLowerCase().replace(/\s+/g, '-') } });
        const value = await transaction.attributevalue.upsert({ where: { attributeId_value: { attributeId: definition.id, value: attribute.value } }, update: { colorHex: attribute.colorHex }, create: { id: crypto.randomUUID(), attributeId: definition.id, value: attribute.value, slug: attribute.value.toLowerCase().replace(/\s+/g, '-'), colorHex: attribute.colorHex } });
        await transaction.variantattributevalue.create({ data: { variantId: created.id, attributeValueId: value.id } });
      }
      if (variant.imageUrl) await transaction.productimage.create({ data: { id: crypto.randomUUID(), productId, variantId: created.id, url: variant.imageUrl, isPrimary: true } });
    });
    return this.findById(productId);
  }

  async addImage(productId: string, image: ProductResponseDto['images'][number]) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) return null;
    await this.prisma.productimage.create({ data: { id: crypto.randomUUID(), productId, url: image.url, altText: image.altText, isPrimary: image.isPrimary } });
    return this.findById(productId);
  }
}
