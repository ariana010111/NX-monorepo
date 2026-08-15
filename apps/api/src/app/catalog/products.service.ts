import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepo: ProductsRepository) {}

  async getBySlug(slug: string): Promise<ProductResponseDto> {
    const product = await this.productsRepo.findBySlug(slug);
    if (!product) throw new NotFoundException(`Product "${slug}" not found`);
    return product;
  }

  list(page = 1, pageSize = 24): Promise<ProductResponseDto[]> {
    return this.productsRepo.findMany(page, pageSize);
  }

  create(dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productsRepo.create(dto);
  }
}
