import { ApiProperty } from '@nestjs/swagger';
import { OrderResponseDto } from '../../orders/dto/order-response.dto';

export class CustomerProfileResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty({ required: false, nullable: true }) phone?: string | null;
  @ApiProperty() createdAt!: string;
  /** Aggregated lifetime statistics */
  @ApiProperty() orderCount!: number;
  @ApiProperty() lifetimeSpend!: number;
  @ApiProperty({ required: false, nullable: true }) lastOrderAt?: string | null;
  @ApiProperty({ type: OrderResponseDto, isArray: true }) orders!: OrderResponseDto[];
}
