import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { CustomerDetailComponent } from './customer-detail.component';
import {
  UsersAdminApiService,
  OrdersAdminApiService,
} from '@beauty-platform-validated/admin-data-access';

// ── Fixtures ────────────────────────────────────────────────────────────────

const stubCustomer = {
  id: 'u1',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Jones',
  roles: ['CUSTOMER'],
  permissions: [],
};

// Alice's order — userId matches stubCustomer.id
const aliceOrder = {
  id: 'o1',
  orderNumber: 'ORD-1',
  email: 'alice@example.com',
  userId: 'u1',
  status: 'PAID',
  currency: 'USD',
  subtotal: 50,
  grandTotal: 50,
  items: [],
  placedAt: '2026-01-01T00:00:00.000Z',
};

// Another user's order — must NOT appear on Alice's detail page
const bobOrder = {
  id: 'o2',
  orderNumber: 'ORD-2',
  email: 'bob@example.com',
  userId: 'u2',
  status: 'SHIPPED',
  currency: 'USD',
  subtotal: 20,
  grandTotal: 20,
  items: [],
  placedAt: '2026-01-02T00:00:00.000Z',
};

// ── Helper ────────────────────────────────────────────────────────────────────

async function setup(customerId = 'u1') {
  const usersApi = { getById: vi.fn().mockReturnValue(of(stubCustomer)) };
  const ordersApi = { list: vi.fn().mockReturnValue(of([aliceOrder, bobOrder])) };

  await TestBed.configureTestingModule({
    imports: [CustomerDetailComponent],
    providers: [
      provideRouter([]),
      { provide: UsersAdminApiService, useValue: usersApi },
      { provide: OrdersAdminApiService, useValue: ordersApi },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: vi.fn().mockReturnValue(customerId) } } },
      },
    ],
  }).compileComponents();

  return { usersApi, ordersApi };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CustomerDetailComponent', () => {
  it('renders the customer name and email after data loads', async () => {
    await setup();
    const fixture = TestBed.createComponent(CustomerDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Alice Jones');
    expect(text).toContain('alice@example.com');
  });

  it('shows only orders belonging to the displayed customer, not to other users', async () => {
    await setup();
    const fixture = TestBed.createComponent(CustomerDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('ORD-1');      // Alice's order — must be visible
    expect(text).not.toContain('ORD-2'); // Bob's order — must NOT appear
  });

  it('customerOrders computed filters by userId, not by email', async () => {
    await setup();
    const fixture = TestBed.createComponent(CustomerDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const orders = fixture.componentInstance.customerOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe('o1');
  });

  it('renders a back link to /users', async () => {
    await setup();
    const fixture = TestBed.createComponent(CustomerDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const anchors: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    );
    expect(anchors.some((a) => a.getAttribute('href') === '/users')).toBe(true);
  });

  it('shows "no orders" message when the customer has no matching orders', async () => {
    // Provide a different customerId so no order matches by userId
    await setup('u-nobody');
    const fixture = TestBed.createComponent(CustomerDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No orders found');
  });
});
