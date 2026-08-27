import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export const MANAGED_ROLES = ['ADMIN', 'STAFF', 'CUSTOMER'] as const;

export class CreateManagedUserDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty({ minLength: 8 }) @IsString() @MinLength(8) password!: string;
  @ApiProperty() @IsString() @MinLength(1) firstName!: string;
  @ApiProperty() @IsString() @MinLength(1) lastName!: string;
  @ApiProperty({ enum: MANAGED_ROLES }) @IsIn(MANAGED_ROLES) role!: (typeof MANAGED_ROLES)[number];
}
