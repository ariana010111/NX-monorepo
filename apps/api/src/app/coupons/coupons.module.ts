import { Module } from '@nestjs/common';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { CouponsRepository, PrismaCouponsRepository } from './coupons.repository';

@Module({
  controllers: [CouponsController],
  providers: [CouponsService, { provide: CouponsRepository, useClass: PrismaCouponsRepository }],
  exports: [CouponsService], // exported so OrdersModule can re-validate at order-creation time
})
export class CouponsModule {}
