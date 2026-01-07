import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { YextClient } from './yext.client';

@Module({
  imports: [HttpModule],
  providers: [YextClient],
  exports: [YextClient],
})
export class YextModule {}
