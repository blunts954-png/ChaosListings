import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';

// Common modules
import { PrismaModule } from './common/modules/prisma.module';
import { LoggerModule } from './common/modules/logger.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { AgenciesModule } from './modules/agencies/agencies.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { ListingsModule } from './modules/listings/listings.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { JobsModule } from './modules/jobs/jobs.module';

// Integration modules
import { YextModule } from './integrations/yext/yext.module';
import { StripeModule } from './integrations/stripe/stripe.module';

// Configuration
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60000), // 1 minute
            limit: config.get<number>('THROTTLE_LIMIT', 100), // 100 requests
          },
        ],
      }),
    }),

    // Redis/BullMQ
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD'),
          tls: config.get<boolean>('REDIS_TLS', false)
            ? {
                rejectUnauthorized: false,
              }
            : undefined,
        },
      }),
    }),

    // Common modules
    PrismaModule,
    LoggerModule,

    // Feature modules
    AuthModule,
    AgenciesModule,
    BusinessesModule,
    ListingsModule,
    SubscriptionsModule,
    WebhooksModule,
    JobsModule,

    // Integration modules
    YextModule,
    StripeModule,
  ],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
