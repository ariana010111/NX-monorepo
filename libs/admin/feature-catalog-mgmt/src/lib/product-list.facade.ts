import { Injectable, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductsAdminApiService } from '@beauty-platform-validated/admin-data-access';

/** Route-scoped facade — filters/table state per our state-layer rules. */
@Injectable()
export class ProductListFacade {
  private readonly productsApi = inject(ProductsAdminApiService);

  readonly page = signal(1);

  private readonly listResource = rxResource({
    params: () => ({ page: this.page() }),
    stream: ({ params }) => this.productsApi.list(params.page, 50),
  });

  readonly products = this.listResource.value;
  readonly isLoading = this.listResource.isLoading;

  async deleteProduct(id: string) {
    await new Promise<void>((resolve, reject) =>
      this.productsApi.delete(id).subscribe({ next: () => resolve(), error: reject }),
    );
    this.listResource.reload();
  }
}
