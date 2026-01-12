import { Module } from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { AgenciesController } from './agencies.controller';
import { PrismaModule } from '../../common/modules/prisma.module';
import { LoggerModule } from '../../common/modules/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [AgenciesController],
  providers: [AgenciesService],
  exports: [AgenciesService],
})
export class AgenciesModule {}
