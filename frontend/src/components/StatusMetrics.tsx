import React from 'react';
import { JobMetrics } from '../types/job';
import { Clock, PlayCircle, CheckCircle2, XCircle, ListFilter } from 'lucide-react';

interface StatusMetricsProps {
  metrics: JobMetrics;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const StatusMetrics: React.FC<StatusMetricsProps> = ({
  metrics,
  activeFilter,
  onSelectFilter,
}) => {
  const cards: Array<{
    id: string;
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    borderColor?: string;
  }> = [
    {
      id: 'all',
      label: 'Total Jobs',
      value: metrics.total,
      icon: <ListFilter size={18} color="#64748b" />,
      color: '#0f172a',
    },
    {
      id: 'pending',
      label: 'Pending',
      value: metrics.pending,
      icon: <Clock size={18} color="#b45309" />,
      color: '#b45309',
      borderColor: '#fde68a',
    },
    {
      id: 'running',
      label: 'Running',
      value: metrics.running,
      icon: <PlayCircle size={18} color="#1d4ed8" />,
      color: '#1d4ed8',
      borderColor: '#bfdbfe',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: metrics.completed,
      icon: <CheckCircle2 size={18} color="#15803d" />,
      color: '#15803d',
      borderColor: '#bbf7d0',
    },
    {
      id: 'failed',
      label: 'Failed',
      value: metrics.failed,
      icon: <XCircle size={18} color="#b91c1c" />,
      color: '#b91c1c',
      borderColor: '#fecaca',
    },
  ];

  return (
    <div className="metrics-grid">
      {cards.map((card) => {
        const isActive = activeFilter === card.id;
        return (
          <div
            key={card.id}
            className={`metric-card ${isActive ? 'active' : ''}`}
            onClick={() => onSelectFilter(card.id)}
            style={{
              borderColor: isActive ? 'var(--primary)' : undefined,
            }}
          >
            <div className="metric-header">
              <span className="metric-label">{card.label}</span>
              {card.icon}
            </div>
            <div className="metric-value" style={{ color: card.color }}>
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};
