import axios from 'axios';
import { Job, JobMetrics, CreateJobInput, UpdateJobStatusInput } from '../types/job';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:4000');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const api = {
  async getJobs(status?: string): Promise<Job[]> {
    const params = status && status !== 'all' ? { status } : {};
    const res = await apiClient.get<Job[]>('/jobs', { params });
    return res.data;
  },

  async getMetrics(): Promise<JobMetrics> {
    const res = await apiClient.get<JobMetrics>('/jobs/metrics');
    return res.data;
  },

  async createJob(data: CreateJobInput): Promise<Job> {
    const res = await apiClient.post<Job>('/jobs', data);
    return res.data;
  },

  async updateJobStatus(id: string, data: UpdateJobStatusInput): Promise<Job> {
    const res = await apiClient.patch<Job>(`/jobs/${id}/status`, data);
    return res.data;
  },

  async deleteJob(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/jobs/${id}`);
    return res.data;
  },
};
