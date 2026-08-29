import { Component, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { AnalyticsAdminApiService } from '@beauty-platform-validated/admin-data-access';

/**
 * Read-only dashboard — three independent rxResource calls, one per
 * analytics endpoint.  Consistent with CustomerListComponent and
 * OrderDetailComponent: no intermediate facade because there is no local
 * mutable state to manage.
 *
 * Route: /analytics — no providers[] entry needed (no route-scoped facade).
 */
@Component({
  selector: 'beauty-admin-analytics-dashboard',
  standalone: true,
  imports: [DecimalPipe, CurrencyPipe, PercentPipe],
  template: `
    <section class="admin-panel">
      <div class="beauty-section-head">
        <h2>Analytics</h2>
      </div>

      <!-- ── Revenue trends ─────────────────────────────────────── -->
      <h3>Revenue Trends</h3>

      @if (trendsResource.isLoading()) {
        <p aria-busy="true">Loading trends…</p>
      } @else if (trendsResource.error()) {
        <p role="alert">Could not load trend data. Please try again.</p>
      } @else if (!trendsResource.value()?.length) {
        <p class="beauty-subtle">No trend data available yet.</p>
      } @else {
        <div class="admin-table-wrap">
          <table class="beauty-table" aria-label="Revenue trends by period">
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col">Orders</th>
                <th scope="col">Revenue</th>
                <th scope="col">New customers</th>
              </tr>
            </thead>
            <tbody>
              @for (row of trendsResource.value()!; track row.period) {
                <tr>
                  <td>{{ row.period }}</td>
                  <td>{{ row.orderCount | number }}</td>
                  <td>{{ row.revenue | currency }}</td>
                  <td>{{ row.newCustomers | number }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ── Top products ───────────────────────────────────────── -->
      <h3 style="margin-top:32px">Top Products</h3>

      @if (topProductsResource.isLoading()) {
        <p aria-busy="true">Loading top products…</p>
      } @else if (topProductsResource.error()) {
        <p role="alert">Could not load top-product data.</p>
      } @else if (!topProductsResource.value()?.length) {
        <p class="beauty-subtle">No sales data available yet.</p>
      } @else {
        <div class="admin-table-wrap">
          <table class="beauty-table" aria-label="Top products by revenue">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Units sold</th>
                <th scope="col">Revenue</th>
              </tr>
            </thead>
            <tbody>
              @for (p of topProductsResource.value()!; track p.productId) {
                <tr>
                  <td>{{ p.productName }}</td>
                  <td>{{ p.unitsSold | number }}</td>
                  <td>{{ p.revenue | currency }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ── Customer segments ──────────────────────────────────── -->
      <h3 style="margin-top:32px">Customer Segments</h3>

      @if (segmentsResource.isLoading()) {
        <p aria-busy="true">Loading segments…</p>
      } @else if (segmentsResource.error()) {
        <p role="alert">Could not load customer-segment data.</p>
      } @else if (!segmentsResource.value()?.length) {
        <p class="beauty-subtle">No segment data available yet.</p>
      } @else {
        <div class="admin-table-wrap">
          <table class="beauty-table" aria-label="Customer segments">
            <thead>
              <tr>
                <th scope="col">Segment</th>
                <th scope="col">Customers</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              @for (s of segmentsResource.value()!; track s.segment) {
                <tr>
                  <td>{{ s.segment }}</td>
                  <td>{{ s.count | number }}</td>
                  <!-- API returns whole-number percentage (e.g. 20), pipe expects fraction (0.20). -->
                  <td>{{ s.percentage / 100 | percent: '1.1-1' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class AnalyticsDashboardComponent {
  private readonly analyticsApi = inject(AnalyticsAdminApiService);

  readonly trendsResource = rxResource({ stream: () => this.analyticsApi.getTrends() });
  readonly topProductsResource = rxResource({ stream: () => this.analyticsApi.getTopProducts() });
  readonly segmentsResource = rxResource({ stream: () => this.analyticsApi.getCustomerSegments() });
}
