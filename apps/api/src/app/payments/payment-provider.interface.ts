export interface ChargeRequest {
  orderId: string;
  amount: number; // in major currency units, e.g. dollars — matches OrderResponseDto.grandTotal
  currency: string;
  email: string;
}

export interface ChargeResult {
  success: boolean;
  providerPaymentId: string;
  failureReason?: string;
}

/**
 * Every real payment gateway (Stripe, Braintree, ...) implements this
 * same interface. Swapping providers means writing a new class here and
 * changing one binding in payments.module.ts — nothing in PaymentsService,
 * OrdersService, or any controller changes.
 */
export abstract class PaymentProvider {
  abstract charge(request: ChargeRequest): Promise<ChargeResult>;
}
