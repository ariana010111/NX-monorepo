import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsTrendsDto } from './dto/analytics-trends.dto';
import { TopProductsDto } from './dto/top-products.dto';
import { CustomerSegmentsDto } from './dto/customer-segments.dto';
import { TrendsQueryDto, TopProductsQueryDto } from './dto/analytics-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiBearerAuth()
@ApiTags('admin-analytics')
@Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
@Controller('admin/analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('trends')
  @ApiOperation({
    summary: 'Admin: daily visits, order count, and revenue for a date range (default last 30 days)',
  })
  @ApiOkResponse({ type: AnalyticsTrendsDto })
  getTrends(@Query() query: TrendsQueryDto): Promise<AnalyticsTrendsDto> {
    this.logger.log(`GET /admin/analytics/trends`);
    return this.analyticsService.getTrends(query);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Admin: top products ranked by order count and revenue' })
  @ApiOkResponse({ type: TopProductsDto })
  getTopProducts(@Query() query: TopProductsQueryDto): Promise<TopProductsDto> {
    this.logger.log(`GET /admin/analytics/top-products`);
    return this.analyticsService.getTopProducts(query);
  }

  @Get('customer-segments')
  @ApiOperation({ summary: 'Admin: new-vs-returning customer counts' })
  @ApiOkResponse({ type: CustomerSegmentsDto })
  getCustomerSegments(): Promise<CustomerSegmentsDto> {
    this.logger.log(`GET /admin/analytics/customer-segments`);
    return this.analyticsService.getCustomerSegments();
  }
}
