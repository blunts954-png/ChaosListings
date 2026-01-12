import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { PrismaModule } from '../../common/modules/prisma.module';
import { LoggerModule } from '../../common/modules/logger.module';
import { StripeModule } from '../../integrations/stripe/stripe.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [PrismaModule, LoggerModule, StripeModule, SubscriptionsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
