import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job as BullJob } from 'bullmq';
import { PrismaService } from '../../common/modules/prisma.service';
import { CustomLogger } from '../../common/modules/logger.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('listings-sync') private listingsSyncQueue: Queue,
    @InjectQueue('refresh-status') private refreshStatusQueue: Queue,
    private prisma: PrismaService,
    private logger: CustomLogger,
  ) {
    this.logger.setContext('JobsService');
  }

  // =====================================================
  // JOB QUERIES
  // =====================================================

  async findAll(agencyId: string, userId: string, filters?: {
    type?: string;
    state?: string;
    businessId?: string;
    limit?: number;
  }) {
    this.logger.log(`Finding jobs for agency: ${agencyId}`);

    await this.verifyAgencyAccess(agencyId, userId);

    const where: any = { agencyId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.state) {
      where.state = filters.state;
    }

    if (filters?.businessId) {
      where.businessId = filters.businessId;
    }

    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    });

    return jobs;
  }

  async findOne(jobId: string, agencyId: string, userId: string) {
    this.logger.log(`Finding job: ${jobId}`);

    await this.verifyAgencyAccess(agencyId, userId);

    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        agencyId,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async getStats(agencyId: string, userId: string) {
    this.logger.log(`Getting job stats for agency: ${agencyId}`);

    await this.verifyAgencyAccess(agencyId, userId);

    const [totalJobs, pendingJobs, runningJobs, completedJobs, failedJobs] =
      await Promise.all([
        this.prisma.job.count({ where: { agencyId } }),
        this.prisma.job.count({ where: { agencyId, state: 'pending' } }),
        this.prisma.job.count({ where: { agencyId, state: 'running' } }),
        this.prisma.job.count({ where: { agencyId, state: 'completed' } }),
        this.prisma.job.count({ where: { agencyId, state: 'failed' } }),
      ]);

    // Get queue stats
    const listingsSyncStats = await this.getQueueStats(this.listingsSyncQueue);
    const refreshStatusStats = await this.getQueueStats(this.refreshStatusQueue);

    return {
      database: {
        total: totalJobs,
        pending: pendingJobs,
        running: runningJobs,
        completed: completedJobs,
        failed: failedJobs,
      },
      queues: {
        listingsSync: listingsSyncStats,
        refreshStatus: refreshStatusStats,
      },
    };
  }

  // =====================================================
  // JOB MANAGEMENT
  // =====================================================

  async retryJob(jobId: string, agencyId: string, userId: string) {
    this.logger.log(`Retrying job: ${jobId}`);

    await this.verifyAgencyAccess(agencyId, userId);

    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        agencyId,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.state !== 'failed') {
      throw new Error('Only failed jobs can be retried');
    }

    // Update job state to pending
    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        state: 'pending',
        error: null,
        attempts: { increment: 1 },
      },
    });

    // Re-queue the job based on type
    if (job.type === 'activate-listings') {
      await this.listingsSyncQueue.add(
        'activate-listings',
        {
          businessId: job.businessId,
          agencyId: job.agencyId,
          jobId: job.id,
        },
        {
          jobId: `retry-${job.id}-${Date.now()}`,
        },
      );
    } else if (job.type === 'sync-listings') {
      await this.listingsSyncQueue.add(
        'sync-listings',
        {
          businessId: job.businessId,
          agencyId: job.agencyId,
          jobId: job.id,
        },
        {
          jobId: `retry-${job.id}-${Date.now()}`,
        },
      );
    } else if (job.type === 'refresh-status') {
      await this.refreshStatusQueue.add(
        'refresh-status',
        {
          businessId: job.businessId,
          agencyId: job.agencyId,
          jobId: job.id,
        },
        {
          jobId: `retry-${job.id}-${Date.now()}`,
        },
      );
    }

    this.logger.log(`Job ${jobId} queued for retry`);
    return updated;
  }

  async cancelJob(jobId: string, agencyId: string, userId: string) {
    this.logger.log(`Canceling job: ${jobId}`);

    await this.verifyAgencyAccess(agencyId, userId);

    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        agencyId,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.state === 'completed' || job.state === 'failed') {
      throw new Error('Cannot cancel completed or failed jobs');
    }

    // Try to remove from queue if it's still there
    if (job.bullJobId) {
      const queue =
        job.type === 'refresh-status'
          ? this.refreshStatusQueue
          : this.listingsSyncQueue;

      try {
        const bullJob = await queue.getJob(job.bullJobId);
        if (bullJob) {
          await bullJob.remove();
        }
      } catch (error) {
        this.logger.warn(`Could not remove job from queue: ${error.message}`);
      }
    }

    // Update database record
    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        state: 'failed',
        error: 'Canceled by user',
        completedAt: new Date(),
      },
    });

    this.logger.log(`Job ${jobId} canceled`);
    return updated;
  }

  async deleteJob(jobId: string, agencyId: string, userId: string) {
    this.logger.log(`Deleting job: ${jobId}`);

    await this.verifyAgencyAccess(agencyId, userId);

    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        agencyId,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.state === 'running') {
      throw new Error('Cannot delete running jobs. Cancel first.');
    }

    await this.prisma.job.delete({
      where: { id: jobId },
    });

    this.logger.log(`Job ${jobId} deleted`);
    return { message: 'Job deleted successfully' };
  }

  async cleanupOldJobs(agencyId: string, userId: string, daysOld: number = 30) {
    this.logger.log(`Cleaning up jobs older than ${daysOld} days for agency: ${agencyId}`);

    await this.verifyAgencyAccess(agencyId, userId);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.job.deleteMany({
      where: {
        agencyId,
        state: { in: ['completed', 'failed'] },
        createdAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old jobs`);
    return {
      deleted: result.count,
      message: `Deleted ${result.count} jobs older than ${daysOld} days`,
    };
  }

  // =====================================================
  // QUEUE MONITORING
  // =====================================================

  async getQueueInfo(queueName: string, agencyId: string, userId: string) {
    this.logger.log(`Getting queue info for: ${queueName}`);

    await this.verifyAgencyAccess(agencyId, userId);

    const queue =
      queueName === 'listings-sync'
        ? this.listingsSyncQueue
        : queueName === 'refresh-status'
          ? this.refreshStatusQueue
          : null;

    if (!queue) {
      throw new NotFoundException('Queue not found');
    }

    const stats = await this.getQueueStats(queue);

    // Get recent jobs from the queue
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaiting(0, 10),
      queue.getActive(0, 10),
      queue.getCompleted(0, 10),
      queue.getFailed(0, 10),
    ]);

    return {
      name: queueName,
      stats,
      jobs: {
        waiting: waiting.map(this.formatBullJob),
        active: active.map(this.formatBullJob),
        completed: completed.map(this.formatBullJob),
        failed: failed.map(this.formatBullJob),
      },
    };
  }

  async pauseQueue(queueName: string, agencyId: string, userId: string) {
    this.logger.log(`Pausing queue: ${queueName}`);

    // Only allow agency owners to pause queues
    await this.verifyOwnerAccess(agencyId, userId);

    const queue =
      queueName === 'listings-sync'
        ? this.listingsSyncQueue
        : queueName === 'refresh-status'
          ? this.refreshStatusQueue
          : null;

    if (!queue) {
      throw new NotFoundException('Queue not found');
    }

    await queue.pause();

    this.logger.log(`Queue ${queueName} paused`);
    return { message: `Queue ${queueName} paused` };
  }

  async resumeQueue(queueName: string, agencyId: string, userId: string) {
    this.logger.log(`Resuming queue: ${queueName}`);

    // Only allow agency owners to resume queues
    await this.verifyOwnerAccess(agencyId, userId);

    const queue =
      queueName === 'listings-sync'
        ? this.listingsSyncQueue
        : queueName === 'refresh-status'
          ? this.refreshStatusQueue
          : null;

    if (!queue) {
      throw new NotFoundException('Queue not found');
    }

    await queue.resume();

    this.logger.log(`Queue ${queueName} resumed`);
    return { message: `Queue ${queueName} resumed` };
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private async getQueueStats(queue: Queue) {
    const [waiting, active, completed, failed, delayed, paused] =
      await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.isPaused(),
      ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    };
  }

  private formatBullJob(job: BullJob) {
    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    };
  }

  private async verifyAgencyAccess(
    agencyId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.prisma.agencyMembership.findFirst({
      where: {
        agencyId,
        userId,
        status: 'active',
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this agency');
    }
  }

  private async verifyOwnerAccess(
    agencyId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.prisma.agencyMembership.findFirst({
      where: {
        agencyId,
        userId,
        status: 'active',
        role: 'owner',
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only agency owners can perform this action');
    }
  }
}
