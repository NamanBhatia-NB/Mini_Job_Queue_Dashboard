import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from './services/api';
import { Job, JobMetrics, JobStatus, CreateJobInput, ToastMessage } from './types/job';
import { Header } from './components/Header';
import { StatusMetrics } from './components/StatusMetrics';
import { JobFilters } from './components/JobFilters';
import { JobList } from './components/JobList';
import { CreateJobModal } from './components/CreateJobModal';
import { Toast } from './components/Toast';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [metrics, setMetrics] = useState<JobMetrics>({
    total: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  });
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [concurrencyConflict, setConcurrencyConflict] = useState<string | null>(null);

  const addToast = (
    type: 'success' | 'error' | 'conflict' | 'info',
    title: string,
    message: string,
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch jobs and metrics
  const loadData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    try {
      const [fetchedJobs, fetchedMetrics] = await Promise.all([
        api.getJobs(),
        api.getMetrics(),
      ]);
      setJobs(fetchedJobs);
      setMetrics(fetchedMetrics);
    } catch (err: any) {
      console.error('Failed to fetch jobs:', err);
      addToast(
        'error',
        'API Error',
        err.response?.data?.message || err.message || 'Failed to connect to backend API',
      );
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Live Auto-Refresh (every 4 seconds to sync state between multiple tabs)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  // Create Job Handler
  const handleCreateJob = async (input: CreateJobInput) => {
    const newJob = await api.createJob(input);
    addToast('success', 'Job Created', `Job "${newJob.title}" added to queue as Pending.`);
    await loadData(false);
  };

  // Status Change Handler with Concurrency Protection
  const handleUpdateStatus = async (
    id: string,
    targetStatus: JobStatus,
    expectedVersion: number,
  ) => {
    try {
      const updated = await api.updateJobStatus(id, {
        status: targetStatus,
        expectedVersion,
      });

      addToast(
        'success',
        'Status Updated',
        `Job "${updated.title}" transitioned to ${targetStatus.toUpperCase()}.`,
      );
      setConcurrencyConflict(null);
      await loadData(false);
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Concurrency Conflict Detected!
        const conflictMessage =
          err.response?.data?.message ||
          'Another tab or process already modified this job.';

        setConcurrencyConflict(conflictMessage);
        addToast(
          'conflict',
          'Concurrency Conflict (409)',
          conflictMessage,
        );

        // Immediately resync data to reflect reality
        await loadData(false);
      } else {
        const errorMsg =
          err.response?.data?.message || err.message || 'Failed to update job status.';
        addToast('error', 'Update Failed', errorMsg);
      }
    }
  };

  // Delete Job Handler
  const handleDeleteJob = async (id: string) => {
    try {
      await api.deleteJob(id);
      addToast('info', 'Job Deleted', 'Job was permanently removed from the queue.');
      await loadData(false);
    } catch (err: any) {
      addToast(
        'error',
        'Delete Failed',
        err.response?.data?.message || err.message || 'Failed to delete job.',
      );
    }
  };

  // Filtered & Searched Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesFilter = activeFilter === 'all' || job.status === activeFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [jobs, activeFilter, searchQuery]);

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        onOpenCreate={() => setIsModalOpen(true)}
        onRefresh={() => loadData(true)}
        isLoading={isLoading}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
      />

      {/* Concurrency Conflict Banner */}
      {concurrencyConflict && (
        <div className="alert-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertOctagon size={20} color="#b45309" />
            <div>
              <strong>Concurrency Conflict Detected:</strong> {concurrencyConflict}
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setConcurrencyConflict(null);
              loadData(true);
            }}
          >
            <RefreshCw size={12} />
            <span>Dismiss & Resync</span>
          </button>
        </div>
      )}

      {/* Status Counters */}
      <StatusMetrics
        metrics={metrics}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
      />

      {/* Filter and Search Controls */}
      <JobFilters
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        metrics={metrics}
      />

      {/* Jobs Table */}
      <JobList
        jobs={filteredJobs}
        isLoading={isLoading}
        onUpdateStatus={handleUpdateStatus}
        onDeleteJob={handleDeleteJob}
      />

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateJob}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default App;
