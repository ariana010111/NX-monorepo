import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { CatalogFacade } from './catalog.facade';

@Component({
  selector: 'beauty-catalog-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <h1>Shop</h1>

    @if (facade.isLoading()) {
      <p>Loading…</p>
    } @else if (facade.hasError()) {
      <p>Something went wrong loading products.</p>
    } @else {
      <div class="grid">
        @for (product of facade.products(); track product.id) {
          <a [routerLink]="['/products', product.slug]" class="card">
            @if (product.images[0]; as img) {
              <img [src]="img.url" [alt]="img.altText ?? product.name" />
            }
            <h3>{{ product.name }}</h3>
            <p>{{ product.brandName }}</p>
            @if (product.fromPrice) {
              <p>From {{ product.fromPrice | number: '1.2-2' }}</p>
            }
          </a>
        }
      </div>
      <button (click)="facade.prevPage()">Previous</button>
      <button (click)="facade.nextPage()">Next</button>
    }
  `,
})
export class CatalogListComponent {
  readonly facade = inject(CatalogFacade);
}
