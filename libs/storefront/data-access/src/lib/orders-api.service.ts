import { Injectable, inject } from '@angular/core';
import { BeautyPlatformAPIService, CreateOrderDto } from '@beauty-platform-validated/api-client';

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly generated = inject(BeautyPlatformAPIService);

  create(dto: CreateOrderDto) {
    return this.generated.ordersControllerCreate(dto);
  }
  pay(orderId: string) {
    return this.generated.paymentsControllerPay(orderId);
  }
  getById(id: string) {
    return this.generated.ordersControllerGetById(id);
  }
  listMine() {
    return this.generated.ordersControllerListMine();
  }
  validateCoupon(code: string, subtotal: number) {
    return this.generated.couponsControllerValidate(code, { subtotal });
  }
}
