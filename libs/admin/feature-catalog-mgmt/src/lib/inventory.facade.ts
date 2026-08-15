import { Injectable, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { InventoryAdminApiService } from '@beauty-platform-validated/admin-data-access';

@Injectable()
export class InventoryFacade {
  private readonly inventoryApi = inject(InventoryAdminApiService);

  private readonly listResource = rxResource({ stream: () => this.inventoryApi.list() });

  readonly items = this.listResource.value;
  readonly isLoading = this.listResource.isLoading;

  async adjust(variantId: string, quantityChange: number, note?: string) {
    await new Promise((resolve, reject) =>
      this.inventoryApi.adjust(variantId, { quantityChange, note }).subscribe({ next: resolve, error: reject }),
    );
    this.listResource.reload();
  }
}
