import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';

@Injectable()
export class DirectoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all active directories
   */
  async getAllDirectories() {
    return this.prisma.directory.findMany({
      where: { isActive: true },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Get directory by slug
   */
  async getDirectoryBySlug(slug: string) {
    return this.prisma.directory.findUnique({
      where: { slug },
    });
  }

  /**
   * Initialize directory statuses for a new business
   * Creates 'unavailable' status for all active directories
   */
  async initializeDirectoryStatuses(businessId: string) {
    const directories = await this.getAllDirectories();

    const statusRecords = directories.map((directory) => ({
      businessId,
      directoryId: directory.id,
      status: 'unavailable',
    }));

    // Bulk insert
    await this.prisma.businessDirectoryStatus.createMany({
      data: statusRecords,
      skipDuplicates: true,
    });

    return statusRecords.length;
  }

  /**
   * Get directory statuses for a business
   */
  async getBusinessDirectoryStatuses(businessId: string) {
    return this.prisma.businessDirectoryStatus.findMany({
      where: { businessId },
      include: {
        directory: true,
      },
      orderBy: {
        directory: {
          priority: 'desc',
        },
      },
    });
  }

  /**
   * Update directory status
   */
  async updateDirectoryStatus(
    businessId: string,
    directorySlug: string,
    status: string,
    data?: {
      externalListingId?: string;
      externalUrl?: string;
      errorMessage?: string;
    },
  ) {
    const directory = await this.getDirectoryBySlug(directorySlug);
    if (!directory) {
      throw new Error(`Directory not found: ${directorySlug}`);
    }

    return this.prisma.businessDirectoryStatus.update({
      where: {
        businessId_directoryId: {
          businessId,
          directoryId: directory.id,
        },
      },
      data: {
        status,
        lastSyncedAt: new Date(),
        externalListingId: data?.externalListingId,
        externalUrl: data?.externalUrl,
        errorMessage: data?.errorMessage,
        lastErrorAt: data?.errorMessage ? new Date() : undefined,
      },
    });
  }

  /**
   * Bulk update statuses (from Yext publisher status response)
   */
  async bulkUpdateDirectoryStatuses(
    businessId: string,
    updates: Array<{
      directorySlug: string;
      status: string;
      externalListingId?: string;
      externalUrl?: string;
      errorMessage?: string;
    }>,
  ) {
    const results = await Promise.allSettled(
      updates.map((update) =>
        this.updateDirectoryStatus(businessId, update.directorySlug, update.status, {
          externalListingId: update.externalListingId,
          externalUrl: update.externalUrl,
          errorMessage: update.errorMessage,
        }),
      ),
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return { successful, failed, total: updates.length };
  }
}
