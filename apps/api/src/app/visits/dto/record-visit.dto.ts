import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordVisitDto {
  /** The storefront path being visited, e.g. "/products/rose-serum" */
  @ApiProperty({ example: '/products/rose-serum' })
  @IsString()
  @MaxLength(2000)
  path!: string;

  /** Opaque client session identifier (e.g. from a first-party cookie). */
  @ApiProperty({ required: false, example: 'sess_abc123' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sessionId?: string;

  /**
   * Product id of the page being visited, if a product page.
   * Allows per-product view analytics without parsing the path.
   */
  @ApiProperty({ required: false, example: 'prod_xyz' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  productId?: string;

  /** The HTTP Referer header value, forwarded by the storefront client. */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  referrer?: string;

  /** User-Agent string forwarded by the storefront client. */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  userAgent?: string;
}
