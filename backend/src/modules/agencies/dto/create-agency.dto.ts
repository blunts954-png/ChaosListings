import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsUrl,
  MaxLength,
  Matches,
  IsObject,
} from 'class-validator';

export class CreateAgencyDto {
  @ApiProperty({ example: 'Acme Marketing Agency' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'acme-marketing' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
  })
  slug: string;

  @ApiProperty({ example: 'contact@acmemarketing.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+1-555-123-4567' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'https://acmemarketing.com' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  @MaxLength(1000)
  logoUrl?: string;

  @ApiPropertyOptional({
    example: { defaultTimezone: 'America/New_York', branding: {} },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
