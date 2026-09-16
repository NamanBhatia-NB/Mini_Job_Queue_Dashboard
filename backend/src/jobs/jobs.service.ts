import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import {
  JobEntity,
  JobStatus,
  VALID_STATUSES,
  VALID_TRANSITIONS,
} from './entities/job.entity';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createJobDto: CreateJobDto): Promise<JobEntity> {
    const job = await this.prisma.job.create({
      data: {
        title: createJobDto.title.trim(),
        type: createJobDto.type.trim(),
        status: 'pending',
        version: 1,
      },
    });

    this.logger.log(`Created job "${job.id}" (${job.title}) with status pending`);
    return job as JobEntity;
  }

  async findAll(status?: string): Promise<JobEntity[]> {
    const whereClause =
      status && VALID_STATUSES.includes(status as JobStatus)
        ? { status }
        : {};

    const jobs = await this.prisma.job.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return jobs as JobEntity[];
  }

  async findOne(id: string): Promise<JobEntity> {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job with ID "${id}" was not found`);
    }
    return job as JobEntity;
  }

  async getMetrics(): Promise<{
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  }> {
    const [total, pending, running, completed, failed] = await Promise.all([
      this.prisma.job.count(),
      this.prisma.job.count({ where: { status: 'pending' } }),
      this.prisma.job.count({ where: { status: 'running' } }),
      this.prisma.job.count({ where: { status: 'completed' } }),
      this.prisma.job.count({ where: { status: 'failed' } }),
    ]);

    return { total, pending, running, completed, failed };
  }

  /**
   * Concurrency-safe status update using atomic conditional update & state machine validation.
   *
   * Transitions:
   * pending  -> running
   * running  -> completed | failed
   * completed / failed -> terminal (no transitions allowed)
   */
  async updateStatus(
    id: string,
    updateJobStatusDto: UpdateJobStatusDto,
  ): Promise<JobEntity> {
    const targetStatus = updateJobStatusDto.status;

    // 1. Fetch current job record
    const existingJob = await this.prisma.job.findUnique({ where: { id } });
    if (!existingJob) {
      throw new NotFoundException(`Job with ID "${id}" not found`);
    }

    const currentStatus = existingJob.status as JobStatus;

    // If already in target status, return as is (idempotent request)
    if (currentStatus === targetStatus) {
      return existingJob as JobEntity;
    }

    // 2. Validate state machine rules
    if (currentStatus === 'completed' || currentStatus === 'failed') {
      throw new BadRequestException(
        `Cannot transition job from terminal state "${currentStatus}" to "${targetStatus}".`,
      );
    }

    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus];
    if (!allowedNextStatuses.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid status transition: "${currentStatus}" cannot transition to "${targetStatus}". Allowed next transitions: [${allowedNextStatuses.join(
          ', ',
        )}].`,
      );
    }

    // 3. ATOMIC CONDITIONAL UPDATE (Optimistic Concurrency Control)
    // Ensures that if another request modified the status between the read and now,
    // this update will affect 0 rows, preventing dirty/inconsistent writes.
    const updateResult = await this.prisma.job.updateMany({
      where: {
        id,
        status: currentStatus, // Strict atomic lock on expected state
        ...(updateJobStatusDto.expectedVersion !== undefined
          ? { version: updateJobStatusDto.expectedVersion }
          : {}),
      },
      data: {
        status: targetStatus,
        version: { increment: 1 },
      },
    });

    // 4. Handle Concurrency Conflict
    if (updateResult.count === 0) {
      // Race condition detected! Another request won the race.
      const freshJob = await this.prisma.job.findUnique({ where: { id } });
      this.logger.warn(
        `Concurrency conflict on job "${id}": expected "${currentStatus}", found "${freshJob?.status}"`,
      );

      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: `Concurrency Conflict: Job "${id}" status was modified concurrently by another process. Current status is now "${freshJob?.status}".`,
        currentJob: freshJob,
      });
    }

    // Fetch and return the freshly updated entity
    const updatedJob = await this.prisma.job.findUnique({ where: { id } });
    this.logger.log(
      `Job "${id}" successfully transitioned from "${currentStatus}" to "${targetStatus}" (version ${updatedJob?.version})`,
    );

    return updatedJob as JobEntity;
  }

  async remove(id: string): Promise<{ success: boolean; message: string; id: string }> {
    const existing = await this.prisma.job.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Job with ID "${id}" not found`);
    }

    await this.prisma.job.delete({ where: { id } });
    this.logger.log(`Deleted job "${id}"`);

    return {
      success: true,
      message: `Job "${existing.title}" deleted successfully`,
      id,
    };
  }
}
