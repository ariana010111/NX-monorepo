import { Injectable, computed, signal } from '@angular/core';

export interface CartLine {
  variantId: string;
  name: string;
  shade: string;
  quantity: number;
  unitPrice: number;
}

/**
 * NOT providedIn: 'root'. Provided at the route level (see storefront
 * app.routes.ts) so its lifetime matches the cart feature being active,
 * not the whole app — this is what prevents it from becoming a hidden
 * global store.
 */
@Injectable()
export class CartFacade {
  private readonly _items = signal<CartLine[]>([]);
  readonly items = this._items.asReadonly();

  readonly itemCount = computed(() => this._items().reduce((sum, i) => sum + i.quantity, 0));
  readonly subtotal = computed(() => this._items().reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));

  addItem(line: CartLine) {
    this._items.update((items) => {
      const existing = items.find((i) => i.variantId === line.variantId);
      if (existing) {
        return items.map((i) => (i.variantId === line.variantId ? { ...i, quantity: i.quantity + line.quantity } : i));
      }
      return [...items, line];
    });
  }

  removeItem(variantId: string) {
    this._items.update((items) => items.filter((i) => i.variantId !== variantId));
  }
}
