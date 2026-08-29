import { Component, computed, inject, signal, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductsApiService, CartFacade, WishlistFacade, ReviewsApiService, AuthFacade } from '@beauty-platform-validated/storefront-data-access';
import type { ProductResponseDto } from '@beauty-platform-validated/api-client';

/**
 * The beauty-specific piece: variants are grouped by attribute name (Shade,
 * Size, ...) so the UI can render one selector control per attribute type
 * rather than a flat variant dropdown — this is what makes a shade swatch
 * picker possible instead of a generic "select a SKU" list.
 *
 * Reviews markup below is deliberately minimal/unstyled — functional
 * wiring only, per direct instruction that UI/CSS is being handled
 * separately.
 */
@Component({
  selector: 'beauty-product-detail',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink],
  template: `
    @if (productResource.value(); as product) {
      <div class="page-shell">
        <div class="product-details">
          <div class="product-gallery">
            <div class="product-gallery__thumbs">
              @for (image of product.images; track image.url; let i = $index) {
                <div class="product-gallery__thumb">
                  <img [src]="image.url" [alt]="image.altText ?? product.name" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
              }
            </div>
            <div class="product-gallery__main">
              @if (product.images[0]; as image) {
                <img [src]="image.url" [alt]="image.altText ?? product.name" style="width: 100%; height: 100%; object-fit: cover;" />
              }
            </div>
          </div>

          <div class="product-info">
            <div class="product-brand">{{ product.brandName }}</div>
            <h1>{{ product.name }}</h1>
            <div class="beauty-rating">★★★★★ <span>4.8</span></div>
            <div class="price-block">
              @if (selectedVariant(); as variant) {
                <span class="price">{{ variant.price | number: '1.2-2' }}</span>
              } @else {
                <span class="price">From {{ product.fromPrice | number: '1.2-2' }}</span>
              }
            </div>
            <p>{{ product.description }}</p>

            @for (group of attributeGroups(); track group.name) {
              <fieldset style="border: 1px solid var(--beauty-border); border-radius: 14px; padding: 12px; margin: 16px 0;">
                <legend>{{ group.name }}</legend>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                  @for (opt of group.options; track opt.value) {
                    <button
                      class="beauty-btn beauty-btn--secondary"
                      type="button"
                      [attr.aria-pressed]="selectedValues()[group.name] === opt.value"
                      [style.background]="selectedValues()[group.name] === opt.value ? 'var(--beauty-brand-soft)' : '#fff'"
                      [style.borderColor]="selectedValues()[group.name] === opt.value ? 'var(--beauty-brand)' : 'var(--beauty-border)'"
                      (click)="selectAttribute(group.name, opt.value)"
                    >
                      {{ opt.value }}
                    </button>
                  }
                </div>
              </fieldset>
            }

            <div class="product-actions">
              <div class="beauty-quantity" aria-label="Quantity selector">
                <button type="button" (click)="decrementQuantity()" aria-label="Decrease quantity">−</button>
                <span>{{ quantity() }}</span>
                <button type="button" (click)="incrementQuantity()" aria-label="Increase quantity">+</button>
              </div>

              @if (selectedVariant(); as variant) {
                <button class="beauty-btn beauty-btn--primary" type="button" (click)="addToCart()">Add to Cart</button>
              } @else {
                <button class="beauty-btn beauty-btn--primary" type="button" disabled>Select options</button>
              }
              <button class="beauty-btn beauty-btn--secondary" type="button" [attr.aria-pressed]="isWishlisted()" (click)="onToggleWishlist(product)">
                {{ isWishlisted() ? '♥ Saved' : '♡ Save' }}
              </button>
            </div>

            @if (addSuccess()) {
              <div class="cart-success" role="status">
                <span>✓ Added to your cart</span>
                <a routerLink="/cart">View Cart</a>
              </div>
            }
          </div>
        </div>

        <section class="feature-panel" style="margin-top: 36px; padding: 24px;">
          <h2>Reviews ({{ reviewsResource.value()?.length ?? 0 }})</h2>
          @for (review of reviewsResource.value(); track review.id) {
            <div style="padding: 16px 0; border-bottom: 1px solid var(--beauty-border);">
              <strong>{{ review.rating }}/5</strong>
              @if (review.isVerifiedPurchase) {
                <span class="beauty-subtle"> • Verified purchase</span>
              }
              <p style="font-weight: 600; margin: 6px 0;">{{ review.title }}</p>
              <p>{{ review.body }}</p>
              <small class="beauty-subtle">{{ review.authorName }}</small>
            </div>
          }

          @if (authFacade.isAuthenticated()) {
            <form [formGroup]="reviewForm" (ngSubmit)="onSubmitReview(product.id)" class="form-grid" style="margin-top: 18px;">
              <div class="field"><label>Rating</label><input type="number" formControlName="rating" min="1" max="5" /></div>
              <div class="field" style="grid-column: 1 / -1;"><input formControlName="title" placeholder="Title" /></div>
              <div class="field" style="grid-column: 1 / -1;"><textarea formControlName="body" placeholder="Your review"></textarea></div>
              @if (reviewSubmitError(); as err) {
                <p role="alert" style="grid-column: 1 / -1;">{{ err }}</p>
              }
              @if (reviewSubmitted()) {
                <p style="grid-column: 1 / -1;">Thanks — your review is pending moderation.</p>
              }
              <button class="beauty-btn beauty-btn--primary" type="submit" [disabled]="reviewForm.invalid" style="grid-column: 1 / -1;">Submit review</button>
            </form>
          } @else {
            <p>Log in to leave a review.</p>
          }
        </section>
      </div>
    } @else if (productResource.isLoading()) {
      <p class="page-shell">Loading…</p>
    }
  `,
})
export class ProductDetailComponent {
  readonly slug = input.required<string>();

  private readonly productsApi = inject(ProductsApiService);
  private readonly cartFacade = inject(CartFacade);
  private readonly wishlistFacade = inject(WishlistFacade);
  private readonly reviewsApi = inject(ReviewsApiService);
  private readonly fb = inject(FormBuilder);
  readonly authFacade = inject(AuthFacade);

  readonly productResource = rxResource({
    params: () => ({ slug: this.slug() }),
    stream: ({ params }) => this.productsApi.getBySlug(params.slug),
  });

  readonly reviewsResource = rxResource({
    params: () => {
      const product = this.productResource.value();
      return product ? { productId: product.id } : undefined;
    },
    stream: ({ params }) => this.reviewsApi.listForProduct(params.productId),
  });

  readonly reviewForm = this.fb.nonNullable.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    title: [''],
    body: [''],
  });
  readonly reviewSubmitError = signal<string | undefined>(undefined);
  readonly reviewSubmitted = signal(false);

  readonly selectedValues = signal<Record<string, string>>({});
  readonly quantity = signal(1);
  readonly addSuccess = signal(false);

  readonly attributeGroups = computed(() => {
    const product = this.productResource.value();
    if (!product) return [];
    const groups = new Map<string, { value: string; colorHex?: string }[]>();
    for (const variant of product.variants) {
      for (const attr of variant.attributes) {
        const existing = groups.get(attr.attributeName) ?? [];
        if (!existing.some((o) => o.value === attr.value)) {
          existing.push({ value: attr.value, colorHex: attr.colorHex });
        }
        groups.set(attr.attributeName, existing);
      }
    }
    return Array.from(groups.entries()).map(([name, options]) => ({ name, options }));
  });

  readonly selectedVariant = computed(() => {
    const product = this.productResource.value();
    if (!product) return undefined;

    if (product.variants.length === 0) {
      return {
        id: product.id,
        sku: 'DEFAULT',
        price: product.fromPrice ?? 0,
        compareAtPrice: undefined,
        isActive: true,
        attributes: [],
        imageUrl: product.images[0]?.url,
      };
    }

    const selected = this.selectedValues();
    return product.variants.find((variant) =>
      variant.attributes.every((attr) => selected[attr.attributeName] === attr.value),
    );
  });

  readonly isWishlisted = computed(() => {
    const product = this.productResource.value();
    if (!product) return false;
    return this.wishlistFacade.items().some((i) => i.productId === product.id);
  });

  selectAttribute(attributeName: string, value: string) {
    this.selectedValues.update((current) => ({ ...current, [attributeName]: value }));
  }

  incrementQuantity() {
    this.quantity.update((value) => Math.max(1, value + 1));
    this.addSuccess.set(false);
  }

  decrementQuantity() {
    this.quantity.update((value) => Math.max(1, value - 1));
    this.addSuccess.set(false);
  }

  onToggleWishlist(product: ProductResponseDto) {
    this.wishlistFacade.toggle({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      imageUrl: product.images[0]?.url,
      fromPrice: product.fromPrice,
    });
  }

  addToCart() {
    const product = this.productResource.value();
    const variant = this.selectedVariant();
    if (!product || !variant) return;

    this.cartFacade.addItem({
      variantId: variant.id,
      name: product.name,
      shade: variant.attributes.length ? variant.attributes.map((a) => a.value).join(' / ') : 'Default',
      quantity: this.quantity(),
      unitPrice: variant.price,
      imageUrl: product.images[0]?.url,
      brand: product.brandName,
    });
    this.addSuccess.set(true);
  }

  async onSubmitReview(productId: string) {
    if (this.reviewForm.invalid) return;
    this.reviewSubmitError.set(undefined);
    this.reviewSubmitted.set(false);
    const { rating, title, body } = this.reviewForm.getRawValue();
    try {
      await new Promise((resolve, reject) =>
        this.reviewsApi.create({ productId, rating, title, body }).subscribe({ next: resolve, error: reject }),
      );
      this.reviewSubmitted.set(true);
      this.reviewForm.reset({ rating: 5, title: '', body: '' });
      // A freshly-submitted review is PENDING and won't appear in this
      // list yet (only approved reviews are public) — no need to reload.
    } catch (err: unknown) {
      const message = (err as { error?: { message?: string } })?.error?.message;
      this.reviewSubmitError.set(message ?? 'Could not submit review. You may have already reviewed this product.');
    }
  }
}
