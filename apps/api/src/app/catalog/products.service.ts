import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { AddImageDto } from './dto/add-image.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly inventoryService: InventoryService,
  ) {}

  async getBySlug(slug: string): Promise<ProductResponseDto> {
    const product = await this.productsRepo.findBySlug(slug);
    if (!product) throw new NotFoundException(`Product "${slug}" not found`);
    return product;
  }

  async getById(id: string): Promise<ProductResponseDto> {
    const product = await this.productsRepo.findById(id);
    if (!product) throw new NotFoundException(`Product "${id}" not found`);
    return product;
  }

  list(page = 1, pageSize = 24, categorySlug?: string, brandSlug?: string): Promise<ProductResponseDto[]> {
    return this.productsRepo.findMany({ page, pageSize, categorySlug, brandSlug });
  }

  create(dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productsRepo.create(dto);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const updated = await this.productsRepo.update(id, dto);
    if (!updated) throw new NotFoundException(`Product "${id}" not found`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.productsRepo.delete(id);
    if (!deleted) throw new NotFoundException(`Product "${id}" not found`);
  }

  /**
   * The gap that made admin-created products unpurchasable: without this,
   * create() alone produces a product with an empty variants array —
   * nothing to select on the PDP, nothing addable to a cart, and no
   * inventory row for reserveForOrder() to find. This closes that loop:
   * a real variant AND a real InventoryItem are created together.
   */
  async addVariant(productId: string, dto: CreateVariantDto): Promise<ProductResponseDto> {
    const product = await this.getById(productId); // throws 404 if the product doesn't exist

    const updated = await this.productsRepo.addVariant(productId, {
      sku: dto.sku,
      price: dto.price,
      compareAtPrice: dto.compareAtPrice,
      isActive: true,
      attributes: dto.attributes,
      imageUrl: dto.imageUrl,
    });
    if (!updated) throw new NotFoundException(`Product "${productId}" not found`);

    const variantId = updated.variants.find((variant) => variant.sku === dto.sku)?.id;
    if (!variantId) throw new NotFoundException(`Variant "${dto.sku}" was not created`);

    await this.inventoryService.initializeForVariant({
      variantId,
      productName: product.name,
      variantLabel: dto.attributes.map((a) => a.value).join(' / '),
      initialStock: dto.initialStock,
    });

    return updated;
  }

  async addImage(productId: string, dto: AddImageDto): Promise<ProductResponseDto> {
    const updated = await this.productsRepo.addImage(productId, {
      url: dto.url,
      altText: dto.altText,
      isPrimary: dto.isPrimary ?? false,
    });
    if (!updated) throw new NotFoundException(`Product "${productId}" not found`);
    return updated;
  }
}
