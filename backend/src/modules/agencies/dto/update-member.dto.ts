import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsArray } from 'class-validator';

export class UpdateMemberDto {
  @ApiPropertyOptional({
    example: 'admin',
    enum: ['owner', 'admin', 'member'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['owner', 'admin', 'member'])
  role?: string;

  @ApiPropertyOptional({
    example: ['businesses.create', 'businesses.edit'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    example: 'active',
    enum: ['active', 'inactive', 'pending'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'pending'])
  status?: string;
}
