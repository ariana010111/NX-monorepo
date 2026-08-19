import { Injectable } from '@nestjs/common';
import { PaymentProvider, ChargeRequest, ChargeResult } from '../payment-provider.interface';

/**
 * TEMPORARY stand-in for a real gateway. No real Stripe integration exists
 * yet — this sandbox has no network access to api.stripe.com and no test
 * API keys configured, so a real StripePaymentProvider can't be built and
 * verified here. This mock exists so the REST of the system (order status
 * transitions, verified-purchase logic, admin visibility) can be built and
 * proven correct independently of which gateway eventually gets wired in.
 *
 * Deliberately simulates a real failure path rather than always
 * succeeding: any charge for an email containing "declined" fails, so the
 * failure branch of PaymentsService is exercisable and testable, not just
 * assumed to work.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async charge(request: ChargeRequest): Promise<ChargeResult> {
    if (request.email.includes('declined')) {
      return { success: false, providerPaymentId: `mock_failed_${Date.now()}`, failureReason: 'Card declined' };
    }
    return { success: true, providerPaymentId: `mock_charge_${Date.now()}` };
  }
}
