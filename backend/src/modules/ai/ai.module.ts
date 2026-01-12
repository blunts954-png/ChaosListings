import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PrismaModule } from '@/common/modules/prisma.module';
import { GeminiModule } from '@/common/modules/gemini.module';

@Module({
  imports: [PrismaModule, GeminiModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
