import { Injectable, inject } from '@angular/core';
import { BeautyPlatformAPIService } from '@beauty-platform-validated/api-client';

/**
 * Thin wrapper around the REAL generated client (proven working below).
 * Feature libs depend on this, never on the generated client directly.
 */
@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly generated = inject(BeautyPlatformAPIService);

  list(page = 1, pageSize = 24) {
    return this.generated.productsControllerList({ page, pageSize });
  }
  getBySlug(slug: string) {
    return this.generated.productsControllerGetBySlug(slug);
  }
}
