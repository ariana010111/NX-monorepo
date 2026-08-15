import { ApiProperty } from '@nestjs/swagger';

export class BrandResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ required: false }) logoUrl?: string;
}
