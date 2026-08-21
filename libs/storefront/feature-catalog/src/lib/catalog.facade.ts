import { Injectable, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductsApiService } from '@beauty-platform-validated/storefront-data-access';
import type { ProductResponseDto } from '@beauty-platform-validated/api-client';

/**
 * Route-scoped facade (see storefront app.routes.ts) — not providedIn: 'root'.
 * Filters/pagination are local signals; product data is server state,
 * fetched via rxResource so loading/error states come for free instead of
 * being hand-rolled with extra signals.
 */
@Injectable()
export class CatalogFacade {
  private readonly productsApi = inject(ProductsApiService);

  readonly page = signal(1);
  readonly brandFilter = signal<string | undefined>(undefined);

  private readonly productsResource = rxResource({
    params: () => ({ page: this.page(), brand: this.brandFilter() }),
    stream: ({ params }) => this.productsApi.list(params.page, 24),
  });

  readonly products = computed<ProductResponseDto[]>(() => this.productsResource.value() ?? []);
  readonly isLoading = computed(() => this.productsResource.isLoading());
  readonly hasError = computed(() => !!this.productsResource.error());

  setBrandFilter(brandSlug: string | undefined) {
    this.brandFilter.set(brandSlug);
    this.page.set(1);
  }

  nextPage() {
    this.page.update((p) => p + 1);
  }
  prevPage() {
    this.page.update((p) => Math.max(1, p - 1));
  }
}
