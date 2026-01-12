import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaModule } from '../../common/modules/prisma.module';
import { LoggerModule } from '../../common/modules/logger.module';
import { StripeModule } from '../../integrations/stripe/stripe.module';

@Module({
  imports: [PrismaModule, LoggerModule, StripeModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
