import { Injectable } from '@nestjs/common';
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
  abstract addVariant(productId: string, variant: ProductResponseDto['variants'][number]): Promise<ProductResponseDto | null>;
  abstract addImage(productId: string, image: ProductResponseDto['images'][number]): Promise<ProductResponseDto | null>;
}

/**
 * TEMPORARY in-memory implementation. Swap for a Prisma-backed repository
 * once `prisma generate` has run locally — the real version maps
 * VariantAttributeValue -> AttributeValue -> Attribute relations into the
 * same VariantAttributeDto[] shape returned here, so ProductsService and
 * ProductsController don't change at all.
 */
@Injectable()
export class InMemoryProductsRepository implements ProductsRepository {
  private products: ProductResponseDto[] = [
    {
      id: 'p1',
      name: 'Velvet Matte Lipstick',
      slug: 'velvet-matte-lipstick',
      status: 'ACTIVE',
      description: 'A long-wear matte lipstick with a weightless, non-drying finish.',
      shortDescription: 'Long-wear matte finish.',
      brandName: 'Lumière',
      brandSlug: 'lumiere',
      fromPrice: 24,
      images: [{ url: 'https://picsum.photos/seed/lipstick/600/600', altText: 'Velvet Matte Lipstick', isPrimary: true }],
      variants: [
        {
          id: 'v1',
          sku: 'VML-ROSY',
          price: 24,
          isActive: true,
          attributes: [{ attributeName: 'Shade', value: 'Rosy Pink', colorHex: '#c97b8f' }],
          imageUrl: 'https://picsum.photos/seed/rosy/600/600',
        },
        {
          id: 'v2',
          sku: 'VML-BRICK',
          price: 24,
          isActive: true,
          attributes: [{ attributeName: 'Shade', value: 'Brick Red', colorHex: '#a13c32' }],
          imageUrl: 'https://picsum.photos/seed/brick/600/600',
        },
        {
          id: 'v3',
          sku: 'VML-NUDE',
          price: 26,
          compareAtPrice: 24,
          isActive: true,
          attributes: [{ attributeName: 'Shade', value: 'Nude Blush', colorHex: '#d8a892' }],
          imageUrl: 'https://picsum.photos/seed/nude/600/600',
        },
      ],
    },
    {
      id: 'p2',
      name: 'Hydrating Rose Serum',
      slug: 'hydrating-rose-serum',
      status: 'ACTIVE',
      description: 'A lightweight serum with rose extract and hyaluronic acid for all skin types.',
      shortDescription: 'All skin types, 30/50ml.',
      brandName: 'Verdant Botanics',
      brandSlug: 'verdant-botanics',
      fromPrice: 32,
      images: [{ url: 'https://picsum.photos/seed/serum/600/600', altText: 'Hydrating Rose Serum', isPrimary: true }],
      variants: [
        { id: 'v4', sku: 'HRS-30', price: 32, isActive: true, attributes: [{ attributeName: 'Size', value: '30ml' }] },
        { id: 'v5', sku: 'HRS-50', price: 48, isActive: true, attributes: [{ attributeName: 'Size', value: '50ml' }] },
      ],
    },
  ];

  private nextProductId = 3; // p1, p2 are seeded above

  async findBySlug(slug: string) {
    return this.products.find((p) => p.slug === slug) ?? null;
  }

  async findById(id: string) {
    return this.products.find((p) => p.id === id) ?? null;
  }

  async findMany(params: { page: number; pageSize: number; categorySlug?: string; brandSlug?: string }) {
    let results = this.products;
    if (params.brandSlug) results = results.filter((p) => p.brandSlug === params.brandSlug);
    // categorySlug filtering omitted from the in-memory stub — the real
    // Prisma repository filters via the ProductCategory join table.
    const start = (params.page - 1) * params.pageSize;
    return results.slice(start, start + params.pageSize);
  }

  async create(dto: CreateProductDto) {
    const created: ProductResponseDto = {
      // Was `p${this.products.length + 1}` — collided after any delete
      // (length drops, so the next create could reuse an id still held
      // by another product). A monotonic counter never reuses an id.
      id: `p${this.nextProductId++}`,
      status: 'DRAFT',
      images: [],
      variants: [],
      ...dto,
    };
    this.products.push(created);
    return created;
  }

  async update(id: string, dto: UpdateProductDto) {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.products[index] = { ...this.products[index], ...dto };
    return this.products[index];
  }

  async delete(id: string) {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.products.splice(index, 1);
    return true;
  }

  async addVariant(productId: string, variant: ProductResponseDto['variants'][number]) {
    const product = this.products.find((p) => p.id === productId);
    if (!product) return null;
    product.variants.push(variant);
    // fromPrice should reflect the cheapest variant once one exists.
    product.fromPrice = Math.min(...product.variants.map((v) => v.price));
    return product;
  }

  async addImage(productId: string, image: ProductResponseDto['images'][number]) {
    const product = this.products.find((p) => p.id === productId);
    if (!product) return null;
    product.images.push(image);
    return product;
  }
}
