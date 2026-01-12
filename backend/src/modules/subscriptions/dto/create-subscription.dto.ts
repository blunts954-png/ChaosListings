import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({
    example: 'price_1234567890',
    description: 'Stripe Price ID',
  })
  @IsString()
  priceId: string;

  @ApiPropertyOptional({
    example: 14,
    description: 'Trial period in days',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trialDays?: number;

  @ApiPropertyOptional({
    example: 'pm_1234567890',
    description: 'Stripe Payment Method ID (optional if customer has default)',
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
