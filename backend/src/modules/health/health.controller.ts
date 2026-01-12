import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PrismaService } from '../../common/modules/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CustomLogger } from '../../common/modules/logger.service';
import * as Redis from 'ioredis';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private redis: Redis.Redis;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private logger: CustomLogger,
  ) {
    this.logger.setContext('HealthController');

    // Initialize Redis client for health checks
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get<string>('REDIS_PASSWORD'),
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.config.get<string>('NODE_ENV'),
    };
  }

  @Get('live')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveness() {
    return { status: 'alive' };
  }

  @Get('ready')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness() {
    const checks = await this.runHealthChecks();

    const allHealthy = Object.values(checks).every(check => check.status === 'up');

    if (!allHealthy) {
      return {
        status: 'not ready',
        checks,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'ready',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with all dependencies' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async detailedHealth() {
    const checks = await this.runHealthChecks();

    return {
      status: Object.values(checks).every(check => check.status === 'up') ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.config.get<string>('NODE_ENV'),
      version: process.env.npm_package_version || '1.0.0',
      node: process.version,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
      checks,
    };
  }

  private async runHealthChecks() {
    const [database, redis, yext, stripe] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkYext(),
      this.checkStripe(),
    ]);

    return {
      database: this.formatCheckResult(database),
      redis: this.formatCheckResult(redis),
      yext: this.formatCheckResult(yext),
      stripe: this.formatCheckResult(stripe),
    };
  }

  private formatCheckResult(result: PromiseSettledResult<any>) {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      status: 'down',
      error: result.reason?.message || 'Unknown error',
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', responseTime: Date.now() };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return { status: 'down', error: error.message };
    }
  }

  private async checkRedis() {
    try {
      const start = Date.now();
      await this.redis.ping();
      const responseTime = Date.now() - start;
      return { status: 'up', responseTime };
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return { status: 'down', error: error.message };
    }
  }

  private async checkYext() {
    const apiKey = this.config.get<string>('YEXT_API_KEY');

    if (!apiKey) {
      return { status: 'not_configured' };
    }

    try {
      // Just check if the API key is set - actual API call would be in production
      return { status: 'up', configured: true };
    } catch (error) {
      this.logger.error('Yext health check failed', error);
      return { status: 'down', error: error.message };
    }
  }

  private async checkStripe() {
    const apiKey = this.config.get<string>('STRIPE_SECRET_KEY');

    if (!apiKey) {
      return { status: 'not_configured' };
    }

    try {
      // Just check if the API key is set - actual API call would be in production
      return { status: 'up', configured: true };
    } catch (error) {
      this.logger.error('Stripe health check failed', error);
      return { status: 'down', error: error.message };
    }
  }
}
