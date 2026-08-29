import { IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TrendsQueryDto {
  @ApiProperty({ required: false, description: 'Start date ISO string (defaults to 30 days ago)', example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({ required: false, description: 'End date ISO string (defaults to today)', example: '2026-08-28' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class TopProductsQueryDto {
  @ApiProperty({ required: false, description: 'Max products to return (1-100, default 10)', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
