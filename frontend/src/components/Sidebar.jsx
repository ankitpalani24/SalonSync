import React from 'react';
import { 
  LayoutDashboard, Users, Calendar, Scissors, CreditCard, 
  Package, UserCheck, BarChart3, MessageSquare, Bot, 
  Settings, LogOut, ChevronLeft, ChevronRight, Crown 
} from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, collapsed, setCollapsed, user, logout }) => {
  // Navigation mapping according to role
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['Salon Owner', 'Manager', 'Receptionist', 'Staff'] },
    { id: 'customers', label: 'Customer CRM', icon: Users, roles: ['Salon Owner', 'Manager', 'Receptionist'] },
    { id: 'appointments', label: 'Calendar Bookings', icon: Calendar, roles: ['Salon Owner', 'Manager', 'Receptionist', 'Staff'] },
    { id: 'services', label: 'Services & Packages', icon: Scissors, roles: ['Salon Owner', 'Manager', 'Receptionist'] },
    { id: 'billing', label: 'POS Billing', icon: CreditCard, roles: ['Salon Owner', 'Manager', 'Receptionist'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['Salon Owner', 'Manager', 'Receptionist'] },
    { id: 'staff', label: 'Staff & Roster', icon: UserCheck, roles: ['Salon Owner', 'Manager', 'Staff'] },
    { id: 'analytics', label: 'BI Analytics', icon: BarChart3, roles: ['Salon Owner', 'Manager'] },
    { id: 'marketing', label: 'Marketing Auto', icon: MessageSquare, roles: ['Salon Owner'] },
    { id: 'super-admin', label: 'Super Admin', icon: Crown, roles: ['Super Admin'] }
  ];

  const filteredMenu = menuItems.filter(item => {
    if (user.role === 'Super Admin') return item.id === 'super-admin';
    return item.roles.includes(user.role);
  });

  return (
    <div style={{
      width: collapsed ? '70px' : '260px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      transition: 'var(--transition-smooth)',
      position: 'relative',
      zIndex: 100
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
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.85rem 1rem',
            width: '100%',
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: 'none',
            borderRadius: '4px',
            textAlign: 'left',
            fontSize: '0.9rem',
            transition: 'var(--transition-smooth)'
          }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sign Out</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
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
