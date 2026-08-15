import { Injectable, computed, signal } from '@angular/core';

export interface WishlistItem {
  productId: string;
  productSlug: string;
  name: string;
  imageUrl?: string;
  fromPrice?: number;
}

/**
 * Same reasoning as CartFacade: genuinely app-wide (needed by catalog
 * listing, PDP, and its own page), so it lives in data-access and is
 * root-provided rather than route-scoped. See cart.facade.ts.
 */
@Injectable({ providedIn: 'root' })
export class WishlistFacade {
  private readonly _items = signal<WishlistItem[]>([]);
  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  toggle(item: WishlistItem) {
    this._items.update((items) => {
      const exists = items.some((i) => i.productId === item.productId);
      return exists ? items.filter((i) => i.productId !== item.productId) : [...items, item];
    });
  }

  remove(productId: string) {
    this._items.update((items) => items.filter((i) => i.productId !== productId));
  }
}
