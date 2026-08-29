import { TestBed } from '@angular/core/testing';
import { CartFacade } from './cart.facade';

describe('CartFacade', () => {
  let facade: CartFacade;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [CartFacade] });
    facade = TestBed.inject(CartFacade);
  });

  afterEach(() => {
    localStorage.clear();
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

  it('restores persisted items from localStorage upon instantiation', () => {
    localStorage.setItem(
      'beauty_platform_cart_items',
      JSON.stringify([{ variantId: 'v2', name: 'Foundation', shade: 'Fair', quantity: 1, unitPrice: 38 }]),
    );

    const freshFacade = TestBed.runInInjectionContext(() => new CartFacade());
    expect(freshFacade.items().length).toBe(1);
    expect(freshFacade.itemCount()).toBe(1);
    expect(freshFacade.subtotal()).toBe(38);
  });
});
