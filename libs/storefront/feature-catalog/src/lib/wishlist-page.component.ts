import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { WishlistFacade } from '@beauty-platform-validated/storefront-data-access';

@Component({
  selector: 'beauty-wishlist-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page-shell">
      <section class="admin-panel">
        <div class="beauty-section-head">
          <h2>Your Wishlist ({{ facade.count() }})</h2>
        </div>

        @if (facade.count() === 0) {
          <p>Nothing saved yet.</p>
        } @else {
          <div class="beauty-product-grid">
            @for (item of facade.items(); track item.productId) {
              <article class="beauty-product-card">
                <div class="beauty-product-card__image-wrap">
                  <a [routerLink]="['/products', item.productSlug]">
                    @if (item.imageUrl) {
                      <img [src]="item.imageUrl" [alt]="item.name" />
                    }
                  </a>
                </div>
                <div class="beauty-product-card__body">
                  <a [routerLink]="['/products', item.productSlug]"><h3 class="beauty-product-card__name">{{ item.name }}</h3></a>
                  @if (item.fromPrice) {
                    <div class="beauty-price">From {{ item.fromPrice | number: '1.2-2' }}</div>
                  }
                  <button class="beauty-btn beauty-btn--secondary" type="button" (click)="facade.remove(item.productId)" style="margin-top: 12px;">Remove</button>
                </div>
              </article>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class WishlistPageComponent {
  readonly facade = inject(WishlistFacade);
}
