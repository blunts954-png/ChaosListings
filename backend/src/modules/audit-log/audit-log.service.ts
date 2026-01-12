import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';

interface LogOptions {
  userId?: string;
  agencyId?: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(options: LogOptions) {
    return this.prisma.auditLog.create({
      data: {
        userId: options.userId,
        agencyId: options.agencyId,
        entityType: options.entityType,
        entityId: options.entityId,
        action: options.action,
        changes: options.changes,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    });
  }
}
