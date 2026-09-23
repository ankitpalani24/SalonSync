import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users, Calendar, Scissors, CreditCard, 
  Package, UserCheck, BarChart3, MessageSquare, Bot, 
  Settings, LogOut, ChevronLeft, ChevronRight, Crown,
  DollarSign, Gift, Globe, Search, Activity, Bell, ShieldCheck, Key, Building2, Zap, X, ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Sidebar = ({ activePage, setActivePage, collapsed, setCollapsed, user, logout, closeMobileSidebar }) => {
  const {
    currentBranch, switchBranch,
    demoMode, setDemoMode,
    db,
    hasPermission, PERMISSIONS
  } = useApp();

  // Collapsible category accordion state
  const [openSections, setOpenSections] = useState({
    OPERATIONS: true,
    BUSINESS: true,
    GROWTH: false,
    ENTERPRISE: false
  });

  const toggleSection = (title) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

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

  // Auto-expand section containing the currently active page
  useEffect(() => {
    const activeSec = menuSections.find(sec => sec.items.some(item => item.id === activePage));
    if (activeSec) {
      setOpenSections(prev => ({ ...prev, [activeSec.title]: true }));
    }
  }, [activePage]);

  const branches = (db && db.branches) ? db.branches.filter(b => b.salonId === user?.salonId) : [];

  const touchRef = useRef({ startX: 0 });

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
      className="sidebar-wrapper"
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
        padding: '1.25rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-light)',
        height: '70px',
        overflow: 'hidden'
      }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, minWidth: 0, overflow: 'hidden' }}
          onClick={() => setActivePage('dashboard')}
          title="SalonSync Dashboard"
        >
          {collapsed ? (
            <img 
              src="/salonsync-icon.png" 
              alt="SalonSync" 
              style={{
                width: '34px',
                height: '34px',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto'
              }}
            />
          ) : (
            <img 
              src="/SalonSync_Full_Transparent.png" 
              alt="SalonSync - Beauty Meets Business" 
              style={{
                maxWidth: '165px',
                width: '100%',
                height: 'auto',
                maxHeight: '48px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          )}
        </div>

        {/* Mobile close button inside drawer */}
        <button
          onClick={closeMobileSidebar}
          aria-label="Close navigation drawer"
          className="sidebar-mobile-close-btn"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-secondary)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav List */}
      <nav 
        aria-label="Main Navigation"
        className="sidebar-nav"
        style={{
          flex: 1,
          minHeight: 0,
          padding: '0.75rem 0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          overflowY: 'auto'
        }}
      >
        {menuSections.map((sec) => {
          const visibleItems = sec.items.filter(item => {
            if (user?.role === 'SUPER_ADMIN') return item.id === 'super-admin';
            if (item.id === 'super-admin') return false;
            if (item.permission) return hasPermission(item.permission);
            if (item.roles) return item.roles.includes(user?.role);
            return true;
          });

          if (visibleItems.length === 0) return null;

          const isExpanded = openSections[sec.title] ?? true;
          const sectionId = `nav-sec-${sec.title.toLowerCase()}`;

          return (
            <div key={sec.title} className="sidebar-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {!collapsed && (
                <button
                  type="button"
                  className="sidebar-group-toggle"
                  onClick={() => toggleSection(sec.title)}
                  aria-expanded={isExpanded}
                  aria-controls={sectionId}
                  title={`Toggle ${sec.title} category`}
                >
                  <span>{sec.title}</span>
                  <ChevronDown 
                    size={13} 
                    aria-hidden="true"
                    style={{ 
                      transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', 
                      transition: 'transform 0.2s ease',
                      opacity: 0.85
                    }} 
                  />
                </button>
              )}
              <div
                id={sectionId}
                role="region"
                aria-label={sec.title}
                style={{
                  display: isExpanded || collapsed ? 'flex' : 'none',
                  flexDirection: 'column',
                  gap: '0.15rem'
                }}
              >
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`sidebar-link ${isActive ? 'sidebar-link-active active' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon 
                        size={17} 
                        aria-hidden="true"
                        style={{ 
                          flexShrink: 0, 
                          color: isActive ? 'var(--gold-accent)' : 'inherit' 
                        }} 
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

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
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-collapse-btn"
          aria-label={collapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '0.6rem',
            padding: '0.55rem 0.75rem',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.02)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
        >
          {collapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
          {!collapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
