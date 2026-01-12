import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Request,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WebhooksService } from './webhooks.service';
import { StripeService } from '../../integrations/stripe/stripe.service';
import { CustomLogger } from '../../common/modules/logger.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('WebhooksController');
  }

  @Post('stripe')
  @HttpCode(200)
  @ApiExcludeEndpoint() // Don't show in Swagger - external webhook
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid signature' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Request() req: RawBodyRequest<Request>,
  ) {
    this.logger.log('Received Stripe webhook');

    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      this.logger.error('Stripe webhook secret not configured');
      throw new BadRequestException('Webhook secret not configured');
    }

    let event;
    try {
      // Get raw body (required for signature verification)
      const rawBody = req.rawBody;
      if (!rawBody) {
        throw new BadRequestException('No raw body available');
      }

      // Construct and verify the event
      event = this.stripeService.constructWebhookEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw new BadRequestException('Invalid signature');
    }

    try {
      await this.webhooksService.handleStripeWebhook(event);
      return { received: true };
    } catch (error) {
      this.logger.error('Error handling Stripe webhook', error);
      // Return 200 to Stripe to avoid retries for application errors
      // The webhook is stored and can be retried manually
      return { received: true, error: 'Processing failed, will retry' };
    }
  }

  @Post('yext')
  @HttpCode(200)
  @ApiExcludeEndpoint() // Don't show in Swagger - external webhook
  @ApiOperation({ summary: 'Yext webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleYextWebhook(@Body() webhookData: any) {
    this.logger.log('Received Yext webhook');

    // TODO: Add Yext webhook signature verification
    // Yext provides a signature header similar to Stripe

    try {
      await this.webhooksService.handleYextWebhook(webhookData);
      return { received: true };
    } catch (error) {
      this.logger.error('Error handling Yext webhook', error);
      // Return 200 to avoid retries for application errors
      return { received: true, error: 'Processing failed, will retry' };
    }
  }
}
