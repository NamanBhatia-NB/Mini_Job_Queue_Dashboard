export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  title: string;
  type: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface JobMetrics {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export interface CreateJobInput {
  title: string;
  type: string;
}

export interface UpdateJobStatusInput {
  status: JobStatus;
  expectedVersion?: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'conflict' | 'info';
  title: string;
  message: string;
}
