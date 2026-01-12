import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from '../../common/modules/prisma.module';
import { LoggerModule } from '../../common/modules/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [HealthController],
})
export class HealthModule {}
