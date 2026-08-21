import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { CheckoutFacade } from './checkout.facade';

@Component({
  selector: 'beauty-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    @if (facade.placedOrder(); as order) {
      <h1>Thank you!</h1>
      <p>Order {{ order.orderNumber }} confirmed.</p>
      @if (order.discountTotal) {
        <p>Discount applied ({{ order.couponCode }}): -{{ order.discountTotal | number: '1.2-2' }}</p>
      }
      <p>Total: {{ order.grandTotal | number: '1.2-2' }}</p>
    } @else {
      <h1>Checkout</h1>

      <ul>
        @for (line of facade.cart.items(); track line.variantId) {
          <li>{{ line.name }} — {{ line.shade }} × {{ line.quantity }}</li>
        }
      </ul>
      <p>Subtotal: {{ facade.cart.subtotal() | number: '1.2-2' }}</p>

      <div>
        @if (facade.couponDiscount(); as discount) {
          <p>
            Coupon "{{ facade.couponCode() }}" applied: -{{ discount | number: '1.2-2' }}
            <button type="button" (click)="facade.removeCoupon()">Remove</button>
          </p>
        } @else {
          <input #couponInput placeholder="Coupon code" />
          <button type="button" [disabled]="facade.isValidatingCoupon()" (click)="onApplyCoupon(couponInput.value)">
            {{ facade.isValidatingCoupon() ? 'Checking…' : 'Apply' }}
          </button>
          @if (facade.couponError(); as couponError) {
            <p role="alert">{{ couponError }}</p>
          }
        }
      </div>

      <p><strong>Estimated total: {{ facade.grandTotalPreview() | number: '1.2-2' }}</strong></p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <label>
          Email
          <input type="email" formControlName="email" />
        </label>

        <fieldset formGroupName="shippingAddress">
          <legend>Shipping address</legend>
          <input formControlName="fullName" placeholder="Full name" />
          <input formControlName="line1" placeholder="Address" />
          <input formControlName="city" placeholder="City" />
          <input formControlName="postalCode" placeholder="Postal code" />
          <input formControlName="country" placeholder="Country" />
        </fieldset>

        @if (facade.error(); as error) {
          <p role="alert">{{ error }}</p>
        }

        <button type="submit" [disabled]="form.invalid || facade.isSubmitting()">
          {{ facade.isSubmitting() ? 'Placing order…' : 'Place order' }}
        </button>
      </form>
    }
  `,
})
export class CheckoutComponent {
  readonly facade = inject(CheckoutFacade);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    shippingAddress: this.fb.nonNullable.group({
      fullName: ['', Validators.required],
      line1: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
    }),
  });

  onApplyCoupon(code: string) {
    this.facade.applyCoupon(code);
  }

  onSubmit() {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.facade.submit(value.email, value.shippingAddress);
  }
}
