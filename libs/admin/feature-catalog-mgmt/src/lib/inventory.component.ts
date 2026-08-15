import { Component, inject } from '@angular/core';
import { InventoryFacade } from './inventory.facade';

@Component({
  selector: 'beauty-admin-inventory',
  standalone: true,
  template: `
    <h1>Inventory</h1>
    @if (facade.isLoading()) {
      <p>Loading…</p>
    } @else {
      <table>
        <thead>
          <tr><th>Product</th><th>Variant</th><th>On hand</th><th>Reserved</th><th>Available</th><th></th></tr>
        </thead>
        <tbody>
          @for (item of facade.items(); track item.variantId) {
            <tr [class.low-stock]="item.quantityAvailable <= item.lowStockThreshold">
              <td>{{ item.productName }}</td>
              <td>{{ item.variantLabel }}</td>
              <td>{{ item.quantityOnHand }}</td>
              <td>{{ item.quantityReserved }}</td>
              <td>{{ item.quantityAvailable }}</td>
              <td>
                <button type="button" (click)="onRestock(item.variantId)">+10 restock</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class InventoryComponent {
  readonly facade = inject(InventoryFacade);

  onRestock(variantId: string) {
    this.facade.adjust(variantId, 10, 'Manual restock from admin');
  }
}
