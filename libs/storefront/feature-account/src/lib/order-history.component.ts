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
    <h1>Your Orders</h1>
    @if (ordersResource.isLoading()) {
      <p>Loading…</p>
    } @else if (ordersResource.value(); as orders) {
      @if (orders.length === 0) {
        <p>No orders yet. <a routerLink="/">Start shopping</a>.</p>
      } @else {
        <table>
          <thead>
            <tr><th>Order</th><th>Status</th><th>Total</th><th>Placed</th></tr>
          </thead>
          <tbody>
            @for (order of orders; track order.id) {
              <tr>
                <td>{{ order.orderNumber }}</td>
                <td>{{ order.status }}</td>
                <td>{{ order.grandTotal | number: '1.2-2' }}</td>
                <td>{{ order.placedAt | date: 'short' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    }
  `,
})
export class OrderHistoryComponent {
  private readonly ordersApi = inject(OrdersApiService);
  readonly ordersResource = rxResource({ stream: () => this.ordersApi.listMine() });
}
