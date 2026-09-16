export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export const VALID_STATUSES: JobStatus[] = ['pending', 'running', 'completed', 'failed'];

/**
 * State Transition Matrix:
 * pending  -> [running]
 * running  -> [completed, failed]
 * completed -> [] (terminal state)
 * failed    -> [] (terminal state)
 */
export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  pending: ['running'],
  running: ['completed', 'failed'],
  completed: [],
  failed: [],
};

export class JobEntity {
  id: string;
  title: string;
  type: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
