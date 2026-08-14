import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ToastContainer = () => {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />;
      case 'error':
        return <AlertCircle size={18} style={{ color: 'var(--color-error)', flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />;
      case 'info':
      default:
        return <Info size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success': return 'var(--color-primary)';
      case 'error': return 'var(--color-error)';
      case 'warning': return 'var(--color-warning)';
      case 'info':
      default: return 'var(--color-accent)';
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type || 'info'}`}
          style={{
            borderLeft: `4px solid ${getBorderColor(toast.type)}`
          }}
        >
          {getIcon(toast.type)}
          <div className="toast-content">
            <p className="toast-message">{toast.message}</p>
          </div>
          <button
            className="toast-close-btn"
            onClick={() => removeToast(toast.id)}
            title="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
