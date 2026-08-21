import { Injectable, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { PaymentProvider } from './payment-provider.interface';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepo: PaymentsRepository,
    private readonly paymentProvider: PaymentProvider,
    private readonly ordersService: OrdersService,
  ) {}

  async payForOrder(orderId: string) {
    const order = await this.ordersService.getById(orderId);

    // Idempotency: an order that's already PAID (or further along) must
    // not be charged again just because this endpoint got called twice —
    // a real risk with any client that retries on a slow network response.
    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(`Order "${orderId}" is not awaiting payment (current status: ${order.status})`);
    }

    const result = await this.paymentProvider.charge({
      orderId,
      amount: order.grandTotal,
      currency: order.currency,
      email: order.email,
    });

    const payment = await this.paymentsRepo.create({
      orderId,
      provider: 'MOCK',
      providerPaymentId: result.providerPaymentId,
      amount: order.grandTotal,
      currency: order.currency,
      status: result.success ? 'SUCCEEDED' : 'FAILED',
      failureReason: result.failureReason,
    });

    if (result.success) {
      await this.ordersService.updateStatus(orderId, { status: 'PAID' });
    } else {
      // Order stays PENDING_PAYMENT on failure — the customer can retry
      // (e.g. with a different card) without needing a new order.
      throw new UnprocessableEntityException(result.failureReason ?? 'Payment failed');
    }

    return payment;
  }

  listForOrder(orderId: string) {
    return this.paymentsRepo.findByOrderId(orderId);
  }
}
