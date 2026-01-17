import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';

// Common modules
import { PrismaModule } from './common/modules/prisma.module';
import { LoggerModule } from './common/modules/logger.module';
import { EmailModule } from './common/modules/email.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { AgenciesModule } from './modules/agencies/agencies.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { ListingsModule } from './modules/listings/listings.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AiModule } from './modules/ai/ai.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { HealthModule } from './modules/health/health.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AdminModule } from './modules/admin/admin.module';

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

    // Redis/BullMQ - Make conditional to avoid connection errors when Redis is not available
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisHost = config.get<string>('REDIS_HOST', 'localhost');
        const redisPort = config.get<number>('REDIS_PORT', 6379);
        const redisPassword = config.get<string>('REDIS_PASSWORD');

        // Check if Redis host is a placeholder or invalid
        const isValidRedisHost = redisHost &&
          !redisHost.includes('${') &&
          !redisHost.includes('from your') &&
          redisHost !== 'host';

        if (!isValidRedisHost) {
          console.warn('⚠️  Redis not properly configured. BullMQ queues will not be available.');
          console.warn('   Set REDIS_HOST environment variable to enable job queues.');
        }

        return {
          connection: {
            host: isValidRedisHost ? redisHost : 'localhost',
            port: redisPort,
            password: redisPassword,
            tls: config.get<boolean>('REDIS_TLS', false)
              ? {
                  rejectUnauthorized: false,
                }
              : undefined,
            // Limit retries when Redis is not configured
            maxRetriesPerRequest: isValidRedisHost ? 3 : 1,
            retryStrategy: (times: number) => {
              // If Redis is not properly configured, stop retrying immediately
              if (!isValidRedisHost) {
                return null;
              }
              // Limit retry attempts to 3
              if (times > 3) {
                return null;
              }
              // Exponential backoff with max 2 seconds
              const delay = Math.min(times * 50, 2000);
              return delay;
            },
            // Add connection timeout
            connectTimeout: 5000,
            // Disable ready check to prevent immediate failures
            enableReadyCheck: false,
            // Set lazy connect to avoid blocking startup
            lazyConnect: !isValidRedisHost,
            // Disable offline queue when Redis is not configured
            enableOfflineQueue: isValidRedisHost,
            // Reduce error logging noise
            showFriendlyErrorStack: false,
          },
        };
      },
    }),

    // Common modules
    PrismaModule,
    LoggerModule,
    EmailModule,

    // Feature modules
    AuthModule,
    AgenciesModule,
    BusinessesModule,
    ListingsModule,
    SubscriptionsModule,
    WebhooksModule,
    AiModule,
    JobsModule,
    HealthModule,

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
