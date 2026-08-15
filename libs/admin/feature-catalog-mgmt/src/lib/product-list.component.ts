import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductListFacade } from './product-list.facade';

@Component({
  selector: 'beauty-admin-product-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Products</h1>
    <a routerLink="new">New product</a>

    @if (facade.isLoading()) {
      <p>Loading…</p>
    } @else {
      <table>
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
                <a [routerLink]="[product.id, 'edit']">Edit</a>
                <button type="button" (click)="onDelete(product.id)">Delete</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class ProductListComponent {
  readonly facade = inject(ProductListFacade);

  onDelete(id: string) {
    this.facade.deleteProduct(id);
  }
}
