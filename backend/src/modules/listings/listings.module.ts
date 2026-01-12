import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { OptimizationScoreService } from './services/optimization-score.service';
import { DirectoriesService } from './services/directories.service';
import { ManualDirectoriesService } from './services/manual-directories.service';
import { FreeListingsModule } from '../../integrations/free-listings/free-listings.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'sync-listings' },
      { name: 'refresh-status' },
    ),
    FreeListingsModule,
  ],
  controllers: [ListingsController],
  providers: [
    ListingsService,
    OptimizationScoreService,
    DirectoriesService,
    ManualDirectoriesService,
  ],
  exports: [ListingsService, OptimizationScoreService, ManualDirectoriesService],
})
export class ListingsModule {}
