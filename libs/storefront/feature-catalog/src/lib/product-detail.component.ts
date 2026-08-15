import { Component, computed, inject, signal, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { ProductsApiService, CartFacade, WishlistFacade } from '@beauty-platform-validated/storefront-data-access';
import type { ProductResponseDto } from '@beauty-platform-validated/api-client';

/**
 * The beauty-specific piece: variants are grouped by attribute name (Shade,
 * Size, ...) so the UI can render one selector control per attribute type
 * rather than a flat variant dropdown — this is what makes a shade swatch
 * picker possible instead of a generic "select a SKU" list.
 */
@Component({
  selector: 'beauty-product-detail',
  standalone: true,
  imports: [DecimalPipe],
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

  readonly productResource = rxResource({
    params: () => ({ slug: this.slug() }),
    stream: ({ params }) => this.productsApi.getBySlug(params.slug),
  });

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
}
