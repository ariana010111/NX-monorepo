import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';

// URL-based, not a file upload — no object storage (S3/Cloudinary) is
// wired into this sandbox. Matches the documented architecture decision
// to use real object storage in production; this lets the data model and
// API contract exist correctly now without needing storage credentials.
export class AddImageDto {
  @ApiProperty() @IsUrl() url!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() altText?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isPrimary?: boolean;
}
