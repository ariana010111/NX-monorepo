import { ApiProperty } from '@nestjs/swagger';

export class TopProductDto {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty() totalOrders!: number;
  @ApiProperty() totalRevenue!: number;
}

export class TopProductsDto {
  @ApiProperty({ type: TopProductDto, isArray: true }) products!: TopProductDto[];
}
