import { Injectable, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CatalogAdminApiService } from '@beauty-platform-validated/admin-data-access';

/** Route-scoped facade backing the combined categories + brands admin screen. */
@Injectable()
export class TaxonomyFacade {
  private readonly catalogApi = inject(CatalogAdminApiService);

  private readonly categoriesResource = rxResource({ stream: () => this.catalogApi.getCategoryTree() });
  private readonly brandsResource = rxResource({ stream: () => this.catalogApi.getBrands() });

  readonly categories = this.categoriesResource.value;
  readonly brands = this.brandsResource.value;

  async createCategory(name: string, slug: string, parentId?: string) {
    await new Promise((resolve, reject) =>
      this.catalogApi.createCategory({ name, slug, parentId }).subscribe({ next: resolve, error: reject }),
    );
    this.categoriesResource.reload();
  }

  async createBrand(name: string, slug: string) {
    await new Promise((resolve, reject) =>
      this.catalogApi.createBrand({ name, slug }).subscribe({ next: resolve, error: reject }),
    );
    this.brandsResource.reload();
  }
}
