import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

/**
 * Businesses Service
 * Handles CRUD operations for business profiles
 */
@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async findAll(agencyId: string) {
    return this.prisma.business.findMany({
      where: { agencyId, deletedAt: null },
      include: {
        subscriptions: {
          where: { status: { in: ['active', 'trialing'] } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, agencyId: string) {
    return this.prisma.business.findFirst({
      where: { id, agencyId, deletedAt: null },
      include: {
        subscriptions: true,
        directoryStatuses: {
          include: { directory: true },
        },
      },
    });
  }

  async create(data: any, agencyId: string) {
    return this.prisma.business.create({
      data: {
        ...data,
        agencyId,
        status: 'draft',
        onboardingStep: 'basic_info',
      },
    });
  }

  async update(id: string, data: any, agencyId: string) {
    return this.prisma.business.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, agencyId: string) {
    return this.prisma.business.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
