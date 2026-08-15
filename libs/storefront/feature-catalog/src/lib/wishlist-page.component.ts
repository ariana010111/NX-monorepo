import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { WishlistFacade } from '@beauty-platform-validated/storefront-data-access';

@Component({
  selector: 'beauty-wishlist-page',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <h1>Your Wishlist ({{ facade.count() }})</h1>
    @if (facade.count() === 0) {
      <p>Nothing saved yet.</p>
    } @else {
      <div class="grid">
        @for (item of facade.items(); track item.productId) {
          <div class="card">
            <a [routerLink]="['/products', item.productSlug]">
              @if (item.imageUrl) {
                <img [src]="item.imageUrl" [alt]="item.name" />
              }
              <h3>{{ item.name }}</h3>
              @if (item.fromPrice) {
                <p>From {{ item.fromPrice | number: '1.2-2' }}</p>
              }
            </a>
            <button type="button" (click)="facade.remove(item.productId)">Remove</button>
          </div>
        }
      </div>
    }
  `,
})
export class WishlistPageComponent {
  readonly facade = inject(WishlistFacade);
}
