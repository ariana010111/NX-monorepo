import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { OrderDetailComponent } from './order-detail.component';
import { OrdersAdminApiService } from '@beauty-platform-validated/admin-data-access';

describe('OrderDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: vi.fn().mockReturnValue('o-1') } } },
        },
        {
          provide: OrdersAdminApiService,
          useValue: {
            getById: vi.fn().mockReturnValue(
              of({
                id: 'o-1',
                orderNumber: 'ORD-1',
                email: 'a@example.com',
                status: 'PAID',
                grandTotal: 42,
                items: [],
                placedAt: '2026-01-01T00:00:00.000Z',
              }),
            ),
          },
        },
      ],
    }).compileComponents();
  });

  it('loads the selected order and renders its order number', async () => {
    const fixture = TestBed.createComponent(OrderDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('ORD-1');
  });
});
