import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, CheckCircle2, XCircle, Users, Key, 
  Sparkles, Check, AlertTriangle, ChevronRight, UserCheck, Shield
} from 'lucide-react';
import { useApp, PERMISSIONS, ROLE_PERMISSIONS } from '../context/AppContext';

const RolePermissionMatrix = () => {
  const { currentUser, addToast } = useApp();

  // Test Role Simulation State
  const [simulatedRole, setSimulatedRole] = useState(currentUser?.role || 'SALON_OWNER');
  const [simulatedPermission, setSimulatedPermission] = useState('customers.delete');

  const roles = [
    { key: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full platform access wildcard (*)' },
    { key: 'FRANCHISE_OWNER', label: 'Franchise Owner', desc: 'Full multi-branch salon administration' },
    { key: 'SALON_OWNER', label: 'Salon Owner', desc: 'Complete salon business control' },
    { key: 'SALON_MANAGER', label: 'Salon Manager', desc: 'Operational manager (excluding refund overrides)' },
    { key: 'STAFF', label: 'Staff Member', desc: 'Stylist & receptionist daily operations' },
    { key: 'CLIENT', label: 'Client / Guest', desc: 'Self-service booking & invoice viewer' }
  ];

  const permissionGroups = [
    {
      title: 'Customer CRM',
      items: [
        { key: PERMISSIONS.CUSTOMERS_VIEW, label: 'customers.view', desc: 'View customer directory & profiles' },
        { key: PERMISSIONS.CUSTOMERS_CREATE, label: 'customers.create', desc: 'Register new clients' },
        { key: PERMISSIONS.CUSTOMERS_EDIT, label: 'customers.edit', desc: 'Update client details & loyalty' },
        { key: PERMISSIONS.CUSTOMERS_DELETE, label: 'customers.delete', desc: 'Remove customer records' }
      ]
    },
    {
      title: 'Appointments & Scheduling',
      items: [
        { key: PERMISSIONS.APPOINTMENTS_VIEW, label: 'appointments.view', desc: 'View appointment calendar' },
        { key: PERMISSIONS.APPOINTMENTS_CREATE, label: 'appointments.create', desc: 'Book new appointments' },
        { key: PERMISSIONS.APPOINTMENTS_EDIT, label: 'appointments.edit', desc: 'Reschedule or change service' },
        { key: PERMISSIONS.APPOINTMENTS_CANCEL, label: 'appointments.cancel', desc: 'Cancel appointment bookings' }
      ]
    },
    {
      title: 'POS & Billing',
      items: [
        { key: PERMISSIONS.BILLING_VIEW, label: 'billing.view', desc: 'View invoices & POS transactions' },
        { key: PERMISSIONS.BILLING_CREATE, label: 'billing.create', desc: 'Process checkout & issue invoices' },
        { key: PERMISSIONS.BILLING_REFUND, label: 'billing.refund', desc: 'Issue invoice refunds & voids' }
      ]
    },
    {
      title: 'Inventory & Services',
      items: [
        { key: PERMISSIONS.INVENTORY_VIEW, label: 'inventory.view', desc: 'View product stock & catalog' },
        { key: PERMISSIONS.INVENTORY_EDIT, label: 'inventory.edit', desc: 'Add/edit products & service prices' }
      ]
    },
    {
      title: 'Staff & HR',
      items: [
        { key: PERMISSIONS.STAFF_VIEW, label: 'staff.view', desc: 'View staff directory & schedules' },
        { key: PERMISSIONS.STAFF_MANAGE, label: 'staff.manage', desc: 'Manage staff, commissions & roster' }
      ]
    },
    {
      title: 'Reports & BI Analytics',
      items: [
        { key: PERMISSIONS.REPORTS_VIEW, label: 'reports.view', desc: 'Access revenue reports & BI dashboard' }
      ]
    }
  ];

  const checkRolePermission = (roleKey, permKey) => {
    const allowed = ROLE_PERMISSIONS[roleKey] || [];
    if (allowed.includes('*')) return true;
    return allowed.includes(permKey);
  };

  const isSimulatedAllowed = checkRolePermission(simulatedRole, simulatedPermission);

  return (
    <div className="page-container animated-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Role-Based Access Control (RBAC/PBAC)</h1>
            <span style={{ 
              background: 'var(--gold-bg)', 
              color: 'var(--gold-primary)', 
              border: '1px solid var(--gold-border)', 
              fontSize: '0.65rem', 
              fontWeight: '700', 
              padding: '0.2rem 0.55rem', 
              borderRadius: '12px' 
            }}>
              16 GRANULAR PERMISSIONS
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Granular permission matrix defining security boundaries across 6 system roles.
          </p>
        </div>
      </div>

      {/* ── Interactive Role Permission Tester Simulator ── */}
      <div className="glass-card" style={{ 
        marginBottom: '1.75rem', 
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(10, 15, 20, 0.95) 100%)', 
        border: '1px solid var(--gold-border)',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--gold-primary)' }}>
          <Key size={18} />
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '700' }}>Permission Access Simulator</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Select Role to Test</label>
            <select 
              value={simulatedRole} 
              onChange={(e) => setSimulatedRole(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.82rem' }}
            >
              {roles.map(r => <option key={r.key} value={r.key}>{r.label} ({r.key})</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Select Granular Permission</label>
            <select 
              value={simulatedPermission} 
              onChange={(e) => setSimulatedPermission(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.82rem' }}
            >
              {permissionGroups.flatMap(g => g.items).map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>

          <div style={{
            background: isSimulatedAllowed ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)',
            border: `1px solid ${isSimulatedAllowed ? 'rgba(46, 204, 113, 0.4)' : 'rgba(231, 76, 60, 0.4)'}`,
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {isSimulatedAllowed ? (
              <CheckCircle2 size={22} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
            ) : (
              <XCircle size={22} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
            )}
            <div>
              <strong style={{ fontSize: '0.85rem', color: isSimulatedAllowed ? 'var(--accent-green)' : 'var(--accent-red)', display: 'block' }}>
                {isSimulatedAllowed ? 'ACCESS GRANTED' : 'ACCESS RESTRICTED'}
              </strong>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Role <strong>{simulatedRole}</strong> {isSimulatedAllowed ? 'possesses' : 'lacks'} permission <code>{simulatedPermission}</code>.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Granular Role Permission Matrix Grid Table ── */}
      <div className="glass-card">
        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>System Role Permission Matrix</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Granular authorization mappings across all system roles.</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="premium-table" style={{ fontSize: '0.78rem' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>Granular Permission</th>
                <th style={{ textAlign: 'center' }}>SUPER ADMIN</th>
                <th style={{ textAlign: 'center' }}>FRANCHISE OWNER</th>
                <th style={{ textAlign: 'center' }}>SALON OWNER</th>
                <th style={{ textAlign: 'center' }}>MANAGER</th>
                <th style={{ textAlign: 'center' }}>STAFF</th>
                <th style={{ textAlign: 'center' }}>CLIENT</th>
              </tr>
            </thead>
            <tbody>
              {permissionGroups.map(group => (
                <React.Fragment key={group.title}>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <td colSpan="7" style={{ fontWeight: '800', color: 'var(--gold-primary)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                      {group.title}
                    </td>
                  </tr>
                  {group.items.map(perm => (
                    <tr key={perm.key}>
                      <td>
                        <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{perm.label}</strong>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{perm.desc}</span>
                      </td>

                      {['SUPER_ADMIN', 'FRANCHISE_OWNER', 'SALON_OWNER', 'SALON_MANAGER', 'STAFF', 'CLIENT'].map(roleKey => {
                        const isGranted = checkRolePermission(roleKey, perm.key);

                        return (
                          <td key={roleKey} style={{ textAlign: 'center' }}>
                            {isGranted ? (
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: '12px', background: 'rgba(46, 204, 113, 0.15)', color: 'var(--accent-green)', fontWeight: '700', fontSize: '0.68rem', border: '1px solid rgba(46, 204, 113, 0.3)' }}>
                                ✓ Granted
                              </span>
                            ) : (
                              <span style={{ padding: '0.15rem 0.45rem', borderRadius: '12px', background: 'rgba(231, 76, 60, 0.15)', color: 'var(--accent-red)', fontWeight: '700', fontSize: '0.68rem', border: '1px solid rgba(231, 76, 60, 0.3)' }}>
                                🔒 Locked
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default RolePermissionMatrix;
