import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { AnalyticsDashboardComponent } from './analytics-dashboard.component';
import {
  AnalyticsAdminApiService,
  AnalyticsTrendPoint,
  AnalyticsTopProduct,
  AnalyticsCustomerSegment,
} from '@beauty-platform-validated/admin-data-access';

// ── Fixtures ────────────────────────────────────────────────────────────────

const trend: AnalyticsTrendPoint = {
  period: '2026-07',
  orderCount: 42,
  revenue: 1200,
  newCustomers: 5,
};

const topProduct: AnalyticsTopProduct = {
  productId: 'p1',
  productName: 'Velvet Matte Lipstick',
  unitsSold: 20,
  revenue: 480,
};

const segment: AnalyticsCustomerSegment = {
  segment: 'VIP',
  count: 8,
  percentage: 20,
};

function makeApi(
  overrides: Partial<{
    getTrends: ReturnType<typeof vi.fn>;
    getTopProducts: ReturnType<typeof vi.fn>;
    getCustomerSegments: ReturnType<typeof vi.fn>;
  }> = {},
) {
  return {
    getTrends: vi.fn().mockReturnValue(of([trend])),
    getTopProducts: vi.fn().mockReturnValue(of([topProduct])),
    getCustomerSegments: vi.fn().mockReturnValue(of([segment])),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AnalyticsDashboardComponent', () => {
  it('renders data from all three API endpoints once they resolve', async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsDashboardComponent],
      providers: [{ provide: AnalyticsAdminApiService, useValue: makeApi() }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AnalyticsDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('2026-07');               // trend period
    expect(text).toContain('Velvet Matte Lipstick'); // top product name
    expect(text).toContain('VIP');                   // segment label
  });

  it('trendsResource starts in isLoading state before first detectChanges', () => {
    TestBed.configureTestingModule({
      imports: [AnalyticsDashboardComponent],
      providers: [{ provide: AnalyticsAdminApiService, useValue: makeApi() }],
    });
    const fixture = TestBed.createComponent(AnalyticsDashboardComponent);
    // rxResource emits into a signal; before detectChanges the resource has not
    // settled yet — it is in its initial loading state.
    expect(fixture.componentInstance.trendsResource.isLoading()).toBe(true);
  });

  it('shows an error alert when the trends endpoint fails', async () => {
    const api = makeApi({
      getTrends: vi.fn().mockReturnValue(throwError(() => new Error('network'))),
    });

    await TestBed.configureTestingModule({
      imports: [AnalyticsDashboardComponent],
      providers: [{ provide: AnalyticsAdminApiService, useValue: api }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AnalyticsDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not load trend data');
  });

  it('shows the empty state when the top-products list is empty', async () => {
    const api = makeApi({
      getTopProducts: vi.fn().mockReturnValue(of([])),
    });

    await TestBed.configureTestingModule({
      imports: [AnalyticsDashboardComponent],
      providers: [{ provide: AnalyticsAdminApiService, useValue: api }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AnalyticsDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No sales data available yet');
  });

  it('shows the empty state when the segments list is empty', async () => {
    const api = makeApi({
      getCustomerSegments: vi.fn().mockReturnValue(of([])),
    });

    await TestBed.configureTestingModule({
      imports: [AnalyticsDashboardComponent],
      providers: [{ provide: AnalyticsAdminApiService, useValue: api }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AnalyticsDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No segment data available yet');
  });
});
