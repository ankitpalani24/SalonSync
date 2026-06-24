import React, { useState } from 'react';
import { Sun, Moon, Bell, MapPin, ShieldAlert, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Header = () => {
  const {
    darkMode, setDarkMode,
    demoMode, setDemoMode,
    currentUser, setCurrentUser,
    currentSalon,
    currentBranch, switchBranch,
    db
  } = useApp();

  const [showAlerts, setShowAlerts] = useState(false);

  // Switch role helper for testing purposes
  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    const matchedUser = db.users.find(u => u.role === selectedRole);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      localStorage.setItem('user', JSON.stringify(matchedUser));
    }
  };

  // Get active branch options for active salon
  const branches = db.branches.filter(b => b.salonId === currentUser?.salonId);
  const notifications = db.notifications.filter(n => n.salonId === currentUser?.salonId).slice(0, 5);

  return (
    <header style={{
      height: '75px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      {/* Brand/Salon Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            {currentUser?.role === 'Super Admin' ? 'Platform Command Center' : currentSalon?.name}
          </h2>
          {currentUser?.role !== 'Super Admin' && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={12} style={{ color: 'var(--gold-primary)' }} />
              {currentBranch?.name} ({currentBranch?.city})
            </p>
          )}
        </div>

        {/* Branch Selector for Owners/Managers */}
        {['Salon Owner', 'Manager'].includes(currentUser?.role) && branches.length > 1 && (
          <select
            value={currentBranch?._id || ''}
            onChange={(e) => switchBranch(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--gold-border)',
              color: 'var(--gold-primary)',
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              outline: 'none'
            }}
          >
            {branches.map(b => (
              <option key={b._id} value={b._id} style={{ background: '#111', color: 'var(--text-primary)' }}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Control Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        
        {/* Sandbox Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.75rem',
          background: 'rgba(212,175,55,0.05)',
          border: '1px solid var(--border-gold)',
          borderRadius: '20px',
          fontSize: '0.75rem'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--gold-primary)',
            display: 'inline-block'
          }} className="pulse-gold"></span>
          <span style={{ color: 'var(--gold-primary)', fontWeight: '600' }}>Demo Sandbox</span>
          
          <button 
            onClick={() => setDemoMode(!demoMode)}
            style={{
              background: 'var(--gold-primary)',
              color: '#000',
              border: 'none',
              borderRadius: '10px',
              padding: '0.1rem 0.4rem',
              fontSize: '0.65rem',
              marginLeft: '0.5rem',
              fontWeight: 'bold'
            }}
          >
            {demoMode ? 'Go Live' : 'Go Demo'}
          </button>
        </div>

        {/* Quick Role Tester (Crucial for evaluation) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>View as:</span>
          <select
            value={currentUser?.role || ''}
            onChange={handleRoleChange}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-primary)',
              borderRadius: '4px',
              padding: '0.35rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              outline: 'none'
            }}
          >
            <option value="Super Admin">Super Admin</option>
            <option value="Salon Owner">Salon Owner</option>
            <option value="Manager">Manager</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Staff">Staff</option>
          </select>
        </div>

        {/* Theme Switcher */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Alerts Notification Dropper */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--gold-primary)',
                color: '#000',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '14px',
                height: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {notifications.length}
              </span>
            )}
          </button>

          {showAlerts && (
            <div style={{
              position: 'absolute',
              top: '35px',
              right: 0,
              width: '320px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--shadow-premium)',
              padding: '1rem',
              zIndex: 120
            }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--gold-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                WhatsApp Activity Log
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No messages sent recently.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n._id} style={{ borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {n.type === 'WhatsApp' ? '💬 WhatsApp Automation' : '✉️ SMS Outbox'}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{n.message}</p>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{new Date(n.sentAt).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--border-light)', paddingLeft: '1.25rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--gold-bg)',
            border: '1px solid var(--gold-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-primary)',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            {currentUser?.name[0]}
          </div>
          <div style={{ display: 'none', md: 'block' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{currentUser?.name}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', fontWeight: '500' }}>{currentUser?.role}</p>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
