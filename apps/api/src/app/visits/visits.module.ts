import { Module } from '@nestjs/common';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';
import { VisitsRepository, PrismaVisitsRepository } from './visits.repository';

@Module({
  controllers: [VisitsController],
  providers: [VisitsService, { provide: VisitsRepository, useClass: PrismaVisitsRepository }],
  exports: [VisitsService],
})
export class VisitsModule {}
