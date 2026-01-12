import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsUrl } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    example: 'price_1234567890',
    description: 'Stripe Price ID',
  })
  @IsString()
  priceId: string;

  @ApiProperty({
    example: 'https://app.example.com/billing/success',
    description: 'URL to redirect to on successful checkout',
  })
  @IsUrl()
  successUrl: string;

  @ApiProperty({
    example: 'https://app.example.com/billing',
    description: 'URL to redirect to on cancelled checkout',
  })
  @IsUrl()
  cancelUrl: string;

  @ApiPropertyOptional({
    example: 14,
    description: 'Trial period in days',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  trialDays?: number;
}
