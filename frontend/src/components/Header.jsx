import React, { useState } from 'react';
import { MapPin, ShieldAlert, Award, Menu, LogOut, Search, Command, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Header = ({ toggleMobileSidebar, onOpenProfile, onOpenCommandPalette, setActivePage }) => {
  const {
    demoMode, setDemoMode,
    currentUser, setCurrentUser,
    currentSalon,
    currentBranch, switchBranch,
    db,
    logout
  } = useApp();

  // Get active branch options for active salon
  const branches = db.branches.filter(b => b.salonId === currentUser?.salonId);

  return (
    <header className="main-header" style={{
      background: 'var(--bg-header)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Hamburger Menu Toggle for Mobile */}
        <button
          onClick={toggleMobileSidebar}
          aria-label="Toggle navigation menu"
          className="hamburger-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '6px',
            minWidth: '40px',
            minHeight: '40px',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <img 
            src="/salonsync-icon.png" 
            alt="SalonSync" 
            className="header-mobile-icon" 
            style={{ 
              width: '28px', 
              height: '28px', 
              objectFit: 'contain', 
              flexShrink: 0,
              display: 'none'
            }} 
          />
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }} className="header-brand-title">
              {(() => {
                if (currentUser?.role === 'SUPER_ADMIN') return 'SalonSync SuperAdmin';
                if (currentUser?.role === 'CLIENT') return currentUser?.name || 'Client Workspace';
                return currentSalon?.name || 'SalonSync Platform';
              })()}
            </h2>
            {currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'CLIENT' && currentBranch && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }} className="header-brand-location">
                <MapPin size={12} style={{ color: 'var(--gold-primary)', flexShrink: 0 }} />
                <span>{`${currentBranch.name} (${currentBranch.city})`}</span>
              </p>
            )}
          </div>
        </div>

        {/* Global Search Bar Trigger */}
        <div
          onClick={onOpenCommandPalette}
          className="hide-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-light)',
            borderRadius: '20px',
            padding: '0.35rem 0.85rem',
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            marginLeft: '1rem',
            transition: 'var(--transition-smooth)'
          }}
        >
          <Search size={14} style={{ color: 'var(--gold-primary)' }} />
          <span>Global Search...</span>
          <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            Ctrl + K
          </span>
        </div>
      </div>

      {/* Control Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>

        {/* Centralized Notification Center Bell Icon */}
        <div style={{ position: 'relative' }}>
          {(() => {
            const unreadCount = (db.notifications || []).filter(n => !n.read).length;
            return (
              <button
                type="button"
                onClick={() => setActivePage ? setActivePage('notifications') : null}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                title="Notification Center"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell size={18} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span 
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      background: 'var(--accent-red)',
                      color: '#fff',
                      fontSize: '0.62rem',
                      fontWeight: '800',
                      borderRadius: '10px',
                      padding: '0.1rem 0.4rem',
                      lineHeight: 1,
                      boxShadow: '0 0 8px rgba(231,76,60,0.6)'
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })()}
        </div>

        {/* User Card */}
        <div onClick={onOpenProfile} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--border-light)', paddingLeft: '1.25rem', cursor: 'pointer' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--gold-bg)',
            border: '1px solid var(--gold-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-primary)',
            fontSize: '1rem',
            fontWeight: '600',
            padding: '2px',
            marginRight: '0.25rem'
          }}>
            {currentUser?.name[0]}
          </div>
          <div className="header-user-details">
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{currentUser?.name}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', fontWeight: '500' }}>
              {(() => {
                const rolesMap = {
                  SUPER_ADMIN: 'Super Admin',
                  SALON_OWNER: 'Salon Owner',
                  SALON_MANAGER: 'Salon Manager',
                  FRANCHISE_OWNER: 'Franchise Owner',
                  STAFF: 'Staff Member',
                  CLIENT: 'Client'
                };
                return rolesMap[currentUser?.role] || currentUser?.role;
              })()}
            </p>
          </div>
        </div>

      </div>


    </header>
  );
};

export default Header;
