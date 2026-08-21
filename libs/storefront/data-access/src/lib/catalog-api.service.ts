import { Injectable, inject } from '@angular/core';
import { BeautyPlatformAPIService } from '@beauty-platform-validated/api-client';

/** Thin wrapper around the real generated client — categories and brands. */
@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly generated = inject(BeautyPlatformAPIService);

  getCategoryTree() {
    return this.generated.categoriesControllerGetTree();
  }
  getBrands() {
    return this.generated.brandsControllerFindAll();
  }
}
