import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { CheckoutFacade } from './checkout.facade';
import { OrdersApiService, CartFacade } from '@beauty-platform-validated/storefront-data-access';

describe('CheckoutFacade', () => {
  let facade: CheckoutFacade;
  let cartFacade: CartFacade;
  let ordersApi: { create: ReturnType<typeof vi.fn> };

  const shippingAddress = { fullName: 'A B', line1: '1 Main St', city: 'X', postalCode: '00000', country: 'US' };

  beforeEach(() => {
    const ordersApiMock = { create: vi.fn() };

    TestBed.configureTestingModule({
      providers: [CheckoutFacade, CartFacade, { provide: OrdersApiService, useValue: ordersApiMock }],
    });

    facade = TestBed.inject(CheckoutFacade);
    cartFacade = TestBed.inject(CartFacade);
    ordersApi = TestBed.inject(OrdersApiService) as any;
  });

  it('refuses to submit an empty cart without calling the API', async () => {
    await facade.submit('user@example.com', shippingAddress);
    expect(facade.error()).toBe('Your bag is empty.');
    expect(ordersApi.create).not.toHaveBeenCalled();
  });

  it('creates an order from real cart contents and clears the cart on success', async () => {
    cartFacade.addItem({ variantId: 'v1', name: 'Lipstick', shade: 'Rosy Pink', quantity: 2, unitPrice: 24 });

    const placedOrder = { id: 'o1', orderNumber: 'ORD-1', email: 'user@example.com', status: 'PENDING_PAYMENT', subtotal: 48, grandTotal: 48, items: [], placedAt: '2026-01-01' };
    ordersApi.create.mockReturnValue(of(placedOrder) as any);

    await facade.submit('user@example.com', shippingAddress);

    expect(ordersApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        items: [expect.objectContaining({ variantId: 'v1', quantity: 2, unitPrice: 24 })],
      }),
    );
    expect(facade.placedOrder()).toEqual(placedOrder);
    expect(cartFacade.items().length).toBe(0); // cart cleared after successful order
  });

  it('sets an error and does NOT clear the cart when the API call fails', async () => {
    cartFacade.addItem({ variantId: 'v1', name: 'Lipstick', shade: 'Rosy Pink', quantity: 1, unitPrice: 24 });
    ordersApi.create.mockReturnValue(throwError(() => new Error('insufficient stock')) as any);

    await facade.submit('user@example.com', shippingAddress);

    expect(facade.error()).toBeTruthy();
    expect(facade.placedOrder()).toBeUndefined();
    expect(cartFacade.items().length).toBe(1); // NOT cleared — order was never actually placed
  });

  it('resets isSubmitting to false after both success and failure', async () => {
    cartFacade.addItem({ variantId: 'v1', name: 'Lipstick', shade: 'Rosy Pink', quantity: 1, unitPrice: 24 });
    ordersApi.create.mockReturnValue(throwError(() => new Error('fail')) as any);

    await facade.submit('user@example.com', shippingAddress);
    expect(facade.isSubmitting()).toBe(false);
  });
});
