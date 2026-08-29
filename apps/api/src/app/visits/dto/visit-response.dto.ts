import { ApiProperty } from '@nestjs/swagger';

export class VisitResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ required: false, nullable: true }) userId?: string | null;
  @ApiProperty({ required: false, nullable: true }) sessionId?: string | null;
  @ApiProperty({ required: false, nullable: true }) productId?: string | null;
  @ApiProperty() path!: string;
  @ApiProperty({ required: false, nullable: true }) referrer?: string | null;
  /** ISO timestamp; maps to the schema's `createdAt` field on storevisit */
  @ApiProperty() createdAt!: string;
}
