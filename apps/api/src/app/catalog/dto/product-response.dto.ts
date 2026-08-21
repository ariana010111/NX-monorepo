import { ApiProperty } from '@nestjs/swagger';

export class VariantAttributeDto {
  @ApiProperty({ example: 'Shade' }) attributeName!: string;
  @ApiProperty({ example: 'Rosy Pink' }) value!: string;
  @ApiProperty({ required: false, example: '#c97b8f' }) colorHex?: string;
}

export class ProductVariantDto {
  @ApiProperty() id!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() price!: number;
  @ApiProperty({ required: false }) compareAtPrice?: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ type: VariantAttributeDto, isArray: true })
  attributes!: VariantAttributeDto[];
  @ApiProperty({ required: false }) imageUrl?: string;
}

export class ProductImageDto {
  @ApiProperty() url!: string;
  @ApiProperty({ required: false }) altText?: string;
  @ApiProperty() isPrimary!: boolean;
}

export class ProductResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ required: false }) description?: string;
  @ApiProperty({ required: false }) shortDescription?: string;
  @ApiProperty({ required: false }) brandName?: string;
  @ApiProperty({ required: false }) brandSlug?: string;
  @ApiProperty() status!: string;
  @ApiProperty({ type: ProductImageDto, isArray: true })
  images!: ProductImageDto[];
  @ApiProperty({ type: ProductVariantDto, isArray: true })
  variants!: ProductVariantDto[];
  // Lowest variant price, for listing cards — avoids the client computing Math.min over variants.
  @ApiProperty({ required: false }) fromPrice?: number;
}
