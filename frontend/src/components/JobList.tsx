import React, { useState } from 'react';
import { Job, JobStatus } from '../types/job';
import {
  Play,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  Inbox,
  Loader2,
  Lock,
} from 'lucide-react';

interface JobListProps {
  jobs: Job[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: JobStatus, expectedVersion: number) => Promise<void>;
  onDeleteJob: (id: string) => Promise<void>;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  isLoading,
  onUpdateStatus,
  onDeleteJob,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleStatusChange = async (
    id: string,
    newStatus: JobStatus,
    version: number,
  ) => {
    setUpdatingId(id);
    try {
      await onUpdateStatus(id, newStatus, version);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete job "${title}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await onDeleteJob(id);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const renderStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="status-badge pending">
            <Clock size={12} />
            Pending
          </span>
        );
      case 'running':
        return (
          <span className="status-badge running">
            <span className="pulse-dot" />
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="status-badge completed">
            <CheckCircle size={12} />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="status-badge failed">
            <XCircle size={12} />
            Failed
          </span>
        );
    }
  };

  if (isLoading && jobs.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <Loader2 className="empty-icon animate-spin" style={{ color: 'var(--primary)' }} />
          <p style={{ fontWeight: 500 }}>Loading job queue...</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <Inbox className="empty-icon" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>
            No jobs found
          </h3>
          <p style={{ fontSize: '0.85rem' }}>
            No jobs match the selected filter or search criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="jobs-table">
        <thead>
          <tr>
            <th>Job Details</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created At</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const isProcessing = updatingId === job.id || deletingId === job.id;

            return (
              <tr key={job.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {job.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    ID: {job.id} • v{job.version}
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {job.type}
                  </span>
                </td>
                <td>{renderStatusBadge(job.status)}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                  {formatDate(job.createdAt)}
                </td>
                <td>
                  <div className="action-cell">
                    {/* Status transition buttons adhering to state machine */}
                    {job.status === 'pending' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusChange(job.id, 'running', job.version)}
                        disabled={isProcessing}
                        title="Start running job (pending -> running)"
                      >
                        {updatingId === job.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Play size={13} />
                        )}
                        <span>Start</span>
                      </button>
                    )}

                    {job.status === 'running' && (
                      <>
                        <button
                          className="btn btn-sm"
                          style={{
                            backgroundColor: '#16a34a',
                            color: '#ffffff',
                          }}
                          onClick={() => handleStatusChange(job.id, 'completed', job.version)}
                          disabled={isProcessing}
                          title="Complete job (running -> completed)"
                        >
                          {updatingId === job.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CheckCircle size={13} />
                          )}
                          <span>Complete</span>
                        </button>

                        <button
                          className="btn btn-sm"
                          style={{
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                          }}
                          onClick={() => handleStatusChange(job.id, 'failed', job.version)}
                          disabled={isProcessing}
                          title="Mark job failed (running -> failed)"
                        >
                          {updatingId === job.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <XCircle size={13} />
                          )}
                          <span>Fail</span>
                        </button>
                      </>
                    )}

                    {(job.status === 'completed' || job.status === 'failed') && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          background: 'var(--bg-subtle)',
                          borderRadius: 4,
                        }}
                        title="Terminal state reached. Transitions to running are forbidden."
                      >
                        <Lock size={12} />
                        Finished
                      </span>
                    )}

                    {/* Delete button */}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(job.id, job.title)}
                      disabled={isProcessing}
                      title="Delete job from database"
                    >
                      {deletingId === job.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
