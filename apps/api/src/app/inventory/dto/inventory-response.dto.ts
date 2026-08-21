import { ApiProperty } from '@nestjs/swagger';

export class InventoryItemResponseDto {
  @ApiProperty() variantId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty() variantLabel!: string;
  @ApiProperty() quantityOnHand!: number;
  @ApiProperty() quantityReserved!: number;
  @ApiProperty() quantityAvailable!: number;
  @ApiProperty() lowStockThreshold!: number;
}
