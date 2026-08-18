import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsString, IsNumber, IsPositive, ValidateNested, MinLength, IsOptional } from 'class-validator';

export class OrderItemInputDto {
  @ApiProperty() @IsString() variantId!: string;
  @ApiProperty() @IsString() productName!: string;
  @ApiProperty() @IsString() variantLabel!: string;
  @ApiProperty() @IsNumber() @IsPositive() unitPrice!: number;
  @ApiProperty() @IsNumber() @IsPositive() quantity!: number;
}

export class ShippingAddressInputDto {
  @ApiProperty() @IsString() @MinLength(2) fullName!: string;
  @ApiProperty() @IsString() line1!: string;
  @ApiProperty() @IsString() city!: string;
  @ApiProperty() @IsString() postalCode!: string;
  @ApiProperty() @IsString() country!: string;
}

export class CreateOrderDto {
  @ApiProperty() @IsEmail() email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiProperty({ type: ShippingAddressInputDto })
  @ValidateNested()
  @Type(() => ShippingAddressInputDto)
  shippingAddress!: ShippingAddressInputDto;

  @ApiProperty({ type: OrderItemInputDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];
}
