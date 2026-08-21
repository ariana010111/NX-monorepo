import { Component, computed, inject, signal, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
  imports: [DecimalPipe, ReactiveFormsModule],
  template: `
    @if (productResource.value(); as product) {
      <h1>{{ product.name }}</h1>
      <p>{{ product.brandName }}</p>
      <p>{{ product.description }}</p>

      <button type="button" [attr.aria-pressed]="isWishlisted()" (click)="onToggleWishlist(product)">
        {{ isWishlisted() ? '♥ Saved' : '♡ Save to wishlist' }}
      </button>

      @for (group of attributeGroups(); track group.name) {
        <fieldset>
          <legend>{{ group.name }}</legend>
          @for (opt of group.options; track opt.value) {
            <button
              type="button"
              [attr.aria-pressed]="selectedValues()[group.name] === opt.value"
              [style.background]="opt.colorHex"
              (click)="selectAttribute(group.name, opt.value)"
            >
              {{ opt.value }}
            </button>
          }
        </fieldset>
      }

      @if (selectedVariant(); as variant) {
        <p>{{ variant.price | number: '1.2-2' }}</p>
        <button (click)="addToCart()">Add to Bag</button>
      } @else {
        <p>Select options to see price.</p>
      }

      <section>
        <h2>Reviews ({{ reviewsResource.value()?.length ?? 0 }})</h2>
        @for (review of reviewsResource.value(); track review.id) {
          <div>
            <strong>{{ review.rating }}/5</strong>
            @if (review.isVerifiedPurchase) {
              <span> (Verified Purchase)</span>
            }
            <p>{{ review.title }}</p>
            <p>{{ review.body }}</p>
            <small>{{ review.authorName }}</small>
          </div>
        }

        @if (authFacade.isAuthenticated()) {
          <form [formGroup]="reviewForm" (ngSubmit)="onSubmitReview(product.id)">
            <label>
              Rating (1-5)
              <input type="number" formControlName="rating" min="1" max="5" />
            </label>
            <input formControlName="title" placeholder="Title" />
            <textarea formControlName="body" placeholder="Your review"></textarea>
            @if (reviewSubmitError(); as err) {
              <p role="alert">{{ err }}</p>
            }
            @if (reviewSubmitted()) {
              <p>Thanks — your review is pending moderation.</p>
            }
            <button type="submit" [disabled]="reviewForm.invalid">Submit review</button>
          </form>
        } @else {
          <p>Log in to leave a review.</p>
        }
      </section>
    } @else if (productResource.isLoading()) {
      <p>Loading…</p>
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
      shade: variant.attributes.map((a) => a.value).join(' / '),
      quantity: 1,
      unitPrice: variant.price,
    });
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
