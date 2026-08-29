import { ApiProperty } from '@nestjs/swagger';

export class CustomerSegmentsDto {
  /** Customers who placed exactly one order. */
  @ApiProperty() newCustomers!: number;
  /** Customers who placed two or more orders. */
  @ApiProperty() returningCustomers!: number;
  /** Customers who have placed at least one order, total. */
  @ApiProperty() customersWithOrders!: number;
}
