import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponResponseDto {
  @ApiProperty() code!: string;
  @ApiProperty() discountAmount!: number;
}
