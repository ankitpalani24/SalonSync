import React, { useState } from 'react';
import { Sun, Moon, MapPin, ShieldAlert, Award, Menu, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Header = ({ toggleMobileSidebar, onOpenProfile }) => {
  const {
    darkMode, setDarkMode,
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
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            marginRight: '0.5rem',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="hamburger-btn"
        >
          <Menu size={22} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }} className="header-brand-title">
            {currentUser?.role === 'SUPER_ADMIN' ? 'SalonSync SuperAdmin' : (currentSalon?.name || 'SalonSync Platform')}
          </h2>
          {currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'CLIENT' && currentBranch && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="header-brand-location">
              <MapPin size={12} style={{ color: 'var(--gold-primary)' }} />
              {`${currentBranch.name} (${currentBranch.city})`}
            </p>
          )}
        </div>

        {/* Branch Selector for Owners/Managers */}
        {['SALON_OWNER', 'FRANCHISE_OWNER', 'SALON_MANAGER'].includes(currentUser?.role) && branches.length > 1 && (
          <select
            value={currentBranch?._id || ''}
            onChange={(e) => switchBranch(e.target.value)}
            className="hide-mobile"
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
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Control Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        
        {/* Theme Switcher */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="hide-mobile"
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
