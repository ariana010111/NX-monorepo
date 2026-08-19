import { Injectable } from '@nestjs/common';
import { PaymentResponseDto } from './dto/payment-response.dto';

export abstract class PaymentsRepository {
  abstract create(payment: PaymentResponseDto): Promise<PaymentResponseDto>;
  abstract findByOrderId(orderId: string): Promise<PaymentResponseDto[]>;
}

/**
 * TEMPORARY in-memory implementation — same pattern as every other
 * repository in this codebase. Multiple Payment rows per order is
 * intentional (matches the approved schema): a declined attempt followed
 * by a successful retry must both remain visible, not overwrite each other.
 */
@Injectable()
export class InMemoryPaymentsRepository implements PaymentsRepository {
  private payments: PaymentResponseDto[] = [];

  async create(payment: PaymentResponseDto) {
    this.payments.push(payment);
    return payment;
  }

  async findByOrderId(orderId: string) {
    return this.payments.filter((p) => p.orderId === orderId);
  }
}
