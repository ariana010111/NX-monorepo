import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() orderId!: string;
  @ApiProperty() provider!: string;
  @ApiProperty() providerPaymentId!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() currency!: string;
  @ApiProperty({ enum: ['PENDING', 'SUCCEEDED', 'FAILED'] }) status!: string;
  @ApiProperty({ required: false }) failureReason?: string;
  @ApiProperty() createdAt!: string;
}
