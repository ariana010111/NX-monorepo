import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartFacade } from '@beauty-platform-validated/storefront-data-access';

@Component({
  selector: 'beauty-cart-page',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  template: `
    <div class="page-shell">
      <div class="catalog-toolbar">
        <div>
          <div class="beauty-subtle">Cart</div>
          <h2>Your Cart ({{ facade.itemCount() }})</h2>
        </div>
      </div>

      @if (facade.items().length === 0) {
        <div class="feature-panel cart-empty-state">
          <h3>Your cart is empty</h3>
          <p class="beauty-subtle">Discover products you'll love.</p>
          <a class="beauty-btn beauty-btn--primary" routerLink="/">Continue Shopping</a>
        </div>
      } @else {
        <div class="checkout-layout cart-layout">
          <div class="feature-panel cart-items-panel">
            @for (line of facade.items(); track line.variantId) {
              <div class="cart-line-item">
                <div class="cart-line-item__main">
                  <img [src]="line.imageUrl || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=300&q=80'" alt="{{ line.name }}" />
                  <div class="cart-line-item__meta">
                    <strong>{{ line.name }}</strong>
                    @if (line.brand) {
                      <div class="beauty-subtle">{{ line.brand }}</div>
                    }
                    <div class="beauty-subtle">{{ line.shade }}</div>
                  </div>
                </div>

                <div class="cart-line-item__actions">
                  <div class="beauty-price">{{ (line.unitPrice * line.quantity) | number: '1.2-2' }}</div>
                  <div class="beauty-quantity beauty-quantity--compact" aria-label="Quantity selector">
                    <button type="button" class="beauty-btn beauty-btn--secondary" (click)="facade.decreaseQuantity(line.variantId)">−</button>
                    <span>{{ line.quantity }}</span>
                    <button type="button" class="beauty-btn beauty-btn--secondary" (click)="facade.increaseQuantity(line.variantId)">+</button>
                  </div>
                  <button type="button" class="beauty-link-btn" (click)="facade.removeItem(line.variantId)">Remove</button>
                </div>
              </div>
            }
          </div>

          <aside class="feature-panel cart-summary-panel">
            <div class="beauty-subtle">Order summary</div>
            <div class="cart-summary-row">
              <span>Subtotal</span>
              <strong>{{ facade.subtotal() | number: '1.2-2' }}</strong>
            </div>
            <div class="cart-summary-row">
              <span>Shipping</span>
              <strong>Free</strong>
            </div>
            <div class="cart-summary-row cart-summary-row--total">
              <span>Total</span>
              <span>{{ facade.subtotal() | number: '1.2-2' }}</span>
            </div>
            <div class="cart-summary-actions">
              <a class="beauty-btn beauty-btn--primary" routerLink="/checkout" style="width: 100%;">Proceed to Checkout</a>
            </div>
          </aside>
        </div>
      }
    </div>
  `,
})
export class CartPageComponent {
  readonly facade = inject(CartFacade);
}
