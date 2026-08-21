import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'Lumière' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'lumiere' })
  @IsString()
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;
}
