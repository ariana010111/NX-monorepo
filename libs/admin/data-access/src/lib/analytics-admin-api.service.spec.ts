import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import {
  AnalyticsAdminApiService,
  AnalyticsTrendPoint,
  AnalyticsTopProduct,
  AnalyticsCustomerSegment,
} from './analytics-admin-api.service';

// ── Raw API payloads (the shapes the NestJS controller actually returns) ──────

const rawTrendsResponse = {
  days: [
    { date: '2026-08-01', visits: 5, orders: 3, revenue: 120.5 },
    { date: '2026-08-02', visits: 2, orders: 1, revenue: 40.0 },
  ],
  totalVisits: 7,
  totalOrders: 4,
  totalRevenue: 160.5,
};

const rawTopProductsResponse = {
  products: [
    { productId: 'p1', productName: 'Velvet Matte Lipstick', totalOrders: 20, totalRevenue: 480.0 },
  ],
};

const rawSegmentsResponse = {
  newCustomers: 30,
  returningCustomers: 70,
  customersWithOrders: 100,
};

// ── Expected mapped results ────────────────────────────────────────────────────

const expectedTrends: AnalyticsTrendPoint[] = [
  { period: '2026-08-01', orderCount: 3, revenue: 120.5, newCustomers: 0 },
  { period: '2026-08-02', orderCount: 1, revenue: 40.0, newCustomers: 0 },
];

const expectedTopProducts: AnalyticsTopProduct[] = [
  { productId: 'p1', productName: 'Velvet Matte Lipstick', unitsSold: 20, revenue: 480.0 },
];

const expectedSegments: AnalyticsCustomerSegment[] = [
  { segment: 'New', count: 30, percentage: 30 },
  { segment: 'Returning', count: 70, percentage: 70 },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AnalyticsAdminApiService', () => {
  let service: AnalyticsAdminApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AnalyticsAdminApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getTrends() — maps raw AnalyticsTrendsDto envelope → AnalyticsTrendPoint[]', () => {
    let result: AnalyticsTrendPoint[] | undefined;
    service.getTrends().subscribe((v) => (result = v));

    const req = httpMock.expectOne((r) => r.url.includes('/admin/analytics/trends'));
    expect(req.request.method).toBe('GET');
    req.flush(rawTrendsResponse);

    // date→period, orders→orderCount, newCustomers always 0 (not per-day in API)
    expect(result).toEqual(expectedTrends);
  });

  it('getTrends() — returns empty array when days is empty', () => {
    let result: AnalyticsTrendPoint[] | undefined;
    service.getTrends().subscribe((v) => (result = v));
    httpMock
      .expectOne((r) => r.url.includes('/admin/analytics/trends'))
      .flush({ days: [], totalVisits: 0, totalOrders: 0, totalRevenue: 0 });
    expect(result).toEqual([]);
  });

  it('getTopProducts() — maps raw TopProductsDto envelope → AnalyticsTopProduct[]', () => {
    let result: AnalyticsTopProduct[] | undefined;
    service.getTopProducts().subscribe((v) => (result = v));

    const req = httpMock.expectOne((r) => r.url.includes('/admin/analytics/top-products'));
    expect(req.request.method).toBe('GET');
    req.flush(rawTopProductsResponse);

    // totalOrders→unitsSold, totalRevenue→revenue
    expect(result).toEqual(expectedTopProducts);
  });

  it('getTopProducts() — returns empty array when products is empty', () => {
    let result: AnalyticsTopProduct[] | undefined;
    service.getTopProducts().subscribe((v) => (result = v));
    httpMock
      .expectOne((r) => r.url.includes('/admin/analytics/top-products'))
      .flush({ products: [] });
    expect(result).toEqual([]);
  });

  it('getCustomerSegments() — maps flat CustomerSegmentsDto → [{segment,count,percentage}]', () => {
    let result: AnalyticsCustomerSegment[] | undefined;
    service.getCustomerSegments().subscribe((v) => (result = v));

    const req = httpMock.expectOne((r) => r.url.includes('/admin/analytics/customer-segments'));
    expect(req.request.method).toBe('GET');
    req.flush(rawSegmentsResponse);

    expect(result).toEqual(expectedSegments);
  });

  it('getCustomerSegments() — handles zero total without division-by-zero', () => {
    let result: AnalyticsCustomerSegment[] | undefined;
    service.getCustomerSegments().subscribe((v) => (result = v));
    httpMock
      .expectOne((r) => r.url.includes('/admin/analytics/customer-segments'))
      .flush({ newCustomers: 0, returningCustomers: 0, customersWithOrders: 0 });
    expect(result).toEqual([
      { segment: 'New', count: 0, percentage: 0 },
      { segment: 'Returning', count: 0, percentage: 0 },
    ]);
  });
});
