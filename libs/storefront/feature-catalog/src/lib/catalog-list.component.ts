import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { CatalogFacade } from './catalog.facade';
import { WishlistFacade } from '@beauty-platform-validated/storefront-data-access';
import type { ProductResponseDto } from '@beauty-platform-validated/api-client';

@Component({
  selector: 'beauty-catalog-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page-shell">
      <section class="hero">
        <div class="hero-card">
          <div class="hero-copy">
            <span class="beauty-meta">New collection</span>
            <h1>Beauty, curated for you.</h1>
            <p>Thoughtful formulas, premium ingredients, and everyday rituals designed to glow from the inside out.</p>
            <div class="hero-actions">
              <a class="storefront-cta" routerLink="/">Shop now</a>
              <a class="beauty-btn beauty-btn--secondary" routerLink="/">Explore brands</a>
            </div>
          </div>
        </div>
        <div class="hero-card__image" aria-hidden="true"></div>
      </section>

      <div class="catalog-toolbar">
        <div>
          <div class="beauty-subtle">Home / Shop</div>
          <h2>Shop bestsellers</h2>
        </div>
        <div class="beauty-subtle">{{ facade.products().length }} items</div>
      </div>

      @if (facade.isLoading()) {
        <p class="beauty-subtle">Loading…</p>
      } @else if (facade.hasError()) {
        <p class="beauty-subtle">Something went wrong loading products.</p>
      } @else {
        <div class="beauty-product-grid">
          @for (product of facade.products(); track product.id) {
            <article class="beauty-product-card">
              <div class="beauty-product-card__image-wrap">
                <button
                  class="beauty-product-card__wishlist"
                  type="button"
                  [attr.aria-pressed]="isWishlisted(product.id)"
                  (click)="onToggleWishlist(product)"
                >
                  {{ isWishlisted(product.id) ? '♥' : '♡' }}
                </button>
                <a [routerLink]="['/products', product.slug]">
                  @if (product.images[0]; as img) {
                    <img [src]="img.url" [alt]="img.altText ?? product.name" />
                  }
                </a>
              </div>
              <div class="beauty-product-card__body">
                <div class="beauty-product-card__brand">{{ product.brandName }}</div>
                <a [routerLink]="['/products', product.slug]"><h3 class="beauty-product-card__name">{{ product.name }}</h3></a>
                <div class="beauty-rating">★★★★★ <span>4.8</span></div>
                @if (product.fromPrice) {
                  <div class="beauty-price">{{ product.fromPrice | number: '1.2-2' }}</div>
                }
              </div>
            </article>
          }
        </div>

        <div class="hero-actions" style="margin-top: 24px;">
          <button class="beauty-btn beauty-btn--secondary" type="button" (click)="facade.prevPage()">Previous</button>
          <button class="beauty-btn beauty-btn--primary" type="button" (click)="facade.nextPage()">Next</button>
        </div>
      }
    </div>
  `,
})
export class CatalogListComponent {
  readonly facade = inject(CatalogFacade);
  readonly wishlist = inject(WishlistFacade);

  isWishlisted(productId: string) {
    return this.wishlist.items().some((i) => i.productId === productId);
  }

  onToggleWishlist(product: ProductResponseDto) {
    this.wishlist.toggle({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      imageUrl: product.images[0]?.url,
      fromPrice: product.fromPrice,
    });
  }
}
