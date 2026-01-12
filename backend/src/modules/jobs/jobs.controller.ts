import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agencies/:agencyId/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all jobs for an agency' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by job type' })
  @ApiQuery({ name: 'state', required: false, description: 'Filter by job state' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Filter by business ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results (default 100)' })
  @ApiResponse({
    status: 200,
    description: 'List of jobs',
  })
  findAll(
    @Param('agencyId') agencyId: string,
    @Query('type') type?: string,
    @Query('state') state?: string,
    @Query('businessId') businessId?: string,
    @Query('limit') limit?: string,
    @Request() req?,
  ) {
    return this.jobsService.findAll(agencyId, req.user.userId, {
      type,
      state,
      businessId,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get job statistics for an agency' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Job statistics',
  })
  getStats(@Param('agencyId') agencyId: string, @Request() req) {
    return this.jobsService.getStats(agencyId, req.user.userId);
  }

  @Get('queues/:queueName')
  @ApiOperation({ summary: 'Get queue information' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'queueName', enum: ['listings-sync', 'refresh-status'] })
  @ApiResponse({
    status: 200,
    description: 'Queue information',
  })
  getQueueInfo(
    @Param('queueName') queueName: string,
    @Param('agencyId') agencyId: string,
    @Request() req,
  ) {
    return this.jobsService.getQueueInfo(queueName, agencyId, req.user.userId);
  }

  @Post('queues/:queueName/pause')
  @ApiOperation({ summary: 'Pause a queue (owner only)' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'queueName', enum: ['listings-sync', 'refresh-status'] })
  @ApiResponse({
    status: 200,
    description: 'Queue paused',
  })
  pauseQueue(
    @Param('queueName') queueName: string,
    @Param('agencyId') agencyId: string,
    @Request() req,
  ) {
    return this.jobsService.pauseQueue(queueName, agencyId, req.user.userId);
  }

  @Post('queues/:queueName/resume')
  @ApiOperation({ summary: 'Resume a queue (owner only)' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'queueName', enum: ['listings-sync', 'refresh-status'] })
  @ApiResponse({
    status: 200,
    description: 'Queue resumed',
  })
  resumeQueue(
    @Param('queueName') queueName: string,
    @Param('agencyId') agencyId: string,
    @Request() req,
  ) {
    return this.jobsService.resumeQueue(queueName, agencyId, req.user.userId);
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Get job details' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'jobId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Job details',
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  findOne(
    @Param('jobId') jobId: string,
    @Param('agencyId') agencyId: string,
    @Request() req,
  ) {
    return this.jobsService.findOne(jobId, agencyId, req.user.userId);
  }

  @Post(':jobId/retry')
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'jobId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Job queued for retry',
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  retryJob(
    @Param('jobId') jobId: string,
    @Param('agencyId') agencyId: string,
    @Request() req,
  ) {
    return this.jobsService.retryJob(jobId, agencyId, req.user.userId);
  }

  @Post(':jobId/cancel')
  @ApiOperation({ summary: 'Cancel a pending or running job' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'jobId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Job canceled',
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  cancelJob(
    @Param('jobId') jobId: string,
    @Param('agencyId') agencyId: string,
    @Request() req,
  ) {
    return this.jobsService.cancelJob(jobId, agencyId, req.user.userId);
  }

  @Delete(':jobId')
  @ApiOperation({ summary: 'Delete a job' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'jobId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Job deleted',
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  deleteJob(
    @Param('jobId') jobId: string,
    @Param('agencyId') agencyId: string,
    @Request() req,
  ) {
    return this.jobsService.deleteJob(jobId, agencyId, req.user.userId);
  }

  @Delete('cleanup')
  @ApiOperation({ summary: 'Clean up old completed/failed jobs' })
  @ApiParam({ name: 'agencyId', type: 'string', format: 'uuid' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Delete jobs older than N days (default 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'Old jobs cleaned up',
  })
  cleanupOldJobs(
    @Param('agencyId') agencyId: string,
    @Query('days') days: string,
    @Request() req,
  ) {
    return this.jobsService.cleanupOldJobs(
      agencyId,
      req.user.userId,
      days ? parseInt(days) : 30,
    );
  }
}
