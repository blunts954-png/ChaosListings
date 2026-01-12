import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({
    example: 'price_1234567890',
    description: 'New Stripe Price ID to change plan',
  })
  @IsOptional()
  @IsString()
  priceId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether to cancel subscription at period end',
  })
  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;
}
