import { Injectable, inject } from '@angular/core';
import {
  BeautyPlatformAPIService,
  CreateProductDto,
  UpdateProductDto,
  CreateVariantDto,
  AddImageDto,
} from '@beauty-platform-validated/api-client';

@Injectable({ providedIn: 'root' })
export class ProductsAdminApiService {
  private readonly generated = inject(BeautyPlatformAPIService);

  list(page = 1, pageSize = 50) {
    return this.generated.productsControllerList({ page, pageSize });
  }
  getById(id: string) {
    return this.generated.productsControllerGetById(id);
  }
  create(dto: CreateProductDto) {
    return this.generated.productsControllerCreate(dto);
  }
  update(id: string, dto: UpdateProductDto) {
    return this.generated.productsControllerUpdate(id, dto);
  }
  delete(id: string) {
    return this.generated.productsControllerDelete(id);
  }
  addVariant(productId: string, dto: CreateVariantDto) {
    return this.generated.productsControllerAddVariant(productId, dto);
  }
  addImage(productId: string, dto: AddImageDto) {
    return this.generated.productsControllerAddImage(productId, dto);
  }
}
