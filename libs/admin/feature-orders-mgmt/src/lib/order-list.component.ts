import { Component, inject } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { OrderListFacade } from './order-list.facade';
import { UpdateOrderStatusDtoStatus } from '@beauty-platform-validated/api-client';

const STATUS_OPTIONS = Object.values(UpdateOrderStatusDtoStatus);

@Component({
  selector: 'beauty-admin-order-list',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  template: `
    <section class="admin-panel">
      <div class="beauty-section-head">
        <h2>Orders</h2>
      </div>

      @if (facade.isLoading()) {
        <p>Loading…</p>
      } @else {
        <div class="admin-table-wrap">
          <table class="beauty-table">
            <thead>
              <tr><th>Order</th><th>Email</th><th>Total</th><th>Status</th><th>Placed</th></tr>
            </thead>
            <tbody>
              @for (order of facade.orders(); track order.id) {
                <tr>
                  <td>{{ order.orderNumber }}</td>
                  <td>{{ order.email }}</td>
                  <td>{{ order.grandTotal | number: '1.2-2' }}</td>
                  <td>
                    <select [value]="order.status" (change)="onStatusChange(order.id, $event)">
                      @for (status of statusOptions; track status) {
                        <option [value]="status">{{ status }}</option>
                      }
                    </select>
                  </td>
                  <td>{{ order.placedAt | date: 'short' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class OrderListComponent {
  readonly facade = inject(OrderListFacade);
  readonly statusOptions = STATUS_OPTIONS;

  onStatusChange(orderId: string, event: Event) {
    const select = event.target as HTMLSelectElement;
    this.facade.updateStatus(orderId, select.value as UpdateOrderStatusDtoStatus);
  }
}
