import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { PrismaModule } from '../../common/modules/prisma.module';
import { LoggerModule } from '../../common/modules/logger.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    BullModule.registerQueue(
      {
        name: 'listings-sync',
      },
      {
        name: 'refresh-status',
      },
    ),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
