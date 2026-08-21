import { TestBed } from '@angular/core/testing';
import { CartFacade } from './cart.facade';

describe('CartFacade', () => {
  let facade: CartFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CartFacade] });
    facade = TestBed.inject(CartFacade);
  });

  it('starts empty', () => {
    expect(facade.itemCount()).toBe(0);
    expect(facade.subtotal()).toBe(0);
  });

  it('computes itemCount and subtotal as items are added', () => {
    facade.addItem({ variantId: 'v1', name: 'Lipstick', shade: 'Rosy Pink', quantity: 2, unitPrice: 24 });
    expect(facade.itemCount()).toBe(2);
    expect(facade.subtotal()).toBe(48);
  });

  it('merges quantity when the same variant is added twice', () => {
    facade.addItem({ variantId: 'v1', name: 'Lipstick', shade: 'Rosy Pink', quantity: 1, unitPrice: 24 });
    facade.addItem({ variantId: 'v1', name: 'Lipstick', shade: 'Rosy Pink', quantity: 1, unitPrice: 24 });
    expect(facade.items().length).toBe(1);
    expect(facade.itemCount()).toBe(2);
  });

  it('removes an item by variantId', () => {
    facade.addItem({ variantId: 'v1', name: 'Lipstick', shade: 'Rosy Pink', quantity: 1, unitPrice: 24 });
    facade.removeItem('v1');
    expect(facade.items().length).toBe(0);
  });
});
