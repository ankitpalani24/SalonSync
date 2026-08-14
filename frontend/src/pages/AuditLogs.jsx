import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Search, Filter, Lock, Eye, Calendar, Clock, 
  UserCheck, DollarSign, Tag, ShieldAlert, ArrowRight, X, FileText, CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const AuditLogs = () => {
  const { currentUser, db, tenantFilter } = useApp();

  // Access Control Safeguard: Restricted to Owner/Admin roles
  const isOwnerOrAdmin = currentUser && ['SALON_OWNER', 'FRANCHISE_OWNER', 'SUPER_ADMIN'].includes(currentUser.role);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');

  // Selected Log for Diff Modal
  const [inspectLog, setInspectLog] = useState(null);

  const rawLogs = db.auditLogs || [];

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    let list = tenantFilter(rawLogs);

    if (selectedEntity !== 'ALL') {
      list = list.filter(l => (l.entity || '').toLowerCase() === selectedEntity.toLowerCase());
    }

    if (selectedAction !== 'ALL') {
      list = list.filter(l => (l.action || '').toLowerCase() === selectedAction.toLowerCase());
    }

    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(l => 
        (l.userName || '').toLowerCase().includes(q) ||
        (l.entityName || '').toLowerCase().includes(q) ||
        (l.entityId || '').toLowerCase().includes(q) ||
        (l.userRole || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [rawLogs, selectedEntity, selectedAction, searchTerm, tenantFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const priceChanges = filteredLogs.filter(l => l.action === 'PRICE_CHANGE').length;
    const permChanges = filteredLogs.filter(l => l.action === 'PERMISSION_CHANGE').length;
    const deletes = filteredLogs.filter(l => l.action === 'DELETE').length;

    return { total, priceChanges, permChanges, deletes };
  }, [filteredLogs]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'PRICE_CHANGE':
        return <span style={{ padding: '0.15rem 0.55rem', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 'bold', background: 'rgba(212, 175, 55, 0.2)', color: 'var(--gold-primary)', border: '1px solid var(--gold-border)' }}>🏷️ PRICE CHANGE</span>;
      case 'PERMISSION_CHANGE':
        return <span style={{ padding: '0.15rem 0.55rem', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 'bold', background: 'rgba(155, 89, 182, 0.2)', color: '#9b59b6', border: '1px solid rgba(155, 89, 182, 0.4)' }}>🔐 PERMISSION</span>;
      case 'CREATE':
        return <span style={{ padding: '0.15rem 0.55rem', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 'bold', background: 'rgba(46, 204, 113, 0.15)', color: 'var(--accent-green)', border: '1px solid rgba(46, 204, 113, 0.3)' }}>✨ CREATE</span>;
      case 'UPDATE':
        return <span style={{ padding: '0.15rem 0.55rem', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 'bold', background: 'rgba(54, 162, 235, 0.15)', color: '#3498db', border: '1px solid rgba(54, 162, 235, 0.3)' }}>✏️ UPDATE</span>;
      case 'DELETE':
        return <span style={{ padding: '0.15rem 0.55rem', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 'bold', background: 'rgba(231, 76, 60, 0.15)', color: 'var(--accent-red)', border: '1px solid rgba(231, 76, 60, 0.3)' }}>🗑️ DELETE</span>;
      default:
        return <span style={{ padding: '0.15rem 0.55rem', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>{action}</span>;
    }
  };

  if (!isOwnerOrAdmin) {
    return (
      <div className="page-container animated-fade-in">
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '600px', margin: '3rem auto' }}>
          <Lock size={48} style={{ color: 'var(--accent-red)', margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Access Restricted</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The Audit Logging System is restricted exclusively to <strong>Salon Owners and Franchise Administrators</strong> to protect business security and immutability.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animated-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Security & Business Audit Logs</h1>
            <span style={{ 
              background: 'rgba(231, 76, 60, 0.15)', 
              color: 'var(--accent-red)', 
              border: '1px solid rgba(231, 76, 60, 0.3)', 
              fontSize: '0.65rem', 
              fontWeight: '700', 
              padding: '0.2rem 0.55rem', 
              borderRadius: '12px' 
            }}>
              READ-ONLY IMMUTABLE LEDGER
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Track important business operations, service price edits, inventory adjustments, and user permission changes.
          </p>
        </div>
      </div>

      {/* ── Metric Overview Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Logged Events</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.2rem' }}>{stats.total}</h3>
        </div>
        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Price Modification Events</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--gold-primary)', marginTop: '0.2rem' }}>{stats.priceChanges}</h3>
        </div>
        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Permission Changes</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#9b59b6', marginTop: '0.2rem' }}>{stats.permChanges}</h3>
        </div>
        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Deletions & Removals</span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-red)', marginTop: '0.2rem' }}>{stats.deletes}</h3>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by user name, entity ID, or entity..." 
            className="form-control" 
            style={{ paddingLeft: '2.4rem', fontSize: '0.85rem' }} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        {/* Entity Filter */}
        <div style={{ width: '180px' }}>
          <select 
            value={selectedEntity} 
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="form-control"
            style={{ fontSize: '0.82rem', background: 'var(--bg-card)' }}
          >
            <option value="ALL">All Entities</option>
            <option value="Customer">Customer</option>
            <option value="Appointment">Appointment</option>
            <option value="Invoice">Invoice</option>
            <option value="Expense">Expense</option>
            <option value="Product">Product Inventory</option>
            <option value="Service">Service</option>
            <option value="Staff">Staff</option>
            <option value="User">User Account</option>
          </select>
        </div>

        {/* Action Filter */}
        <div style={{ width: '180px' }}>
          <select 
            value={selectedAction} 
            onChange={(e) => setSelectedAction(e.target.value)}
            className="form-control"
            style={{ fontSize: '0.82rem', background: 'var(--bg-card)' }}
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="PRICE_CHANGE">PRICE_CHANGE</option>
            <option value="PERMISSION_CHANGE">PERMISSION_CHANGE</option>
          </select>
        </div>

      </div>

      {/* ── Audit Logs Ledger Table ── */}
      <div className="glass-card">
        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User & Role</th>
                <th>Action</th>
                <th>Entity & Identifier</th>
                <th>Branch</th>
                <th>Change Overview</th>
                <th>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>No audit events found matching your criteria.</td></tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp || log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.82rem', display: 'block' }}>{log.userName}</strong>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{log.userRole}</span>
                    </td>
                    <td>{getActionBadge(log.action)}</td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{log.entity}</strong>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--gold-primary)' }}>{log.entityName || `#${log.entityId}`}</span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{log.branchName || 'Bandra Flagship'}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                      {log.action === 'PRICE_CHANGE' ? (
                        <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                          ₹{log.previousValue?.price || 0} ➔ ₹{log.newValue?.price || 0}
                        </span>
                      ) : log.action === 'PERMISSION_CHANGE' ? (
                        <span>Role: {log.newValue?.role || 'Updated'}</span>
                      ) : (
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>
                          {log.newValue ? JSON.stringify(log.newValue).substring(0, 45) + '...' : 'Modified'}
                        </span>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => setInspectLog(log)} 
                        className="outline-btn" 
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Eye size={13} /> Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SIDE-BY-SIDE DIFF INSPECTION MODAL ── */}
      {inspectLog && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setInspectLog(null); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Audit Event Inspection</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Log ID: {inspectLog._id}</span>
              </div>
              <button onClick={() => setInspectLog(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            {/* Audit Metadata Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.78rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>User</span>
                <strong style={{ color: '#fff' }}>{inspectLog.userName} ({inspectLog.userRole})</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Entity</span>
                <strong style={{ color: 'var(--gold-primary)' }}>{inspectLog.entity}: {inspectLog.entityName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Action & Branch</span>
                <strong style={{ color: '#fff' }}>{inspectLog.action} • {inspectLog.branchName || 'Bandra'}</strong>
              </div>
            </div>

            {/* Side-by-Side Diff Box */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              {/* Previous Value */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-red)', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
                  🔴 PREVIOUS VALUE
                </span>
                <pre style={{
                  background: 'rgba(231, 76, 60, 0.08)',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  color: '#e74c3c',
                  padding: '0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  maxHeight: '220px',
                  lineHeight: 1.4
                }}>
                  {inspectLog.previousValue ? JSON.stringify(inspectLog.previousValue, null, 2) : 'null (None / Created)'}
                </pre>
              </div>

              {/* New Value */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
                  🟢 NEW VALUE
                </span>
                <pre style={{
                  background: 'rgba(46, 204, 113, 0.08)',
                  border: '1px solid rgba(46, 204, 113, 0.3)',
                  color: 'var(--accent-green)',
                  padding: '0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  maxHeight: '220px',
                  lineHeight: 1.4
                }}>
                  {inspectLog.newValue ? JSON.stringify(inspectLog.newValue, null, 2) : 'null (Deleted)'}
                </pre>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuditLogs;
