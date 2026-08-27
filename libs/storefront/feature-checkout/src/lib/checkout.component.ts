import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { CheckoutFacade } from './checkout.facade';

@Component({
  selector: 'beauty-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="page-shell">
      @if (facade.placedOrder(); as order) {
        <div class="feature-panel" style="max-width: 720px; margin: 0 auto; padding: 32px;">
          <div class="beauty-subtle">Order confirmation</div>
          <h1>Thank you!</h1>
          <p>Order {{ order.orderNumber }} confirmed.</p>
          @if (order.discountTotal) {
            <p>Discount applied ({{ order.couponCode }}): -{{ order.discountTotal | number: '1.2-2' }}</p>
          }
          <p class="beauty-price">Total: {{ order.grandTotal | number: '1.2-2' }}</p>
        </div>
      } @else {
        <div class="checkout-layout" style="gap: 24px; align-items: flex-start;">
          <div class="feature-panel" style="flex: 1.2; padding: 24px;">
            <div class="beauty-subtle">Secure checkout</div>
            <h1>Checkout</h1>

            <div style="margin: 20px 0;">
              @for (line of facade.cart.items(); track line.variantId) {
                <div class="feature-panel" style="padding: 16px; margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between; gap: 12px;">
                    <span>{{ line.name }} — {{ line.shade }} × {{ line.quantity }}</span>
                    <strong>{{ (line.unitPrice * line.quantity) | number: '1.2-2' }}</strong>
                  </div>
                </div>
              }
            </div>

            <div style="margin-bottom: 16px;">
              @if (facade.couponDiscount(); as discount) {
                <p>
                  Coupon "{{ facade.couponCode() }}" applied: -{{ discount | number: '1.2-2' }}
                  <button class="beauty-btn beauty-btn--secondary" type="button" (click)="facade.removeCoupon()">Remove</button>
                </p>
              } @else {
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                  <input #couponInput placeholder="Coupon code" style="max-width: 220px;" />
                  <button class="beauty-btn beauty-btn--secondary" type="button" [disabled]="facade.isValidatingCoupon()" (click)="onApplyCoupon(couponInput.value)">
                    {{ facade.isValidatingCoupon() ? 'Checking…' : 'Apply' }}
                  </button>
                </div>
                @if (facade.couponError(); as couponError) {
                  <p role="alert">{{ couponError }}</p>
                }
              }
            </div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid" style="grid-template-columns: 1fr;">
              <div class="field">
                <label>Email</label>
                <input type="email" formControlName="email" />
              </div>

              <fieldset formGroupName="shippingAddress" style="border: 1px solid var(--beauty-border); border-radius: 14px; padding: 16px; margin: 0;">
                <legend>Shipping address</legend>
                <div class="form-grid">
                  <div class="field"><input formControlName="fullName" placeholder="Full name" /></div>
                  <div class="field"><input formControlName="line1" placeholder="Address" /></div>
                  <div class="field"><input formControlName="city" placeholder="City" /></div>
                  <div class="field"><input formControlName="postalCode" placeholder="Postal code" /></div>
                  <div class="field" style="grid-column: 1 / -1;"><input formControlName="country" placeholder="Country" /></div>
                </div>
              </fieldset>

              @if (facade.error(); as error) {
                <p role="alert">{{ error }}</p>
              }

              <div class="form-actions" style="justify-content: flex-start;">
                <button class="beauty-btn beauty-btn--primary" type="submit" [disabled]="form.invalid || facade.isSubmitting()">
                  {{ facade.isSubmitting() ? 'Placing order…' : 'Place order' }}
                </button>
              </div>
            </form>
          </div>

          <aside class="feature-panel" style="flex: 0.7; padding: 24px; position: sticky; top: 96px;">
            <div class="beauty-subtle">Order summary</div>
            <div style="display: flex; justify-content: space-between; margin-top: 18px;">
              <span>Subtotal</span>
              <strong>{{ facade.cart.subtotal() | number: '1.2-2' }}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 10px;">
              <span>Estimated total</span>
              <strong>{{ facade.grandTotalPreview() | number: '1.2-2' }}</strong>
            </div>
          </aside>
        </div>
      }
    </div>
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
