import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator';

// URL-based, not a file upload — no object storage (S3/Cloudinary) is
// wired into this sandbox. Matches the documented architecture decision
// to use real object storage in production; this lets the data model and
// API contract exist correctly now without needing storage credentials.
//
// The admin UI also allows attaching a file from disk; that file is read
// client-side and sent here as a data: URI, so the same field must accept
// either a real http(s) URL or a data:image/* URI.
export class AddImageDto {
  @ApiProperty() @Matches(/^(https?:\/\/|data:image\/)/) url!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() altText?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() isPrimary?: boolean;
}
