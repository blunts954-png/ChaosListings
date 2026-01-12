import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { LoggerModule } from '../../common/modules/logger.module';

@Global()
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
