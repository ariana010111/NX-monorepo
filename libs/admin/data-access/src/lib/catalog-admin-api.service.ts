import { Injectable, inject } from '@angular/core';
import {
  BeautyPlatformAPIService,
  CreateCategoryDto,
  CreateBrandDto,
  UpdateCategoryDto,
  UpdateBrandDto,
} from '@beauty-platform-validated/api-client';

@Injectable({ providedIn: 'root' })
export class CatalogAdminApiService {
  private readonly generated = inject(BeautyPlatformAPIService);

  getCategoryTree() {
    return this.generated.categoriesControllerGetTree();
  }
  createCategory(dto: CreateCategoryDto) {
    return this.generated.categoriesControllerCreate(dto);
  }
  updateCategory(id: string, dto: UpdateCategoryDto) {
    return this.generated.categoriesControllerUpdate(id, dto);
  }
  deleteCategory(id: string) {
    return this.generated.categoriesControllerDelete(id);
  }

  getBrands() {
    return this.generated.brandsControllerFindAll();
  }
  createBrand(dto: CreateBrandDto) {
    return this.generated.brandsControllerCreate(dto);
  }
  updateBrand(id: string, dto: UpdateBrandDto) {
    return this.generated.brandsControllerUpdate(id, dto);
  }
  deleteBrand(id: string) {
    return this.generated.brandsControllerDelete(id);
  }
}
