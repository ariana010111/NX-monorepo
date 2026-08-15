import { Injectable, inject } from '@angular/core';
import { BeautyPlatformAPIService, CreateOrderDto } from '@beauty-platform-validated/api-client';

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly generated = inject(BeautyPlatformAPIService);

  create(dto: CreateOrderDto) {
    return this.generated.ordersControllerCreate(dto);
  }
  getById(id: string) {
    return this.generated.ordersControllerGetById(id);
  }
}
