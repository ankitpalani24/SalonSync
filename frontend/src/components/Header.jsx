import React, { useState } from 'react';
import { Sun, Moon, MapPin, ShieldAlert, Award, Menu, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Header = ({ toggleMobileSidebar }) => {
  const {
    darkMode, setDarkMode,
    demoMode, setDemoMode,
    currentUser, setCurrentUser,
    currentSalon,
    currentBranch, switchBranch,
    db,
    logout
  } = useApp();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const customerProfile = currentUser?.role === 'CLIENT' ? db.customers.find(c => c.email === currentUser.email) : null;

  // Get active branch options for active salon
  const branches = db.branches.filter(b => b.salonId === currentUser?.salonId);

  return (
    <header className="main-header" style={{
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
        <div onClick={() => setShowProfileModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--border-light)', paddingLeft: '1.25rem', cursor: 'pointer' }}>
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
      {/* Profile Modal */}
      {showProfileModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowProfileModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ textAlign: 'center' }}>
            <button 
              onClick={() => setShowProfileModal(false)} 
              className="outline-btn"
              style={{ position: 'absolute', top: '15px', right: '15px', padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
            >
              Close
            </button>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--gold-bg)',
              border: '2px solid var(--gold-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-primary)',
              fontSize: '2.2rem',
              fontWeight: 'bold',
              margin: '0.5rem auto 1.5rem auto'
            }}>
              {currentUser?.name ? currentUser.name[0] : 'U'}
            </div>
            
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{currentUser?.name}</h3>
            <span className="badge completed" style={{ marginBottom: '1.5rem', fontSize: '0.7rem', display: 'inline-block' }}>
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
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <p><strong>Email Address:</strong> {currentUser?.email}</p>
              <p><strong>Phone Number:</strong> {currentUser?.phone || 'Not Provided'}</p>
              
              {currentUser?.role !== 'SUPER_ADMIN' && currentSalon && (
                <>
                  <p><strong>Associated Salon:</strong> {currentSalon.name}</p>
                  {currentBranch && <p><strong>Assigned Branch:</strong> {currentBranch.name} ({currentBranch.city})</p>}
                </>
              )}

              {currentUser?.role === 'CLIENT' && customerProfile && (
                <div style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', padding: '0.75rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                  <p style={{ color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Loyalty & Rewards</p>
                  <p><strong>Membership Tier:</strong> <span className={`badge ${customerProfile.membershipLevel?.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>{customerProfile.membershipLevel}</span></p>
                  <p style={{ marginTop: '0.25rem' }}><strong>Accumulated Points:</strong> {customerProfile.loyaltyPoints} Points</p>
                </div>
              )}
              
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  logout();
                }}
                className="outline-btn"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.65rem',
                  fontSize: '0.85rem',
                  marginTop: '1.25rem',
                  borderColor: 'var(--accent-red)',
                  color: 'var(--accent-red)',
                  background: 'var(--accent-red-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
};

export default Header;
