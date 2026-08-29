import { ApiProperty } from '@nestjs/swagger';

export class AdminCustomerSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty({ required: false, nullable: true }) phone?: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() orderCount!: number;
  @ApiProperty() lifetimeSpend!: number;
  @ApiProperty({ required: false, nullable: true }) lastOrderAt?: string | null;
}
