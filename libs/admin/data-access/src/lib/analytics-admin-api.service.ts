import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

/**
 * These DTOs mirror the Day 1 API response shapes for the three analytics
 * endpoints.  They will move to @beauty-platform-validated/api-client (and
 * these local definitions removed) once the API spec is regenerated with
 * orval.  Until then every consumer imports from admin-data-access, so the
 * switch is a single-file replacement with no downstream churn.
 *
 * TODO(orval-regen): after `npx ts-node …/generate-openapi-spec.ts` +
 *   `./node_modules/.bin/orval --config …/orval.config.ts`:
 *   - replace HttpClient calls with generated.adminAnalyticsControllerTrends() etc.
 *   - delete these local DTO types (use the generated ones)
 *   - re-inject BeautyPlatformAPIService instead of HttpClient
 */

// ── Client-facing interfaces (used by templates and specs) ───────────────────

export interface AnalyticsTrendPoint {
  /** ISO date string, e.g. "2026-08-01" */
  period: string;
  orderCount: number;
  revenue: number;
  /**
   * Per-day new-customer count.  The current API does not break this down
   * by day (only the aggregate CustomerSegmentsDto.newCustomers is available),
   * so this field is always 0 until the API is extended.
   */
  newCustomers: number;
}

export interface AnalyticsTopProduct {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  imageUrl?: string;
}

export interface AnalyticsCustomerSegment {
  /** Human-readable segment name, e.g. "New", "Returning". */
  segment: string;
  count: number;
  /** Whole-number percentage (0–100), not a decimal fraction. */
  percentage: number;
}

// ── Raw API response shapes (what the server actually returns) ───────────────

interface RawDailyTrendPoint {
  date: string;
  visits: number;
  orders: number;
  revenue: number;
}

interface RawAnalyticsTrendsDto {
  days: RawDailyTrendPoint[];
  totalVisits: number;
  totalOrders: number;
  totalRevenue: number;
}

interface RawTopProductDto {
  productId: string;
  productName: string;
  totalOrders: number;
  totalRevenue: number;
}

interface RawTopProductsDto {
  products: RawTopProductDto[];
}

interface RawCustomerSegmentsDto {
  newCustomers: number;
  returningCustomers: number;
  customersWithOrders: number;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AnalyticsAdminApiService {
  /**
   * HttpClient is used directly here because these endpoints do not yet exist
   * in the generated BeautyPlatformAPIService.  The apiUrlInterceptor in both
   * apps rewrites the bare relative paths to the real API origin automatically,
   * identical to how the generated client's paths are handled.
   *
   * Each method maps the raw API response shape → the client-facing interface
   * so that templates and tests are decoupled from API naming conventions.
   */
  private readonly http = inject(HttpClient);

  /**
   * GET /admin/analytics/trends
   *
   * API returns AnalyticsTrendsDto { days: DailyTrendPointDto[], totalVisits,
   * totalOrders, totalRevenue }.  We extract days[], renaming:
   *   date       → period
   *   orders     → orderCount
   *   revenue    → revenue   (unchanged)
   * newCustomers is set to 0 (per-day breakdown not yet available from API).
   *
   * TODO(orval-regen): replace with generated.adminAnalyticsControllerTrends()
   */
  getTrends() {
    return this.http.get<RawAnalyticsTrendsDto>('/admin/analytics/trends').pipe(
      map((dto) =>
        dto.days.map(
          (d): AnalyticsTrendPoint => ({
            period: d.date,
            orderCount: d.orders,
            revenue: d.revenue,
            newCustomers: 0,
          }),
        ),
      ),
    );
  }

  /**
   * GET /admin/analytics/top-products
   *
   * API returns TopProductsDto { products: TopProductDto[] } where each entry
   * has totalOrders / totalRevenue.  We unwrap the envelope and rename:
   *   totalOrders  → unitsSold
   *   totalRevenue → revenue
   *
   * TODO(orval-regen): replace with generated.adminAnalyticsControllerTopProducts()
   */
  getTopProducts() {
    return this.http.get<RawTopProductsDto>('/admin/analytics/top-products').pipe(
      map((dto) =>
        dto.products.map(
          (p): AnalyticsTopProduct => ({
            productId: p.productId,
            productName: p.productName,
            unitsSold: p.totalOrders,
            revenue: p.totalRevenue,
          }),
        ),
      ),
    );
  }

  /**
   * GET /admin/analytics/customer-segments
   *
   * API returns CustomerSegmentsDto { newCustomers, returningCustomers,
   * customersWithOrders } — a flat object, NOT an array.  We convert it into
   * the array-of-segments shape expected by the dashboard template, computing
   * whole-number percentages from the total.
   *
   * TODO(orval-regen): replace with generated.adminAnalyticsControllerCustomerSegments()
   */
  getCustomerSegments() {
    return this.http.get<RawCustomerSegmentsDto>('/admin/analytics/customer-segments').pipe(
      map((dto): AnalyticsCustomerSegment[] => {
        const total = dto.customersWithOrders || 1; // avoid division-by-zero
        return [
          {
            segment: 'New',
            count: dto.newCustomers,
            percentage: Math.round((dto.newCustomers / total) * 100),
          },
          {
            segment: 'Returning',
            count: dto.returningCustomers,
            percentage: Math.round((dto.returningCustomers / total) * 100),
          },
        ];
      }),
    );
  }
}
