import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository, PrismaPaymentsRepository } from './payments.repository';
import { PaymentProvider } from './payment-provider.interface';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PaymentsRepository, useClass: PrismaPaymentsRepository },
    // The ONE line that changes when a real gateway is wired in.
    { provide: PaymentProvider, useClass: MockPaymentProvider },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
