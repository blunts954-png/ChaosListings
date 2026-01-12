import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GoogleBusinessService } from './google-business.service';
import { YelpBusinessService } from './yelp-business.service';
import { FreeListingsService } from './free-listings.service';

@Module({
  imports: [HttpModule],
  providers: [GoogleBusinessService, YelpBusinessService, FreeListingsService],
  exports: [GoogleBusinessService, YelpBusinessService, FreeListingsService],
})
export class FreeListingsModule {}
