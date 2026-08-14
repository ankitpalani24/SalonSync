import React, { useState, useMemo } from 'react';
import { 
  Bell, CheckCircle2, Trash2, Filter, CheckCheck, Sliders, 
  Calendar, CreditCard, Gift, Crown, Star, Package, DollarSign, 
  UserCheck, BarChart3, AlertCircle, X, ShieldAlert, Sparkles, MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const NotificationCenter = () => {
  const { 
    db, currentUser, tenantFilter, 
    markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, 
    updateNotificationPreferences, addToast 
  } = useApp();

  const allNotifications = db.notifications || [];
  const prefs = db.notificationPrefs || {
    customerChannels: { InApp: true, WhatsApp: true, SMS: true, Email: false },
    staffChannels: { InApp: true, WhatsApp: true, SMS: false, Email: true },
    ownerChannels: { InApp: true, WhatsApp: true, SMS: true, Email: true }
  };

  // Filter States
  const [selectedRole, setSelectedRole] = useState('ALL'); // 'ALL', 'Customer', 'Staff', 'Owner'
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Preferences Modal State
  const [showPrefModal, setShowPrefModal] = useState(false);

  // Preference Form State
  const [customerChannels, setCustomerChannels] = useState(prefs.customerChannels || { InApp: true, WhatsApp: true, SMS: true, Email: false });
  const [staffChannels, setStaffChannels] = useState(prefs.staffChannels || { InApp: true, WhatsApp: true, SMS: false, Email: true });
  const [ownerChannels, setOwnerChannels] = useState(prefs.ownerChannels || { InApp: true, WhatsApp: true, SMS: true, Email: true });

  // Filtered Notifications List
  const filteredNotifications = useMemo(() => {
    let list = [...allNotifications];

    if (selectedRole !== 'ALL') {
      list = list.filter(n => (n.targetRole || 'Customer').toLowerCase() === selectedRole.toLowerCase());
    }

    if (selectedCategory !== 'ALL') {
      list = list.filter(n => (n.category || 'General').toLowerCase() === selectedCategory.toLowerCase());
    }

    if (unreadOnly) {
      list = list.filter(n => !n.read);
    }

    return list;
  }, [allNotifications, selectedRole, selectedCategory, unreadOnly]);

  const unreadTotal = useMemo(() => {
    return allNotifications.filter(n => !n.read).length;
  }, [allNotifications]);

  const getCategoryIcon = (category) => {
    switch ((category || '').toLowerCase()) {
      case 'appointment': return <Calendar size={18} style={{ color: '#3498db' }} />;
      case 'payment': return <CreditCard size={18} style={{ color: 'var(--accent-green)' }} />;
      case 'loyalty': return <Gift size={18} style={{ color: 'var(--gold-primary)' }} />;
      case 'membership': return <Crown size={18} style={{ color: '#9b59b6' }} />;
      case 'review': return <Star size={18} style={{ color: '#f1c40f' }} />;
      case 'inventory': return <Package size={18} style={{ color: '#e67e22' }} />;
      case 'expense': return <DollarSign size={18} style={{ color: '#e74c3c' }} />;
      case 'staffschedule': return <UserCheck size={18} style={{ color: '#1abc9c' }} />;
      case 'dailysummary': return <BarChart3 size={18} style={{ color: '#34495e' }} />;
      default: return <Bell size={18} style={{ color: 'var(--gold-primary)' }} />;
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    await updateNotificationPreferences({
      customerChannels,
      staffChannels,
      ownerChannels
    });
    setShowPrefModal(false);
  };

  return (
    <div className="page-container animated-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Centralized Notification Center</h1>
            {unreadTotal > 0 && (
              <span style={{ 
                background: 'var(--accent-red)', 
                color: '#fff', 
                fontSize: '0.68rem', 
                fontWeight: '800', 
                padding: '0.2rem 0.6rem', 
                borderRadius: '12px' 
              }}>
                {unreadTotal} UNREAD ALERTS
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time multi-channel notification feed for Customers, Staff, and Salon Owners.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={markAllNotificationsAsRead} className="outline-btn" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCheck size={15} /> Mark All as Read
          </button>
          <button onClick={() => setShowPrefModal(true)} className="gold-btn" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sliders size={15} /> Channel Settings
          </button>
        </div>
      </div>

      {/* ── Audience Role Tabs & Controls ── */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Role Pills */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {[
            { id: 'ALL', label: 'All Streams' },
            { id: 'Customer', label: 'Customer Alerts' },
            { id: 'Staff', label: 'Staff Notifications' },
            { id: 'Owner', label: 'Owner Insights' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedRole(tab.id)}
              style={{
                border: selectedRole === tab.id ? '1px solid var(--gold-border)' : '1px solid var(--border-light)',
                background: selectedRole === tab.id ? 'var(--gold-primary)' : 'rgba(255,255,255,0.02)',
                color: selectedRole === tab.id ? '#000' : 'var(--text-secondary)',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category & Unread Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-control"
            style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', width: 'auto', background: 'var(--bg-card)' }}
          >
            <option value="ALL">All Categories</option>
            <option value="Appointment">Appointments</option>
            <option value="Payment">Payments & POS</option>
            <option value="Loyalty">Loyalty Points</option>
            <option value="Membership">Memberships</option>
            <option value="Review">Reviews</option>
            <option value="Inventory">Low Inventory</option>
            <option value="Expense">Expenses</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input 
              type="checkbox" 
              id="unreadToggle" 
              checked={unreadOnly} 
              onChange={(e) => setUnreadOnly(e.target.checked)} 
            />
            <label htmlFor="unreadToggle" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Unread Only
            </label>
          </div>
        </div>

      </div>

      {/* ── Notification Feed List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredNotifications.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Bell size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>No Notifications Found</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>You're all caught up! No notifications match your selected filters.</p>
          </div>
        ) : (
          filteredNotifications.map(notif => {
            const isUnread = !notif.read;

            return (
              <div 
                key={notif._id} 
                className="glass-card" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  justifyContent: 'space-between', 
                  gap: '1rem', 
                  padding: '1rem 1.25rem',
                  borderLeft: isUnread ? '4px solid var(--gold-primary)' : '1px solid var(--border-light)',
                  background: isUnread ? 'rgba(212, 175, 55, 0.04)' : 'rgba(255,255,255,0.02)'
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  
                  {/* Category Icon Badge */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      
                      {/* Unread Glow Dot */}
                      {isUnread && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold-primary)', display: 'inline-block' }} />
                      )}

                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {notif.title || notif.category || 'Notification'}
                      </h4>

                      {/* Target Audience Badge */}
                      <span style={{ 
                        fontSize: '0.62rem', 
                        fontWeight: '700', 
                        padding: '0.1rem 0.45rem', 
                        borderRadius: '4px',
                        background: notif.targetRole === 'Owner' ? 'rgba(231, 76, 60, 0.15)' : notif.targetRole === 'Staff' ? 'rgba(54, 162, 235, 0.15)' : 'rgba(46, 204, 113, 0.15)',
                        color: notif.targetRole === 'Owner' ? 'var(--accent-red)' : notif.targetRole === 'Staff' ? '#3498db' : 'var(--accent-green)'
                      }}>
                        {notif.targetRole || 'Customer'}
                      </span>

                      {/* Channel Badge */}
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {notif.type || 'InApp'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.35rem' }}>
                      {notif.message}
                    </p>

                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(notif.sentAt || notif.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>

                </div>

                {/* Quick Item Actions */}
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  {isUnread && (
                    <button 
                      onClick={() => markNotificationAsRead(notif._id)} 
                      className="outline-btn" 
                      style={{ padding: '0.3rem 0.55rem', fontSize: '0.72rem' }}
                      title="Mark as Read"
                    >
                      <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />
                    </button>
                  )}

                  <button 
                    onClick={() => deleteNotification(notif._id)} 
                    className="outline-btn" 
                    style={{ padding: '0.3rem 0.55rem', fontSize: '0.72rem' }}
                    title="Delete Notification"
                  >
                    <Trash2 size={14} style={{ color: 'var(--accent-red)' }} />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ── NOTIFICATION CHANNEL PREFERENCES MODAL ── */}
      {showPrefModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowPrefModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Notification Channel Preferences</h3>
              <button onClick={() => setShowPrefModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSavePreferences}>
              
              {/* Customer Channel Matrix */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--gold-primary)', fontWeight: '700', marginBottom: '0.5rem' }}>Customer Notifications Channels</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem' }}>
                  <label><input type="checkbox" checked={customerChannels.InApp} onChange={(e) => setCustomerChannels(prev => ({ ...prev, InApp: e.target.checked }))} /> In-App Feed</label>
                  <label><input type="checkbox" checked={customerChannels.WhatsApp} onChange={(e) => setCustomerChannels(prev => ({ ...prev, WhatsApp: e.target.checked }))} /> WhatsApp Direct</label>
                  <label><input type="checkbox" checked={customerChannels.SMS} onChange={(e) => setCustomerChannels(prev => ({ ...prev, SMS: e.target.checked }))} /> Mobile SMS</label>
                  <label><input type="checkbox" checked={customerChannels.Email} onChange={(e) => setCustomerChannels(prev => ({ ...prev, Email: e.target.checked }))} /> Email Digest</label>
                </div>
              </div>

              {/* Staff Channel Matrix */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#3498db', fontWeight: '700', marginBottom: '0.5rem' }}>Staff Member Notifications Channels</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem' }}>
                  <label><input type="checkbox" checked={staffChannels.InApp} onChange={(e) => setStaffChannels(prev => ({ ...prev, InApp: e.target.checked }))} /> In-App Feed</label>
                  <label><input type="checkbox" checked={staffChannels.WhatsApp} onChange={(e) => setStaffChannels(prev => ({ ...prev, WhatsApp: e.target.checked }))} /> WhatsApp Direct</label>
                  <label><input type="checkbox" checked={staffChannels.SMS} onChange={(e) => setStaffChannels(prev => ({ ...prev, SMS: e.target.checked }))} /> Mobile SMS</label>
                  <label><input type="checkbox" checked={staffChannels.Email} onChange={(e) => setStaffChannels(prev => ({ ...prev, Email: e.target.checked }))} /> Email Alerts</label>
                </div>
              </div>

              {/* Owner Channel Matrix */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-red)', fontWeight: '700', marginBottom: '0.5rem' }}>Owner / Manager Executive Alerts</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem' }}>
                  <label><input type="checkbox" checked={ownerChannels.InApp} onChange={(e) => setOwnerChannels(prev => ({ ...prev, InApp: e.target.checked }))} /> In-App Feed</label>
                  <label><input type="checkbox" checked={ownerChannels.WhatsApp} onChange={(e) => setOwnerChannels(prev => ({ ...prev, WhatsApp: e.target.checked }))} /> WhatsApp Direct</label>
                  <label><input type="checkbox" checked={ownerChannels.SMS} onChange={(e) => setOwnerChannels(prev => ({ ...prev, SMS: e.target.checked }))} /> Mobile SMS</label>
                  <label><input type="checkbox" checked={ownerChannels.Email} onChange={(e) => setOwnerChannels(prev => ({ ...prev, Email: e.target.checked }))} /> Daily Email Report</label>
                </div>
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
                Save Channel Preferences
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default NotificationCenter;
