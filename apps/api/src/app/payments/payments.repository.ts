import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentResponseDto } from './dto/payment-response.dto';

export abstract class PaymentsRepository {
  abstract create(payment: Omit<PaymentResponseDto, 'id' | 'createdAt'>): Promise<PaymentResponseDto>;
  abstract findByOrderId(orderId: string): Promise<PaymentResponseDto[]>;
}

/**
 * TEMPORARY in-memory implementation — same pattern as every other
 * repository in this codebase. Multiple Payment rows per order is
 * intentional (matches the approved schema): a declined attempt followed
 * by a successful retry must both remain visible, not overwrite each other.
 */
@Injectable()
export class PrismaPaymentsRepository implements PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}
  private map(payment: any): PaymentResponseDto { return { id: payment.id, orderId: payment.orderId, provider: payment.provider, providerPaymentId: payment.providerPaymentId, amount: Number(payment.amount), currency: payment.currency, status: payment.status, createdAt: payment.createdAt.toISOString() }; }
  async create(payment: Omit<PaymentResponseDto, 'id' | 'createdAt'>) { return this.map(await this.prisma.payment.create({ data: { orderId: payment.orderId, provider: payment.provider as any, providerPaymentId: payment.providerPaymentId, amount: payment.amount, currency: payment.currency, status: payment.status as any } })); }
  async findByOrderId(orderId: string) { return (await this.prisma.payment.findMany({ where: { orderId }, orderBy: { createdAt: 'asc' } })).map((payment) => this.map(payment)); }
}
