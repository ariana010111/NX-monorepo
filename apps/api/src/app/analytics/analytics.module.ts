import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository, PrismaAnalyticsRepository } from './analytics.repository';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, { provide: AnalyticsRepository, useClass: PrismaAnalyticsRepository }],
})
export class AnalyticsModule {}
