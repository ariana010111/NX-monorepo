import { Injectable, inject } from '@angular/core';
import { BeautyPlatformAPIService, UpdateOrderStatusDto } from '@beauty-platform-validated/api-client';

@Injectable({ providedIn: 'root' })
export class OrdersAdminApiService {
  private readonly generated = inject(BeautyPlatformAPIService);

  list() {
    return this.generated.ordersControllerList();
  }
  getById(id: string) {
    return this.generated.ordersControllerGetById(id);
  }
  updateStatus(id: string, dto: UpdateOrderStatusDto) {
    return this.generated.ordersControllerUpdateStatus(id, dto);
  }
}
