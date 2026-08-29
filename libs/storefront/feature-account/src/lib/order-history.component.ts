import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { OrdersApiService } from '@beauty-platform-validated/storefront-data-access';

@Component({
  selector: 'beauty-order-history',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe],
  template: `
    <div class="page-shell">
      <section class="admin-panel">
        <div class="beauty-section-head">
          <h2>Your Orders</h2>
        </div>

        @if (ordersResource.isLoading()) {
          <p>Loading…</p>
        } @else if (ordersResource.value(); as orders) {
          @if (orders.length === 0) {
            <p>No orders yet. <a routerLink="/">Start shopping</a>.</p>
          } @else {
            <div class="admin-table-wrap">
              <table class="beauty-table">
                <thead>
                  <tr><th>Order</th><th>Status</th><th>Total</th><th>Placed</th></tr>
                </thead>
                <tbody>
                  @for (order of orders; track order.id) {
                    <tr>
                      <td><a [routerLink]="['/orders', order.id]">{{ order.orderNumber }}</a></td>
                      <td>{{ order.status }}</td>
                      <td>{{ order.grandTotal | number: '1.2-2' }}</td>
                      <td>{{ order.placedAt | date: 'short' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </section>
    </div>
  `,
})
export class OrderHistoryComponent {
  private readonly ordersApi = inject(OrdersApiService);
  readonly ordersResource = rxResource({ stream: () => this.ordersApi.listMine() });
}
