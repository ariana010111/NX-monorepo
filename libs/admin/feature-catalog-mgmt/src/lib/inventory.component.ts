import { Component, inject } from '@angular/core';
import { InventoryFacade } from './inventory.facade';

@Component({
  selector: 'beauty-admin-inventory',
  standalone: true,
  template: `
    <section class="admin-panel">
      <div class="beauty-section-head">
        <h2>Inventory</h2>
      </div>

      @if (facade.isLoading()) {
        <p>Loading…</p>
      } @else {
        <div class="admin-table-wrap">
          <table class="beauty-table">
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
                    <button class="beauty-btn beauty-btn--secondary" type="button" (click)="onRestock(item.variantId)">+10 restock</button>
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
export class InventoryComponent {
  readonly facade = inject(InventoryFacade);

  onRestock(variantId: string) {
    this.facade.adjust(variantId, 10, 'Manual restock from admin');
  }
}
