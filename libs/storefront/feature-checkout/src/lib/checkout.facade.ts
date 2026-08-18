import { Injectable, computed, inject, signal } from '@angular/core';
import { OrdersApiService, CartFacade } from '@beauty-platform-validated/storefront-data-access';
import type { CreateOrderDto, OrderResponseDto } from '@beauty-platform-validated/api-client';

/**
 * Route-scoped facade for the checkout-in-progress state (submitting flag,
 * applied coupon, the placed order once confirmed). Reads cart contents
 * from CartFacade (root-provided, data-access) rather than duplicating
 * cart state here — per the state-layer rules, this facade only owns what's
 * specific to the checkout process itself.
 */
@Injectable()
export class CheckoutFacade {
  private readonly ordersApi = inject(OrdersApiService);
  readonly cart = inject(CartFacade);

  readonly isSubmitting = signal(false);
  readonly placedOrder = signal<OrderResponseDto | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);

  readonly couponCode = signal<string | undefined>(undefined);
  readonly couponDiscount = signal<number | undefined>(undefined);
  readonly couponError = signal<string | undefined>(undefined);
  readonly isValidatingCoupon = signal(false);

  readonly grandTotalPreview = computed(() => {
    const discount = this.couponDiscount() ?? 0;
    return Math.max(0, this.cart.subtotal() - discount);
  });

  /**
   * Preview-only — the server ALWAYS re-validates the coupon again at
   * order-creation time (see OrdersService.create), so this never becomes
   * a value the client can spoof its way past. It just avoids a customer
   * finding out their code didn't work only after submitting the whole form.
   */
  async applyCoupon(code: string) {
    if (!code.trim()) return;
    this.isValidatingCoupon.set(true);
    this.couponError.set(undefined);
    try {
      const result = await new Promise<{ code: string; discountAmount: number }>((resolve, reject) =>
        this.ordersApi.validateCoupon(code, this.cart.subtotal()).subscribe({ next: resolve, error: reject }),
      );
      this.couponCode.set(result.code);
      this.couponDiscount.set(result.discountAmount);
    } catch (e: unknown) {
      this.couponCode.set(undefined);
      this.couponDiscount.set(undefined);
      const message = (e as { error?: { message?: string } })?.error?.message;
      this.couponError.set(typeof message === 'string' ? message : 'Could not apply that code.');
    } finally {
      this.isValidatingCoupon.set(false);
    }
  }

  removeCoupon() {
    this.couponCode.set(undefined);
    this.couponDiscount.set(undefined);
    this.couponError.set(undefined);
  }

  async submit(email: string, shippingAddress: CreateOrderDto['shippingAddress']) {
    if (this.cart.items().length === 0) {
      this.error.set('Your bag is empty.');
      return;
    }
    this.isSubmitting.set(true);
    this.error.set(undefined);
    try {
      const order = await new Promise<OrderResponseDto>((resolve, reject) =>
        this.ordersApi
          .create({
            email,
            couponCode: this.couponCode(),
            shippingAddress,
            items: this.cart.items().map((line) => ({
              variantId: line.variantId,
              productName: line.name,
              variantLabel: line.shade,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
            })),
          })
          .subscribe({ next: resolve, error: reject }),
      );
      this.placedOrder.set(order);
      this.cart.clear();
    } catch {
      this.error.set('Something went wrong placing your order. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
