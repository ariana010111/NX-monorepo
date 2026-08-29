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
        <div class="feature-panel checkout-confirmation">
          <div class="beauty-subtle">Order confirmation</div>
          <h1>Thank you!</h1>
          <p>Order {{ order.orderNumber }} confirmed.</p>
          @if (order.discountTotal) {
            <p>Discount applied ({{ order.couponCode }}): -{{ order.discountTotal | number: '1.2-2' }}</p>
          }
          <p class="beauty-price">Total: {{ order.grandTotal | number: '1.2-2' }}</p>
        </div>
      } @else {
        <div class="checkout-layout">
          <div class="feature-panel checkout-main-panel">
            <div class="beauty-subtle">Secure checkout</div>
            <h1>Checkout</h1>

            <div class="checkout-item-list">
              @for (line of facade.cart.items(); track line.variantId) {
                <div class="checkout-item-card">
                  <div class="checkout-item-card__meta">
                    <span class="checkout-item-card__name">{{ line.name }}</span>
                    <span class="beauty-subtle">{{ line.shade }} × {{ line.quantity }}</span>
                  </div>
                  <strong>{{ (line.unitPrice * line.quantity) | number: '1.2-2' }}</strong>
                </div>
              }
            </div>

            <div class="checkout-coupon">
              @if (facade.couponDiscount(); as discount) {
                <div class="checkout-coupon__applied">
                  <span>Coupon "{{ facade.couponCode() }}" applied</span>
                  <strong>-{{ discount | number: '1.2-2' }}</strong>
                  <button class="beauty-btn beauty-btn--secondary" type="button" (click)="facade.removeCoupon()">Remove</button>
                </div>
              } @else {
                <div class="checkout-coupon__form">
                  <input #couponInput placeholder="Coupon code" />
                  <button class="beauty-btn beauty-btn--secondary" type="button" [disabled]="facade.isValidatingCoupon()" (click)="onApplyCoupon(couponInput.value)">
                    {{ facade.isValidatingCoupon() ? 'Checking…' : 'Apply' }}
                  </button>
                </div>
                @if (facade.couponError(); as couponError) {
                  <p class="checkout-alert" role="alert">{{ couponError }}</p>
                }
              }
            </div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid checkout-form">
              <div class="field field--full">
                <label>Email</label>
                <input type="email" formControlName="email" placeholder="you@example.com" />
              </div>

              <fieldset formGroupName="shippingAddress" class="checkout-address-fieldset">
                <legend>Shipping address</legend>
                <div class="form-grid checkout-address-grid">
                  <div class="field field--full"><input formControlName="fullName" placeholder="Full name" /></div>
                  <div class="field field--full"><input formControlName="line1" placeholder="Address" /></div>
                  <div class="field"><input formControlName="city" placeholder="City" /></div>
                  <div class="field"><input formControlName="postalCode" placeholder="Postal code" /></div>
                  <div class="field field--full"><input formControlName="country" placeholder="Country" /></div>
                </div>
              </fieldset>

              @if (facade.error(); as error) {
                <p class="checkout-alert" role="alert">{{ error }}</p>
              }

              <div class="form-actions checkout-actions">
                <button class="beauty-btn beauty-btn--primary" type="submit" [disabled]="form.invalid || facade.isSubmitting()">
                  {{ facade.isSubmitting() ? 'Placing order…' : 'Place order' }}
                </button>
              </div>
            </form>
          </div>

          <aside class="feature-panel checkout-summary-panel">
            <div class="beauty-subtle">Order summary</div>
            <div class="checkout-summary-row">
              <span>Subtotal</span>
              <strong>{{ facade.cart.subtotal() | number: '1.2-2' }}</strong>
            </div>
            <div class="checkout-summary-row">
              <span>Shipping</span>
              <strong>Free</strong>
            </div>
            <div class="checkout-summary-row checkout-summary-row--total">
              <span>Estimated total</span>
              <span>{{ facade.grandTotalPreview() | number: '1.2-2' }}</span>
            </div>
          </aside>
        </div>
      }
    </div>
  `,
  styles: `
    .checkout-layout {
      display: flex;
      align-items: flex-start;
      gap: 24px;
    }

    .checkout-main-panel,
    .checkout-summary-panel,
    .checkout-confirmation {
      width: 100%;
      border-radius: var(--beauty-radius-lg);
      border: 1px solid var(--beauty-border);
      background: var(--beauty-bg);
      box-shadow: var(--beauty-shadow-soft);
    }

    .checkout-main-panel {
      flex: 1.3;
      padding: 24px;
    }

    .checkout-summary-panel {
      flex: 0.7;
      position: sticky;
      top: 96px;
      padding: 24px;
    }

    .checkout-confirmation {
      max-width: 720px;
      margin: 0 auto;
      padding: 32px;
    }

    .checkout-item-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 24px 0;
    }

    .checkout-item-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 18px;
      border: 1px solid var(--beauty-border);
      border-radius: var(--beauty-radius-md);
      background: var(--beauty-bg-soft);
    }

    .checkout-item-card__meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .checkout-item-card__name {
      font-weight: 600;
      color: var(--beauty-text);
    }

    .checkout-coupon {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--beauty-border);
    }

    .checkout-coupon__applied,
    .checkout-coupon__form {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .checkout-coupon__form input {
      flex: 1;
      min-width: 180px;
      max-width: 220px;
    }

    .checkout-address-fieldset {
      grid-column: 1 / -1;
      margin: 0;
      padding: 18px;
      border: 1px solid var(--beauty-border);
      border-radius: var(--beauty-radius-md);
      background: var(--beauty-bg-soft);
    }

    .checkout-address-fieldset legend {
      padding: 0 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--beauty-text-secondary);
    }

    .checkout-address-grid {
      margin-top: 12px;
    }

    .checkout-form {
      grid-template-columns: 1fr;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .field label {
      font-size: 13px;
      color: var(--beauty-text-secondary);
      font-weight: 600;
    }

    .field input,
    .field select,
    .field textarea,
    .checkout-coupon__form input {
      width: 100%;
      min-height: 48px;
      padding: 11px 12px;
      border: 1px solid var(--beauty-border);
      border-radius: var(--beauty-radius-sm);
      background: #fff;
      color: var(--beauty-text);
    }

    .field--full {
      grid-column: 1 / -1;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-start;
      gap: 12px;
      margin-top: 8px;
    }

    .checkout-alert {
      margin: 0;
      color: var(--beauty-danger);
      font-size: 14px;
    }

    .checkout-summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-top: 18px;
      color: var(--beauty-text-secondary);
    }

    .checkout-summary-row strong,
    .checkout-summary-row span:last-child {
      color: var(--beauty-text);
      font-weight: 700;
    }

    .checkout-summary-row--total {
      margin-top: 20px;
      padding-top: 18px;
      border-top: 1px solid var(--beauty-border);
      font-size: 1.15rem;
      color: var(--beauty-text);
    }

    @media (max-width: 860px) {
      .checkout-layout {
        flex-direction: column;
      }

      .checkout-main-panel,
      .checkout-summary-panel {
        width: 100%;
      }
    }

    @media (max-width: 540px) {
      .checkout-main-panel,
      .checkout-summary-panel,
      .checkout-confirmation {
        padding: 20px;
      }

      .checkout-item-card,
      .checkout-coupon__applied,
      .checkout-coupon__form {
        align-items: flex-start;
        flex-direction: column;
      }

      .checkout-coupon__form input {
        max-width: none;
      }
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
