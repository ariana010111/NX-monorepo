import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CartFacade } from '@beauty-platform-validated/storefront-data-access';

@Component({
  selector: 'beauty-cart-page',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="page-shell">
      <div class="catalog-toolbar">
        <div>
          <div class="beauty-subtle">Bag</div>
          <h2>Your Bag ({{ facade.itemCount() }})</h2>
        </div>
      </div>

      <div class="checkout-layout" style="gap: 24px; align-items: flex-start;">
        <div class="feature-panel" style="flex: 1.3; padding: 24px;">
          @for (line of facade.items(); track line.variantId) {
            <div class="feature-panel" style="padding: 18px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; gap: 12px; align-items: center;">
                <div>
                  <strong>{{ line.name }}</strong>
                  <div class="beauty-subtle">{{ line.shade }} × {{ line.quantity }}</div>
                </div>
                <div class="beauty-price">{{ (line.unitPrice * line.quantity) | number: '1.2-2' }}</div>
              </div>
            </div>
          }
        </div>

        <aside class="feature-panel" style="flex: 0.7; padding: 24px; position: sticky; top: 96px;">
          <div class="beauty-subtle">Order summary</div>
          <div style="display: flex; justify-content: space-between; margin: 18px 0 8px;">
            <span>Subtotal</span>
            <strong>{{ facade.subtotal() | number: '1.2-2' }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <span>Shipping</span>
            <strong>Free</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 700;">
            <span>Total</span>
            <span>{{ facade.subtotal() | number: '1.2-2' }}</span>
          </div>
          <div style="margin-top: 20px;">
            <a class="beauty-btn beauty-btn--primary" routerLink="/checkout" style="width: 100%;">Checkout</a>
          </div>
        </aside>
      </div>
    </div>
  `,
})
export class CartPageComponent {
  readonly facade = inject(CartFacade);
}
