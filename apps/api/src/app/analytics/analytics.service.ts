import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { TrendsQueryDto, TopProductsQueryDto } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private static readonly DEFAULT_LOOK_BACK_DAYS = 30;
  private static readonly DEFAULT_TOP_PRODUCTS_LIMIT = 10;

  constructor(private readonly analyticsRepo: AnalyticsRepository) {}

  async getTrends(query: TrendsQueryDto) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - AnalyticsService.DEFAULT_LOOK_BACK_DAYS * 86400000);

    if (from > to) {
      throw new BadRequestException('`from` must not be later than `to`');
    }
    const daySpan = Math.ceil((to.getTime() - from.getTime()) / 86400000);
    if (daySpan > 366) {
      throw new BadRequestException('Date range must not exceed 366 days');
    }

    this.logger.log(`getTrends from=${from.toISOString()} to=${to.toISOString()}`);
    return this.analyticsRepo.getTrends(from, to);
  }

  getTopProducts(query: TopProductsQueryDto) {
    const limit = query.limit ?? AnalyticsService.DEFAULT_TOP_PRODUCTS_LIMIT;
    this.logger.log(`getTopProducts limit=${limit}`);
    return this.analyticsRepo.getTopProducts(limit);
  }

  getCustomerSegments() {
    this.logger.log('getCustomerSegments');
    return this.analyticsRepo.getCustomerSegments();
  }
}
