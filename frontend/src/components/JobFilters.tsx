import React from 'react';
import { Search } from 'lucide-react';
import { JobMetrics } from '../types/job';

interface JobFiltersProps {
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  metrics: JobMetrics;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  activeFilter,
  onSelectFilter,
  searchQuery,
  onSearchChange,
  metrics,
}) => {
  const tabs = [
    { id: 'all', label: 'All Jobs', count: metrics.total },
    { id: 'pending', label: 'Pending', count: metrics.pending },
    { id: 'running', label: 'Running', count: metrics.running },
    { id: 'completed', label: 'Completed', count: metrics.completed },
    { id: 'failed', label: 'Failed', count: metrics.failed },
  ];

  return (
    <div className="controls-card">
      <div className="search-wrapper">
        <Search className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search by job title or type..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filter-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`filter-tab ${activeFilter === tab.id ? 'active' : ''}`}
            onClick={() => onSelectFilter(tab.id)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
    </div>
  );
};
