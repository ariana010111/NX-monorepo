import { Injectable, inject } from '@angular/core';
import { BeautyPlatformAPIService, CreateCategoryDto, CreateBrandDto } from '@beauty-platform-validated/api-client';

@Injectable({ providedIn: 'root' })
export class CatalogAdminApiService {
  private readonly generated = inject(BeautyPlatformAPIService);

  getCategoryTree() {
    return this.generated.categoriesControllerGetTree();
  }
  createCategory(dto: CreateCategoryDto) {
    return this.generated.categoriesControllerCreate(dto);
  }
  getBrands() {
    return this.generated.brandsControllerFindAll();
  }
  createBrand(dto: CreateBrandDto) {
    return this.generated.brandsControllerCreate(dto);
  }
}
