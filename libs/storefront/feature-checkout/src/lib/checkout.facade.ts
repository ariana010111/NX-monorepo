import { Injectable, inject, signal } from '@angular/core';
import { OrdersApiService, CartFacade } from '@beauty-platform-validated/storefront-data-access';
import type { CreateOrderDto, OrderResponseDto } from '@beauty-platform-validated/api-client';

/**
 * Route-scoped facade for the checkout-in-progress state (submitting flag,
 * the placed order once confirmed). Reads cart contents from CartFacade
 * (root-provided, data-access) rather than duplicating cart state here —
 * per the state-layer rules, this facade only owns what's specific to the
 * checkout process itself.
 */
@Injectable()
export class CheckoutFacade {
  private readonly ordersApi = inject(OrdersApiService);
  readonly cart = inject(CartFacade);

  readonly isSubmitting = signal(false);
  readonly placedOrder = signal<OrderResponseDto | undefined>(undefined);
  readonly error = signal<string | undefined>(undefined);

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
