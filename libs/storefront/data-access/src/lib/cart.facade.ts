import { Injectable, computed, signal } from '@angular/core';

export interface CartLine {
  variantId: string;
  name: string;
  shade: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Genuinely app-wide state — needed by both feature-catalog (add to bag)
 * and feature-cart (view bag), which is exactly the case that justifies
 * providedIn: 'root' as the documented exception to "facades are
 * route-scoped." Lives in data-access (not a feature lib) specifically so
 * multiple features are allowed to depend on it under the boundary rules.
 */
@Injectable({ providedIn: 'root' })
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

  clear() {
    this._items.set([]);
  }
}
