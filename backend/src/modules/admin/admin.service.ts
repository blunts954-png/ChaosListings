import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [agencies, businesses, users] = await Promise.all([
      this.prisma.agency.count(),
      this.prisma.business.count(),
      this.prisma.user.count(),
    ]);

    return { agencies, businesses, users };
  }
}
