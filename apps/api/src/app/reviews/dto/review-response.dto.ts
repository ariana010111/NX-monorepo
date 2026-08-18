import { ApiProperty } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() authorName!: string; // first name + last initial, never the full account identity
  @ApiProperty({ minimum: 1, maximum: 5 }) rating!: number;
  @ApiProperty({ required: false }) title?: string;
  @ApiProperty({ required: false }) body?: string;
  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] }) status!: string;
  @ApiProperty() isVerifiedPurchase!: boolean;
  @ApiProperty() createdAt!: string;
}
