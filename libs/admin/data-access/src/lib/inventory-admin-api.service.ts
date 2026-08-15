import { Injectable, inject } from '@angular/core';
import { BeautyPlatformAPIService, AdjustStockDto } from '@beauty-platform-validated/api-client';

@Injectable({ providedIn: 'root' })
export class InventoryAdminApiService {
  private readonly generated = inject(BeautyPlatformAPIService);

  list() {
    return this.generated.inventoryControllerList();
  }
  adjust(variantId: string, dto: AdjustStockDto) {
    return this.generated.inventoryControllerAdjust(variantId, dto);
  }
}
