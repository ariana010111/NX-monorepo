import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Fragrance' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'fragrance' })
  @IsString()
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;
}
