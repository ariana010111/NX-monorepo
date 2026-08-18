import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty() variantId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty() variantLabel!: string;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() quantity!: number;
  @ApiProperty() lineTotal!: number;
}

export class OrderResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() orderNumber!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ required: false, nullable: true }) userId?: string | null; // null/undefined = guest checkout
  @ApiProperty() status!: string;
  @ApiProperty() subtotal!: number;
  @ApiProperty({ required: false }) discountTotal?: number;
  @ApiProperty({ required: false }) couponCode?: string;
  @ApiProperty() grandTotal!: number;
  @ApiProperty({ type: OrderItemResponseDto, isArray: true })
  items!: OrderItemResponseDto[];
  @ApiProperty() placedAt!: string;
}
