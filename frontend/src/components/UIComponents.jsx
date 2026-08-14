import React from 'react';
import { Search, Filter, Download, Plus, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Layers } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SKELETON LOADERS
// ═══════════════════════════════════════════════════════════════════════════════
export const SkeletonCard = ({ count = 1 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', width: '100%' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass-card skeleton-pulse" style={{ height: '110px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width: '40%', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', marginBottom: '1rem' }} />
        <div style={{ width: '60%', height: '24px', borderRadius: '4px', background: 'rgba(255,255,255,0.12)', marginBottom: '0.5rem' }} />
        <div style={{ width: '30%', height: '10px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }} />
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 5 }) => (
  <div className="glass-card" style={{ width: '100%', overflow: 'hidden', padding: '1rem' }}>
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
      <div className="skeleton-pulse" style={{ flex: 1, height: '38px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)' }} />
      <div className="skeleton-pulse" style={{ width: '120px', height: '38px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)' }} />
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} style={{ display: 'flex', gap: '1rem', padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="skeleton-pulse" style={{ flex: c === 0 ? 2 : 1, height: '16px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 2. EMPTY STATE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export const EmptyState = ({
  icon: Icon = Layers,
  title = "No Data Found",
  description = "There are no entries recorded yet. Create a new record to populate this space.",
  actionLabel,
  onAction
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3.5rem 2rem',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.01)',
    border: '1px stroke rgba(255,255,255,0.05)',
    borderRadius: '12px',
    margin: '1rem 0'
  }}>
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: 'var(--gold-bg)',
      color: 'var(--gold-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1rem',
      boxShadow: '0 0 16px var(--gold-glow)'
    }}>
      <Icon size={26} />
    </div>
    <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.35rem' }}>
      {title}
    </h4>
    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5, marginBottom: actionLabel ? '1.25rem' : '0' }}>
      {description}
    </p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="gold-btn" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}>
        <Plus size={15} /> {actionLabel}
      </button>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ERROR STATE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export const ErrorState = ({
  title = "Synchronization Notice",
  message = "Failed to load data from server. Please verify your connection.",
  onRetry
}) => (
  <div style={{
    background: 'rgba(231,76,60,0.06)',
    border: '1px solid rgba(231,76,60,0.25)',
    borderRadius: '10px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    margin: '1rem 0'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
      <AlertCircle size={22} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
      <div>
        <h5 style={{ fontSize: '0.9rem', color: 'var(--accent-red)', fontWeight: '600', margin: 0 }}>{title}</h5>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>{message}</p>
      </div>
    </div>
    {onRetry && (
      <button onClick={onRetry} className="outline-btn" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderColor: 'rgba(231,76,60,0.3)', color: 'var(--accent-red)' }}>
        <RefreshCw size={13} /> Retry
      </button>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SAAS DATA GRID CONTROLLER (Search, Filter & Actions Bar)
// ═══════════════════════════════════════════════════════════════════════════════
export const DataGridHeader = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search records...",
  filterValue,
  onFilterChange,
  filterOptions = [],
  actionButtonLabel,
  onActionButtonClick,
  actionButtonIcon: ActionIcon = Plus
}) => (
  <div style={{
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap'
  }}>
    {/* Search Input */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="form-control"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ paddingLeft: '2.4rem', height: '38px', fontSize: '0.82rem' }}
        />
      </div>

      {/* Filter Select */}
      {filterOptions.length > 0 && (
        <select
          className="form-control"
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
          style={{ width: 'auto', height: '38px', fontSize: '0.82rem', padding: '0 0.85rem' }}
        >
          {filterOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>

    {/* Primary Action Button */}
    {actionButtonLabel && onActionButtonClick && (
      <button onClick={onActionButtonClick} className="gold-btn" style={{ height: '38px', fontSize: '0.8rem', padding: '0 1rem' }}>
        <ActionIcon size={15} /> {actionButtonLabel}
      </button>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SAAS DATA GRID PAGINATION CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
export const DataGridPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize
}) => {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      padding: '0.85rem 1rem',
      borderTop: '1px solid var(--border-light)',
      fontSize: '0.78rem',
      color: 'var(--text-secondary)'
    }}>
      <div>
        Showing <strong style={{ color: 'var(--text-primary)' }}>{startIdx}-{endIdx}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong> entries
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="icon-btn"
          style={{ opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ padding: '0 0.5rem', fontWeight: '600', color: 'var(--gold-primary)' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="icon-btn"
          style={{ opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
