import { ApiProperty } from '@nestjs/swagger';

export class DailyTrendPointDto {
  /** ISO date string YYYY-MM-DD */
  @ApiProperty({ example: '2026-08-01' }) date!: string;
  @ApiProperty() visits!: number;
  @ApiProperty() orders!: number;
  @ApiProperty() revenue!: number;
}

export class AnalyticsTrendsDto {
  @ApiProperty({ type: DailyTrendPointDto, isArray: true }) days!: DailyTrendPointDto[];
  @ApiProperty() totalVisits!: number;
  @ApiProperty() totalOrders!: number;
  @ApiProperty() totalRevenue!: number;
}
