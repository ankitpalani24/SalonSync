import React from 'react';
import { 
  LayoutDashboard, Users, Calendar, Scissors, CreditCard, 
  Package, UserCheck, BarChart3, MessageSquare, Bot, 
  Settings, LogOut, ChevronLeft, ChevronRight, Crown,
  DollarSign, Gift, Globe, Search, Activity, Bell, ShieldCheck, Key, Building2, Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Sidebar = ({ activePage, setActivePage, collapsed, setCollapsed, user, logout, closeMobileSidebar }) => {
  const {
    currentBranch, switchBranch,
    demoMode, setDemoMode,
    db,
    hasPermission, PERMISSIONS
  } = useApp();

  // Categorized Navigation mapping according to permissions and role
  const menuSections = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, permission: null },
        { id: 'notifications', label: 'Notification Center', icon: Bell, permission: null },
        { id: 'appointments', label: 'Calendar Bookings', icon: Calendar, permission: PERMISSIONS.APPOINTMENTS_VIEW },
        { id: 'customers', label: 'Customer CRM', icon: Users, permission: PERMISSIONS.CUSTOMERS_VIEW },
        { id: 'services', label: 'Services & Packages', icon: Scissors, permission: PERMISSIONS.INVENTORY_VIEW },
        { id: 'inventory', label: 'Inventory & Stock', icon: Package, permission: PERMISSIONS.INVENTORY_VIEW },
      ]
    },
    {
      title: 'BUSINESS',
      items: [
        { id: 'billing', label: 'POS Billing', icon: CreditCard, permission: PERMISSIONS.BILLING_VIEW },
        { id: 'expenses', label: 'Expense Ledger', icon: DollarSign, permission: PERMISSIONS.REPORTS_VIEW },
        { id: 'staff', label: 'Staff & Roster', icon: UserCheck, permission: PERMISSIONS.STAFF_VIEW },
        { id: 'analytics', label: 'BI Analytics', icon: BarChart3, permission: PERMISSIONS.REPORTS_VIEW },
        { id: 'health', label: 'Salon Health Score', icon: Activity, permission: PERMISSIONS.REPORTS_VIEW },
      ]
    },
    {
      title: 'GROWTH',
      items: [
        { id: 'discovery', label: 'Find Salons', icon: Search, permission: null },
        { id: 'public-profile', label: 'Public Showcase', icon: Globe, permission: null },
        { id: 'whatsapp', label: 'WhatsApp Hub', icon: MessageSquare, permission: PERMISSIONS.CUSTOMERS_VIEW },
        { id: 'memberships', label: 'Membership Plans', icon: Crown, permission: PERMISSIONS.CUSTOMERS_VIEW },
        { id: 'loyalty', label: 'Loyalty Rewards', icon: Gift, permission: PERMISSIONS.CUSTOMERS_VIEW },
        { id: 'marketing', label: 'Marketing Auto', icon: MessageSquare, roles: ['SALON_OWNER', 'FRANCHISE_OWNER'] },
      ]
    },
    {
      title: 'ENTERPRISE',
      items: [
        { id: 'subscription', label: 'SaaS Subscription', icon: Zap, roles: ['SALON_OWNER', 'FRANCHISE_OWNER', 'SUPER_ADMIN'] },
        { id: 'franchise', label: 'Franchise Hub', icon: Building2, roles: ['SALON_OWNER', 'FRANCHISE_OWNER', 'SUPER_ADMIN'] },
        { id: 'permissions', label: 'Permission Matrix', icon: Key, roles: ['SALON_OWNER', 'FRANCHISE_OWNER', 'SUPER_ADMIN'] },
        { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck, roles: ['SALON_OWNER', 'FRANCHISE_OWNER', 'SUPER_ADMIN'] },
        { id: 'super-admin', label: 'Super Admin', icon: Crown, roles: ['SUPER_ADMIN'] }
      ]
    }
  ];

  const branches = (db && db.branches) ? db.branches.filter(b => b.salonId === user?.salonId) : [];

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
      background: 'var(--bg-sidebar)',
      opacity: 1,
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      transition: 'var(--transition-smooth)',
      position: 'relative',
      zIndex: 100,
      overflow: 'hidden'
    }}>
      {/* Brand Logo */}
      <div style={{
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderBottom: '1px solid rgba(220, 228, 200, 0.15)',
        height: '75px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          background: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: '700',
          fontSize: '1rem',
          letterSpacing: '0.5px',
          flexShrink: 0
        }}>
          SS
        </div>
        {!collapsed && (
          <span style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            color: '#FFFFFF',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}>
            SalonSync
          </span>
        )}
      </div>

      {/* Nav List */}
      <div style={{
        flex: 1,
        minHeight: 0,
        padding: '0.75rem 0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        overflowY: 'auto'
      }}>
        {menuSections.map((sec) => {
          const visibleItems = sec.items.filter(item => {
            if (user?.role === 'SUPER_ADMIN') return item.id === 'super-admin';
            if (item.id === 'super-admin') return false;
            if (item.permission) return hasPermission(item.permission);
            if (item.roles) return item.roles.includes(user?.role);
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={sec.title} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {!collapsed && (
                <div style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--color-primary-light)', letterSpacing: '0.8px', padding: '0.25rem 0.75rem', textTransform: 'uppercase' }}>
                  {sec.title}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.65rem 0.85rem',
                      width: '100%',
                      background: isActive ? 'rgba(124, 77, 158, 0.28)' : 'transparent',
                      color: isActive ? '#FFFFFF' : 'var(--color-primary-soft)',
                      border: 'none',
                      borderLeft: isActive ? '3px solid var(--color-accent-light)' : '3px solid transparent',
                      borderRadius: '8px',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? '600' : '400',
                      transition: 'var(--transition-smooth)',
                      whiteSpace: 'nowrap'
                    }}
                    className="sidebar-link"
                  >
                    <Icon size={17} style={{ flexShrink: 0, color: isActive ? 'var(--color-accent-light)' : 'var(--color-primary-light)' }} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer / Toggle */}
      <div style={{
        padding: '1rem 0.5rem',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        flexShrink: 0
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
