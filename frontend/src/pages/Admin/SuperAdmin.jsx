import React, { useState } from 'react';
import { Shield, Users, BarChart3, Edit, Settings, Crown, Mail, CheckCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const SuperAdmin = () => {
  const { db, updateSalonSubscription } = useApp();

  const [selectedSalonId, setSelectedSalonId] = useState('');
  const [showSubModal, setShowSubModal] = useState(false);
  const [subPlan, setSubPlan] = useState('Starter Salon');
  const [subStatus, setSubStatus] = useState('Trial');

  // Master Calculations
  const totalSalons = db.salons.length;
  const totalUsers = db.users.length;
  const activeSaaSRevenue = db.salons
    .filter(s => s.subscriptionStatus === 'Active')
    .reduce((sum, s) => {
      const planPrices = { 'Starter Salon': 1999, 'Franchise': 9999 };
      return sum + (planPrices[s.subscriptionPlan] || 0);
    }, 0);

  const starterCount = db.salons.filter(s => s.subscriptionPlan === 'Starter Salon').length;
  const franchiseCount = db.salons.filter(s => s.subscriptionPlan === 'Franchise').length;

  const handleOpenSubscription = (salon) => {
    setSelectedSalonId(salon._id);
    setSubPlan(salon.subscriptionPlan);
    setSubStatus(salon.subscriptionStatus);
    setShowSubModal(true);
  };

  const handleSubscriptionSubmit = (e) => {
    e.preventDefault();
    updateSalonSubscription(selectedSalonId, subPlan, subStatus);
    setShowSubModal(false);
  };

  // Mock support tickets
  const supportTickets = [
    { id: 't_1', salon: 'Luxe & Gold Salon', author: 'Alexander W.', issue: 'Need custom template triggers for WhatsApp API.', date: '2026-06-23', status: 'Pending' },
    { id: 't_2', salon: 'The Royal Grooming Co', author: 'Robert M.', issue: 'Cannot connect billing device to receipts printer.', date: '2026-06-24', status: 'Closed' }
  ];

  return (
    <div className="page-container animated-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Super Admin Command Center</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Master dashboards and licensing configs for SalonSync platform.</p>
      </div>

      {/* Global metrics grid */}
      <div className="grid-4-cols" style={{ marginBottom: '2rem' }}>
        <div className="glass-card">
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOTAL TENANT SALONS</p>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--gold-primary)', fontWeight: 'bold', marginTop: '0.25rem' }}>{totalSalons} Salons</h3>
        </div>

        <div className="glass-card">
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>MONTHLY SAAS REVENUE</p>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '0.25rem' }}>₹{activeSaaSRevenue.toLocaleString()}</h3>
        </div>

        <div className="glass-card">
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOTAL ACTIVE USERS</p>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold', marginTop: '0.25rem' }}>{totalUsers} Members</h3>
        </div>

        <div className="glass-card">
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SUBSCRIBERS SPLITS</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Starter Salon: {starterCount} • Franchise: {franchiseCount}
          </p>
        </div>
      </div>

      {/* Tenant Directory */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Registered Salon Companies</h3>

        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Salon Enterprise Name</th>
                <th>Owner Details</th>
                <th>City / State</th>
                <th>Licensing Tier</th>
                <th>SaaS Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {db.salons.map(s => (
                <tr key={s._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '4px',
                        background: 'var(--gold-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--gold-primary)',
                        fontWeight: 'bold'
                      }}>S</div>
                      <div>
                        <strong>{s.name}</strong>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>GSTIN: {s.gstNumber || 'None'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span>{s.ownerName}</span>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.email}</p>
                  </td>
                  <td>{s.city}, {s.state}</td>
                  <td>
                    <span className="badge confirmed">{s.subscriptionPlan}</span>
                  </td>
                  <td>
                    <span className={`badge ${s.subscriptionStatus === 'Active' ? 'completed' : 'cancelled'}`}>
                      {s.subscriptionStatus}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleOpenSubscription(s)} className="outline-btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                      <Edit size={12} /> Edit Tier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Support Tickets */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Mail size={16} style={{ color: 'var(--gold-primary)' }} /> Live Platform Support Tickets
        </h3>

        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Salon Company</th>
                <th>Contact User</th>
                <th>Ticket Issue outline</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {supportTickets.map(ticket => (
                <tr key={ticket.id}>
                  <td><strong>{ticket.salon}</strong></td>
                  <td>{ticket.author}</td>
                  <td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ticket.issue}</span></td>
                  <td>{ticket.date}</td>
                  <td>
                    <span className={`badge ${ticket.status === 'Closed' ? 'completed' : 'inprogress'}`}>{ticket.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription edit Modal */}
      {showSubModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card gold-border" style={{ width: '380px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Edit Licensing Settings</h3>
              <button onClick={() => setShowSubModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubscriptionSubmit}>
              <div className="form-group">
                <label>SaaS Subscription Plan</label>
                <select className="form-control" value={subPlan} onChange={(e) => setSubPlan(e.target.value)}>
                  <option value="Starter Salon">Starter Salon (₹1,999/mo)</option>
                  <option value="Franchise">Franchise (₹9,999/mo)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Billing Subscription Status</label>
                <select className="form-control" value={subStatus} onChange={(e) => setSubStatus(e.target.value)}>
                  <option value="Active">Active (Paid)</option>
                  <option value="Trial">Trial Period</option>
                  <option value="Expired">Expired (Locked)</option>
                </select>
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                <CheckCircle size={16} /> Save Licensing Limits
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdmin;
