import React from 'react';
import { 
  LayoutDashboard, Users, Calendar, Scissors, CreditCard, 
  Package, UserCheck, BarChart3, MessageSquare, Bot, 
  Settings, LogOut, ChevronLeft, ChevronRight, Crown,
  Sun, Moon
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Sidebar = ({ activePage, setActivePage, collapsed, setCollapsed, user, logout, closeMobileSidebar }) => {
  // Navigation mapping according to role
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER', 'STAFF', 'CLIENT'] },
    { id: 'customers', label: 'Customer CRM', icon: Users, roles: ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'] },
    { id: 'appointments', label: 'Calendar Bookings', icon: Calendar, roles: ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER', 'STAFF', 'CLIENT'] },
    { id: 'services', label: 'Services & Packages', icon: Scissors, roles: ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'] },
    { id: 'billing', label: 'POS Billing', icon: CreditCard, roles: ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'] },
    { id: 'staff', label: 'Staff & Roster', icon: UserCheck, roles: ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER', 'STAFF'] },
    { id: 'analytics', label: 'BI Analytics', icon: BarChart3, roles: ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'] },
    { id: 'marketing', label: 'Marketing Auto', icon: MessageSquare, roles: ['SALON_OWNER', 'FRANCHISE_OWNER'] },
    { id: 'super-admin', label: 'Super Admin', icon: Crown, roles: ['SUPER_ADMIN'] }
  ];

  const {
    currentBranch, switchBranch,
    demoMode, setDemoMode,
    setCurrentUser,
    db,
    darkMode, setDarkMode
  } = useApp();

  const branches = db.branches.filter(b => b.salonId === user?.salonId);

  const filteredMenu = menuItems.filter(item => {
    if (user.role === 'SUPER_ADMIN') return item.id === 'super-admin';
    return item.roles.includes(user.role);
  });

  const touchRef = React.useRef({ startX: 0 });

  const handleTouchStart = (e) => {
    touchRef.current.startX = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!closeMobileSidebar) return;
    const touchEndX = e.touches[0].clientX;
    const diffX = touchRef.current.startX - touchEndX;
    if (diffX > 60) { // Swiped left by 60px or more
      closeMobileSidebar();
    }
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{
        width: collapsed ? '70px' : '260px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      transition: 'var(--transition-smooth)',
      position: 'relative',
      zIndex: 100,
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Brand Logo */}
      <div style={{
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderBottom: '1px solid var(--border-light)',
        height: '75px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, var(--gold-primary) 0%, #b38f20 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          flexShrink: 0
        }}>
          SS
        </div>
        {!collapsed && (
          <span style={{
            fontSize: '1.15rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--gold-primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '1px',
            whiteSpace: 'nowrap'
          }}>
            SalonSync
          </span>
        )}
      </div>

      {/* Nav List */}
      <div style={{
        flex: 1,
        padding: '1rem 0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        overflowY: 'auto'
      }}>
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.85rem 1rem',
                width: '100%',
                background: isActive ? 'var(--gold-bg)' : 'transparent',
                color: isActive ? 'var(--gold-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderLeft: isActive ? '3px solid var(--gold-primary)' : '3px solid transparent',
                borderRadius: '4px',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: isActive ? '600' : '400',
                transition: 'var(--transition-smooth)',
                whiteSpace: 'nowrap'
              }}
              className="sidebar-link"
            >
              <Icon size={18} style={{ flexShrink: 0, color: isActive ? 'var(--gold-primary)' : 'inherit' }} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Footer / Toggle */}
      <div style={{
        padding: '1rem 0.5rem',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {/* Mobile-only Quick Controls */}
        <div className="sidebar-mobile-controls" style={{
          padding: '0.75rem',
          borderBottom: '1px solid var(--border-light)',
          display: 'none',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '0.5rem'
        }}>
          {/* Branch Selector */}
          {['SALON_OWNER', 'FRANCHISE_OWNER', 'SALON_MANAGER'].includes(user?.role) && branches.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Branch:</span>
              <select
                value={currentBranch?._id || ''}
                onChange={(e) => switchBranch(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--gold-border)',
                  color: 'var(--gold-primary)',
                  borderRadius: '4px',
                  padding: '0.35rem 0.5rem',
                  fontSize: '0.75rem',
                  outline: 'none',
                  width: '100%'
                }}
              >
                {branches.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* App Theme Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>App Theme:</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.2rem 0' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
              <div 
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  width: '42px',
                  height: '22px',
                  borderRadius: '11px',
                  background: darkMode ? 'var(--gold-primary)' : 'rgba(255,255,255,0.1)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: darkMode ? '#000000' : '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: darkMode ? '22px' : '2px',
                  transition: 'left 0.2s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {darkMode ? <Moon size={9} style={{ color: 'var(--gold-primary)' }} /> : <Sun size={9} style={{ color: '#ffb900' }} />}
                </div>
              </div>
            </div>
          </div>
        </div>



        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-collapse-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            width: '100%',
            background: 'rgba(255,255,255,0.02)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: '4px',
            fontSize: '0.8rem'
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
