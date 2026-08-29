import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { OrderHistoryComponent } from './order-history.component';
import { OrdersApiService } from '@beauty-platform-validated/storefront-data-access';

describe('OrderHistoryComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderHistoryComponent],
      providers: [
        provideRouter([]),
        {
          provide: OrdersApiService,
          useValue: {
            listMine: vi.fn().mockReturnValue(
              of([
                {
                  id: 'o-1',
                  orderNumber: 'ORD-1',
                  email: 'a@example.com',
                  status: 'PENDING_PAYMENT',
                  grandTotal: 31,
                  items: [],
                  placedAt: '2026-01-01T00:00:00.000Z',
                },
              ]),
            ),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders a detail link for each order', async () => {
    const fixture = TestBed.createComponent(OrderHistoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const anchors = fixture.nativeElement.querySelectorAll('a');
    expect(Array.from(anchors).some((anchor: HTMLAnchorElement) => anchor.getAttribute('href') === '/orders/o-1')).toBe(true);
  });
});
