import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { OrderListFacade } from './order-list.facade';
import { OrdersAdminApiService } from '@beauty-platform-validated/admin-data-access';

const sampleOrder = {
  id: 'o1',
  orderNumber: 'ORD-1',
  email: 'a@example.com',
  status: 'PENDING_PAYMENT',
  subtotal: 24,
  grandTotal: 24,
  items: [],
  placedAt: '2026-01-01',
};

describe('OrderListFacade', () => {
  let ordersApi: { list: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> };
  let facade: OrderListFacade;

  beforeEach(() => {
    ordersApi = { list: vi.fn().mockReturnValue(of([sampleOrder])), updateStatus: vi.fn() };
    TestBed.configureTestingModule({
      providers: [OrderListFacade, { provide: OrdersAdminApiService, useValue: ordersApi }],
    });
    facade = TestBed.inject(OrderListFacade);
  });

  it('loads orders from the API on construction', async () => {
    await vi.waitFor(() => expect(facade.orders()).toEqual([sampleOrder]));
  });

  it('calls updateStatus with the given id and status, then reloads the list', async () => {
    await vi.waitFor(() => expect(facade.orders()).toBeDefined());
    ordersApi.updateStatus.mockReturnValue(of({ ...sampleOrder, status: 'SHIPPED' }));

    await facade.updateStatus('o1', 'SHIPPED' as any);

    expect(ordersApi.updateStatus).toHaveBeenCalledWith('o1', { status: 'SHIPPED' });
    // list() called once on construction, once again on reload after the update —
    // reload() re-triggers the resource asynchronously, so this needs its own wait.
    await vi.waitFor(() => expect(ordersApi.list).toHaveBeenCalledTimes(2));
  });
});
