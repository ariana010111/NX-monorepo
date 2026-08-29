import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { OrdersApiService } from '@beauty-platform-validated/storefront-data-access';

@Component({
  selector: 'beauty-order-detail',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  template: `
    <div class="page-shell">
      <section class="admin-panel" style="max-width: 920px; margin: 0 auto;">
        <div class="beauty-section-head">
          <h2>Order details</h2>
          <a routerLink="/orders" class="beauty-btn beauty-btn--secondary">Back to orders</a>
        </div>

        @if (orderResource.isLoading()) {
          <p>Loading…</p>
        } @else if (orderResource.value(); as order) {
          <div class="feature-panel" style="padding: 24px;">
            <p class="beauty-subtle">Order {{ order.orderNumber }}</p>
            <h1>{{ order.status }}</h1>
            <p>Placed {{ order.placedAt | date: 'medium' }}</p>
            <p class="beauty-price">Total: {{ order.grandTotal | number: '1.2-2' }}</p>

            <table class="beauty-table" style="margin-top: 24px;">
              <thead>
                <tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Total</th></tr>
              </thead>
              <tbody>
                @for (item of order.items; track item.variantId) {
                  <tr>
                    <td>{{ item.productName }} {{ item.variantLabel }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ item.unitPrice | number: '1.2-2' }}</td>
                    <td>{{ item.lineTotal | number: '1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p>Order not found.</p>
        }
      </section>
    </div>
  `,
})
export class OrderDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersApi = inject(OrdersApiService);

  readonly orderResource = rxResource({
    stream: () => {
      const id = this.route.snapshot.paramMap.get('id');
      return id ? this.ordersApi.getById(id) : EMPTY;
    },
  });
}
