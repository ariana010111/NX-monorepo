import { Injectable, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { OrdersAdminApiService } from '@beauty-platform-validated/admin-data-access';
import { UpdateOrderStatusDtoStatus } from '@beauty-platform-validated/api-client';

@Injectable()
export class OrderListFacade {
  private readonly ordersApi = inject(OrdersAdminApiService);

  private readonly listResource = rxResource({ stream: () => this.ordersApi.list() });

  readonly orders = this.listResource.value;
  readonly isLoading = this.listResource.isLoading;

  async updateStatus(id: string, status: UpdateOrderStatusDtoStatus) {
    await new Promise((resolve, reject) =>
      this.ordersApi.updateStatus(id, { status }).subscribe({ next: resolve, error: reject }),
    );
    this.listResource.reload();
  }
}
