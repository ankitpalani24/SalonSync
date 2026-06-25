import React, { useState } from 'react';
import { MessageSquare, Mail, Bell, Sparkles, Send, Play, Layers, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Marketing = () => {
  const { tenantFilter, db, addNotification } = useApp();

  const notifications = tenantFilter(db.notifications);
  const customers = tenantFilter(db.customers);

  const [activeTab, setActiveTab] = useState('triggers'); // 'triggers', 'history'
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  // Form states
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignChannel, setCampaignChannel] = useState('WhatsApp'); // 'WhatsApp', 'SMS', 'Email'
  const [campaignTarget, setCampaignTarget] = useState('All Customers'); // 'All', 'Platinum only', 'Inactives'
  const [campaignMessage, setCampaignMessage] = useState('');

  // Auto trigger states
  const [triggers, setTriggers] = useState([
    { id: 'bday', name: 'Birthday Wishes', desc: 'Sends coupon codes on client birthdays.', channel: 'WhatsApp', enabled: true },
    { id: 'anniv', name: 'Anniversary Greetings', desc: 'Triggered automatically on anniversary logs.', channel: 'WhatsApp', enabled: false },
    { id: 'appt_rem', name: 'Appointment Reminders', desc: 'Alerts sent 2 hours before scheduled slot.', channel: 'SMS', enabled: true },
    { id: 'renewal', name: 'Membership Expiry Warnings', desc: 'Alerts sent 15 days before membership validity expires.', channel: 'WhatsApp', enabled: true },
    { id: 'revisit', name: 'Client Revisit Prompts', desc: 'Sent to clients who have not visited in 45 days.', channel: 'WhatsApp', enabled: true }
  ]);

  const toggleTrigger = (id) => {
    setTriggers(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  const handleCampaignSubmit = (e) => {
    e.preventDefault();
    if (!campaignMessage) return;

    let targetClients = customers;
    if (campaignTarget === 'Platinum only') {
      targetClients = customers.filter(c => c.membershipLevel === 'Platinum');
    }

    // Loop through clients and create mock messages
    targetClients.forEach(c => {
      addNotification({
        customerId: c._id,
        type: campaignChannel,
        message: campaignMessage.replace('{name}', c.name)
      });
    });

    alert(`Broadcast dispatched! Sent ${targetClients.length} ${campaignChannel} campaigns successfully.`);
    setShowCampaignModal(false);

    // reset
    setCampaignTitle('');
    setCampaignMessage('');
  };

  return (
    <div className="page-container animated-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Marketing Automations</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Launch WhatsApp broadcast campaigns and configure automated triggers.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.2rem', borderRadius: '4px' }}>
          <button onClick={() => setActiveTab('triggers')} style={{ border: 'none', background: activeTab === 'triggers' ? 'var(--gold-primary)' : 'transparent', color: activeTab === 'triggers' ? '#000' : '#aaa', fontSize: '0.75rem', fontWeight: '600', padding: '0.35rem 0.75rem', borderRadius: '3px' }}>
            Automated Triggers
          </button>
          <button onClick={() => setActiveTab('history')} style={{ border: 'none', background: activeTab === 'history' ? 'var(--gold-primary)' : 'transparent', color: activeTab === 'history' ? '#000' : '#aaa', fontSize: '0.75rem', fontWeight: '600', padding: '0.35rem 0.75rem', borderRadius: '3px' }}>
            Broadcast History logs
          </button>
        </div>
      </div>

      {/* 1. TRIGGERS PANEL */}
      {activeTab === 'triggers' && (
        <div className="grid-split-2-1">
          
          {/* List of Triggers */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Auto-Trigger Messaging Rules</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {triggers.map(tr => (
                <div key={tr.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px'
                }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>{tr.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{tr.desc}</p>
                    <span style={{
                      display: 'inline-block',
                      marginTop: '0.5rem',
                      fontSize: '0.65rem',
                      background: 'rgba(212,175,55,0.05)',
                      color: 'var(--gold-primary)',
                      border: '1px solid var(--gold-border)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '3px'
                    }}>{tr.channel} template</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: tr.enabled ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {tr.enabled ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      onClick={() => toggleTrigger(tr.id)}
                      style={{
                        width: '40px',
                        height: '22px',
                        borderRadius: '11px',
                        background: tr.enabled ? 'var(--gold-primary)' : '#444',
                        border: 'none',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#000',
                        position: 'absolute',
                        top: '3px',
                        left: tr.enabled ? '21px' : '3px',
                        transition: 'all 0.2s ease'
                      }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Campaign launcher */}
          <div className="glass-card gold-border" style={{ background: 'var(--gold-bg)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sparkles size={16} /> Instant Broadcast
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Dispatch localized promos or greetings to clients via WhatsApp or SMS instantly.
            </p>
            <button onClick={() => setShowCampaignModal(true)} className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
              <Send size={14} /> Launch Promo Broadcast
            </button>
          </div>

        </div>
      )}

      {/* 2. HISTORY LOG PANEL */}
      {activeTab === 'history' && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Broadcasting activity logs</h3>
          
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Client Profile</th>
                  <th>Channel Mode</th>
                  <th>Broadcast Text Details</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(notif => {
                  const client = db.customers.find(c => c._id === notif.customerId);
                  return (
                    <tr key={notif._id}>
                      <td>
                        <strong>{client ? client.name : 'All Guest Broadcast'}</strong>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{client ? client.phone : ''}</p>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {notif.type}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{notif.message}</span>
                      </td>
                      <td>{new Date(notif.sentAt).toLocaleTimeString()}</td>
                      <td>
                        <span className="badge completed">Sent</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Broadcast Campaign Modal */}
      {showCampaignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card gold-border" style={{ width: '450px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>New Message Broadcast</h3>
              <button onClick={() => setShowCampaignModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCampaignSubmit}>
              <div className="form-group">
                <label>Campaign Title Name *</label>
                <input type="text" required placeholder="Monsoon Spa Promo" className="form-control" value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} />
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Marketing Channel</label>
                  <select className="form-control" value={campaignChannel} onChange={(e) => setCampaignChannel(e.target.value)}>
                    <option>WhatsApp</option>
                    <option>SMS</option>
                    <option>Email</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Audience</label>
                  <select className="form-control" value={campaignTarget} onChange={(e) => setCampaignTarget(e.target.value)}>
                    <option>All Customers</option>
                    <option>Platinum only</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Message Content *</label>
                <textarea
                  required
                  rows="4"
                  className="form-control"
                  placeholder="Hello {name}, enjoy 20% discount on spa bookings this weekend! Quote LUXE20."
                  value={campaignMessage}
                  onChange={(e) => setCampaignMessage(e.target.value)}
                />
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Use <code>{`{name}`}</code> to automatically customize the customer name on delivery.
                </p>
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>Dispatched Campaign Broadcast</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Marketing;
