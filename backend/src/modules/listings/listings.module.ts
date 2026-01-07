import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { OptimizationScoreService } from './services/optimization-score.service';
import { DirectoriesService } from './services/directories.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'sync-listings' },
      { name: 'refresh-status' },
    ),
  ],
  controllers: [ListingsController],
  providers: [
    ListingsService,
    OptimizationScoreService,
    DirectoriesService,
  ],
  exports: [ListingsService, OptimizationScoreService],
})
export class ListingsModule {}
