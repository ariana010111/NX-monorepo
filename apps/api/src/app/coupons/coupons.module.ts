import { Module } from '@nestjs/common';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { CouponsRepository, InMemoryCouponsRepository } from './coupons.repository';

@Module({
  controllers: [CouponsController],
  providers: [CouponsService, { provide: CouponsRepository, useClass: InMemoryCouponsRepository }],
  exports: [CouponsService], // exported so OrdersModule can re-validate at order-creation time
})
export class CouponsModule {}
