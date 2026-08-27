import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListFacade } from './product-list.facade';

@Component({
  selector: 'beauty-admin-product-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="admin-panel">
      <div class="beauty-section-head">
        <h2>Products</h2>
        <a class="beauty-btn beauty-btn--primary" routerLink="new">New product</a>
      </div>

      @if (facade.isLoading()) {
        <p>Loading…</p>
      } @else {
        <div class="admin-table-wrap">
          <table class="beauty-table">
            <thead>
              <tr><th>Name</th><th>Status</th><th>From price</th><th></th></tr>
            </thead>
            <tbody>
              @for (product of facade.products(); track product.id) {
                <tr>
                  <td>{{ product.name }}</td>
                  <td>{{ product.status }}</td>
                  <td>{{ product.fromPrice }}</td>
                  <td>
                    <div class="table-actions">
                      <a class="beauty-btn beauty-btn--secondary" [routerLink]="[product.id, 'edit']">Edit</a>
                      <button class="beauty-btn beauty-btn--secondary" type="button" (click)="onDelete(product.id)">Delete</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class ProductListComponent {
  readonly facade = inject(ProductListFacade);

  onDelete(id: string) {
    this.facade.deleteProduct(id);
  }
}
