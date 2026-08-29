import { Component, inject, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import {
  UsersAdminApiService,
  OrdersAdminApiService,
} from '@beauty-platform-validated/admin-data-access';

/**
 * Displays a single customer's profile card plus their order history,
 * filtered client-side from the admin order list.
 *
 * Order filtering is intentionally client-side for now: GET /orders (admin)
 * returns all orders, and we filter by order.userId === this customer's id.
 * If a dedicated /admin/customers/:id/orders endpoint is added to the API in
 * a future sprint, replace ordersResource + customerOrders with a single
 * rxResource calling that endpoint.
 *
 * Route: /users/:id — must be declared AFTER /users/add in app.routes.ts to
 * prevent the literal string "add" being matched as a :id param value.
 */
@Component({
  selector: 'beauty-admin-customer-detail',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  template: `
    <section class="admin-panel" style="max-width:960px">
      <div class="beauty-section-head">
        <h2>Customer detail</h2>
        <a routerLink="/users" class="beauty-btn beauty-btn--secondary">Back to customers</a>
      </div>

      @if (customerResource.isLoading()) {
        <p aria-busy="true">Loading…</p>
      } @else if (customerResource.error()) {
        <p role="alert">Could not load customer. Please try again.</p>
      } @else if (customerResource.value(); as customer) {

        <!-- Profile card -->
        <div class="feature-panel" style="padding:24px;margin-bottom:24px">
          <p class="beauty-subtle">ID: {{ customer.id }}</p>
          <h1>{{ customer.firstName }} {{ customer.lastName }}</h1>
          <p>{{ customer.email }}</p>
          <p>Roles: {{ customer.roles.join(', ') }}</p>
        </div>

        <!-- Order history for this customer -->
        <h3>Orders</h3>

        @if (ordersResource.isLoading()) {
          <p aria-busy="true">Loading orders…</p>
        } @else if (ordersResource.error()) {
          <p role="alert">Could not load orders.</p>
        } @else if (!customerOrders().length) {
          <p class="beauty-subtle">No orders found for this customer.</p>
        } @else {
          <div class="admin-table-wrap">
            <table class="beauty-table" aria-label="Customer orders">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Status</th>
                  <th scope="col">Total</th>
                  <th scope="col">Placed</th>
                </tr>
              </thead>
              <tbody>
                @for (order of customerOrders(); track order.id) {
                  <tr>
                    <td>
                      <a [routerLink]="['/orders', order.id]">{{ order.orderNumber }}</a>
                    </td>
                    <td>{{ order.status }}</td>
                    <td>{{ order.grandTotal | number: '1.2-2' }}</td>
                    <td>{{ order.placedAt | date: 'short' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

      } @else {
        <p>Customer not found.</p>
      }
    </section>
  `,
})
export class CustomerDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly usersApi = inject(UsersAdminApiService);
  private readonly ordersApi = inject(OrdersAdminApiService);

  /** Captured once at construction — paramMap is stable within a route activation. */
  private readonly customerId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly customerResource = rxResource({
    stream: () => (this.customerId ? this.usersApi.getById(this.customerId) : EMPTY),
  });

  /**
   * All orders fetched via the existing admin endpoint, then filtered
   * client-side.  See class JSDoc for the upgrade path.
   */
  readonly ordersResource = rxResource({ stream: () => this.ordersApi.list() });

  /** Orders that belong specifically to this customer. */
  readonly customerOrders = computed(() =>
    (this.ordersResource.value() ?? []).filter((o) => o.userId === this.customerId),
  );
}
