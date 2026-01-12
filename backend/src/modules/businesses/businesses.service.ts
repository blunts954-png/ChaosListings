import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

/**
 * Businesses Service
 * Handles CRUD operations for business profiles
 */
@Injectable()
export class BusinessesService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService
  ) {}

  async findAll(agencyId: string, filters: { status?: string, search?: string }) {
    const where: any = { agencyId, deletedAt: null };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }
    
    return this.prisma.business.findMany({
      where,
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

  async create(data: any, agencyId: string, userId: string) {
    const business = await this.prisma.business.create({
      data: {
        ...data,
        agencyId,
        status: 'draft',
        onboardingStep: 'basic_info',
      },
    });

    await this.auditLogService.log({
      agencyId,
      userId,
      action: 'business.create',
      entityType: 'business',
      entityId: business.id,
      changes: business,
    });

    return business;
  }

  async update(id: string, data: any, agencyId: string, userId: string) {
    const business = await this.prisma.business.update({
      where: { id },
      data,
    });

    await this.auditLogService.log({
      agencyId,
      userId,
      action: 'business.update',
      entityType: 'business',
      entityId: business.id,
      changes: data,
    });

    return business;
  }

  async delete(id: string, agencyId: string, userId: string) {
    const business = await this.prisma.business.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.log({
      agencyId,
      userId,
      action: 'business.delete',
      entityType: 'business',
      entityId: business.id,
    });

    return business;
  }
}
