import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ required: false, nullable: true }) parentId?: string | null;
  @ApiProperty({ required: false }) imageUrl?: string;
  @ApiProperty({ type: () => CategoryResponseDto, isArray: true, required: false })
  children?: CategoryResponseDto[];
}
