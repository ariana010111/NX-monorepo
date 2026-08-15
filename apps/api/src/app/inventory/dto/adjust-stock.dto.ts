import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional } from 'class-validator';

export class AdjustStockDto {
  // Positive to restock, negative for a manual correction/write-off.
  @ApiProperty({ example: 10 })
  @IsInt()
  quantityChange!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
