import { TestBed } from '@angular/core/testing';
import { WishlistFacade } from './wishlist.facade';

const sampleItem = { productId: 'p1', productSlug: 'lipstick', name: 'Lipstick', fromPrice: 24 };

describe('WishlistFacade', () => {
  let facade: WishlistFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    facade = TestBed.inject(WishlistFacade);
  });

  it('starts empty', () => {
    expect(facade.count()).toBe(0);
  });

  it('adds an item on toggle when not already present', () => {
    facade.toggle(sampleItem);
    expect(facade.count()).toBe(1);
    expect(facade.items()[0].productId).toBe('p1');
  });

  it('removes the item on a second toggle — toggle is symmetric', () => {
    facade.toggle(sampleItem);
    facade.toggle(sampleItem);
    expect(facade.count()).toBe(0);
  });

  it('removes an item by productId directly', () => {
    facade.toggle(sampleItem);
    facade.remove('p1');
    expect(facade.count()).toBe(0);
  });
});
