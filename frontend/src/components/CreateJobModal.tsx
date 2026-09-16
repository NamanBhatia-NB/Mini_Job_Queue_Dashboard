import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { CreateJobInput } from '../types/job';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateJobInput) => Promise<void>;
}

const TYPE_SUGGESTIONS = [
  'data-sync',
  'report-export',
  'email-notification',
  'ai-inference',
  'backup-archive',
];

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('data-sync');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Job title is required');
      return;
    }
    if (!type.trim()) {
      setError('Job type is required');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), type: type.trim() });
      setTitle('');
      setType('data-sync');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Job</h2>
          <button
            className="btn btn-secondary btn-sm"
            style={{ padding: 4, borderRadius: 4 }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              borderRadius: 6,
              fontSize: '0.825rem',
              marginBottom: 16,
              border: '1px solid #fecaca',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="job-title">
              Job Title
            </label>
            <input
              id="job-title"
              type="text"
              className="form-input"
              placeholder="e.g. Daily user metrics aggregation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="job-type">
              Job Type
            </label>
            <input
              id="job-type"
              type="text"
              className="form-input"
              placeholder="e.g. data-sync"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="type-pills">
              {TYPE_SUGGESTIONS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  className="pill-tag"
                  onClick={() => setType(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Job</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
