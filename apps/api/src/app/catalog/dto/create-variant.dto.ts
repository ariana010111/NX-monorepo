import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsPositive, IsOptional, IsArray, ValidateNested, MinLength } from 'class-validator';

export class VariantAttributeInputDto {
  @ApiProperty({ example: 'Shade' }) @IsString() attributeName!: string;
  @ApiProperty({ example: 'Rosy Pink' }) @IsString() value!: string;
  @ApiPropertyOptional({ example: '#c97b8f' }) @IsOptional() @IsString() colorHex?: string;
}

export class CreateVariantDto {
  @ApiProperty({ example: 'SKU-001' }) @IsString() @MinLength(2) sku!: string;
  @ApiProperty() @IsNumber() @IsPositive() price!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @IsPositive() compareAtPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiProperty({ type: VariantAttributeInputDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeInputDto)
  attributes!: VariantAttributeInputDto[];

  // Initial stock, so the variant is immediately sellable rather than
  // created with zero inventory and silently unpurchasable until someone
  // remembers to visit the separate inventory screen.
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() initialStock?: number;
}
