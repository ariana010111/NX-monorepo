import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Velvet Matte Lipstick' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'velvet-matte-lipstick' })
  @IsString()
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
