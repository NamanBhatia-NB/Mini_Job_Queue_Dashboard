import { IsIn, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { JobStatus, VALID_STATUSES } from '../entities/job.entity';

export class UpdateJobStatusDto {
  @IsNotEmpty({ message: 'Status is required' })
  @IsIn(VALID_STATUSES, {
    message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
  })
  status: JobStatus;

  @IsOptional()
  @IsInt()
  expectedVersion?: number;
}
