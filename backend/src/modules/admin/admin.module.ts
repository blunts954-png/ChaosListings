import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminListingsController } from './admin-listings.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../common/modules/prisma.module';
import { LoggerModule } from '../../common/modules/logger.module';

@Module({
  imports: [AuthModule, PrismaModule, LoggerModule],
  controllers: [AdminController, AdminListingsController],
  providers: [AdminService],
})
export class AdminModule {}
