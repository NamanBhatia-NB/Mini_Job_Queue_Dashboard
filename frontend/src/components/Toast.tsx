import React from 'react';
import { ToastMessage } from '../types/job';
import { CheckCircle2, AlertTriangle, Info, AlertOctagon, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 size={18} color="#16a34a" />;
            case 'conflict':
              return <AlertOctagon size={18} color="#dc2626" />;
            case 'error':
              return <AlertTriangle size={18} color="#dc2626" />;
            case 'info':
              return <Info size={18} color="#2563eb" />;
          }
        };

        return (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>{getIcon()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 2,
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
