import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CartFacade } from './cart.facade';

@Component({
  selector: 'beauty-cart-page',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <h1>Your Bag ({{ facade.itemCount() }})</h1>
    @for (line of facade.items(); track line.variantId) {
      <div>{{ line.name }} — {{ line.shade }} × {{ line.quantity }}</div>
    }
    <p>Subtotal: {{ facade.subtotal() | number: '1.2-2' }}</p>
  `,
})
export class CartPageComponent {
  readonly facade = inject(CartFacade);
}
