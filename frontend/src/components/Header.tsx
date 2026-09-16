import React from 'react';
import { Layers, Plus, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenCreate: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreate,
  onRefresh,
  isLoading,
  autoRefresh,
  onToggleAutoRefresh,
}) => {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">
          <Layers size={22} />
        </div>
        <div>
          <h1 className="brand-title">Job Queue Manager</h1>
          <p className="brand-subtitle">
            Reliable state machine dashboard with atomic concurrency control
          </p>
        </div>
      </div>

      <div className="header-actions">
        <button
          className={`btn btn-secondary ${autoRefresh ? 'active' : ''}`}
          onClick={onToggleAutoRefresh}
          title={autoRefresh ? 'Auto-sync enabled (every 4s)' : 'Auto-sync disabled'}
          style={{
            fontSize: '0.8rem',
            padding: '6px 12px',
            backgroundColor: autoRefresh ? 'var(--primary-light)' : undefined,
            color: autoRefresh ? 'var(--primary)' : undefined,
            borderColor: autoRefresh ? 'var(--primary)' : undefined,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: autoRefresh ? '#22c55e' : '#94a3b8',
              display: 'inline-block',
            }}
          />
          {autoRefresh ? 'Live Sync ON' : 'Live Sync OFF'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh job list"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>

        <button className="btn btn-primary" onClick={onOpenCreate}>
          <Plus size={16} />
          <span>Create Job</span>
        </button>
      </div>
    </header>
  );
};
