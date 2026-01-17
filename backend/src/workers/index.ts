import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { ListingsSyncWorker } from './listings-sync.worker';
import { RefreshStatusWorker } from './refresh-status.worker';
import { LoggerService } from '../common/services/logger.service';

/**
 * Worker process entry point
 * Starts BullMQ workers for background job processing
 */
async function bootstrap() {
  // Create NestJS application context for DI
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  // Redis connection config
  const redisHost = configService.get('REDIS_HOST', 'localhost');
  const redisPort = configService.get('REDIS_PORT', 6379);
  const redisPassword = configService.get('REDIS_PASSWORD');

  // Check if Redis host is a placeholder or invalid
  const isValidRedisHost = redisHost &&
    !redisHost.includes('${') &&
    !redisHost.includes('from your') &&
    redisHost !== 'host';

  if (!isValidRedisHost) {
    logger.warn('⚠️  Redis not properly configured. Workers cannot start.', 'WorkerBootstrap');
    logger.warn('   Set REDIS_HOST environment variable to enable background workers.', 'WorkerBootstrap');
    logger.log('Application will continue without background job processing.', 'WorkerBootstrap');
    // Keep the application running but don't start workers
    return;
  }

  const redisConfig = {
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    tls: configService.get('REDIS_TLS') === 'true' ? {} : undefined,
    maxRetriesPerRequest: null,
  };

  logger.log('Starting BullMQ workers...', 'WorkerBootstrap');

  try {
    // Get worker instances from DI container
    const listingsSyncWorker = app.get(ListingsSyncWorker);
    const refreshStatusWorker = app.get(RefreshStatusWorker);

    // Start Listings Sync Worker
    const syncWorker = new Worker(
      'sync-listings',
      async (job) => {
        return await listingsSyncWorker.process(job);
      },
      {
        connection: redisConfig,
        concurrency: 5, // Process up to 5 jobs concurrently
      }
    );

    syncWorker.on('completed', (job) => {
      logger.log(
        `Job ${job.id} completed successfully`,
        'ListingsSyncWorker',
      );
    });

    syncWorker.on('failed', (job, err) => {
      logger.error(
        `Job ${job?.id} failed: ${err.message}`,
        err.stack,
        'ListingsSyncWorker',
      );
    });

    // Start Refresh Status Worker
    const refreshWorker = new Worker(
      'refresh-status',
      async (job) => {
        return await refreshStatusWorker.process(job);
      },
      {
        connection: redisConfig,
        concurrency: 10, // Process up to 10 jobs concurrently
      }
    );

    refreshWorker.on('completed', (job) => {
      logger.log(
        `Job ${job.id} completed successfully`,
        'RefreshStatusWorker',
      );
    });

    refreshWorker.on('failed', (job, err) => {
      logger.error(
        `Job ${job?.id} failed: ${err.message}`,
        err.stack,
        'RefreshStatusWorker',
      );
    });

    logger.log('✅ Workers started successfully', 'WorkerBootstrap');
    logger.log('  - sync-listings (concurrency: 5)', 'WorkerBootstrap');
    logger.log('  - refresh-status (concurrency: 10)', 'WorkerBootstrap');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('Received SIGTERM, closing workers...', 'WorkerBootstrap');
      await syncWorker.close();
      await refreshWorker.close();
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('Received SIGINT, closing workers...', 'WorkerBootstrap');
      await syncWorker.close();
      await refreshWorker.close();
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error(
      'Failed to start workers',
      error.stack,
      'WorkerBootstrap',
    );
    process.exit(1);
  }
}

bootstrap();
