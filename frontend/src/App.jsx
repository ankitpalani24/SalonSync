import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Bell } from 'lucide-react';

// Import components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Import Pages
import LandingPage from './pages/LandingPage';
import AuthPages from './pages/Auth/AuthPages';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Appointments from './pages/Appointments';
import Services from './pages/Services';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import Staff from './pages/Staff';
import Analytics from './pages/Analytics';
import Marketing from './pages/Marketing';
import SuperAdmin from './pages/Admin/SuperAdmin';

function App() {
  const { currentUser, logout, db } = useApp();
  const [activePage, setActivePage] = useState('landing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  // Transfer state for checking out appointments
  const [selectedApptForCheckout, setSelectedApptForCheckout] = useState(null);

  // Prevent main screen scroll when mobile sidebar is open or modal is active
  useEffect(() => {
    const checkScrollLock = () => {
      const hasModal = document.querySelector('.modal-backdrop-overlay');
      const appContainer = document.querySelector('.app-container');
      if (mobileSidebarOpen || hasModal) {
        document.body.classList.add('scroll-locked');
        document.documentElement.classList.add('scroll-locked');
        if (appContainer) appContainer.classList.add('scroll-locked');
      } else {
        document.body.classList.remove('scroll-locked');
        document.documentElement.classList.remove('scroll-locked');
        if (appContainer) appContainer.classList.remove('scroll-locked');
      }
    };

    checkScrollLock();

    const observer = new MutationObserver(checkScrollLock);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.body.classList.remove('scroll-locked');
      document.documentElement.classList.remove('scroll-locked');
      const appContainer = document.querySelector('.app-container');
      if (appContainer) appContainer.classList.remove('scroll-locked');
    };
  }, [mobileSidebarOpen]);

  // Sync active page with login status and check role permissions
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'SUPER_ADMIN') {
        if (activePage !== 'super-admin') {
          setActivePage('super-admin');
        }
      } else {
        const pagePermissions = {
          'dashboard': ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER', 'STAFF', 'CLIENT'],
          'customers': ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'],
          'appointments': ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER', 'STAFF', 'CLIENT'],
          'services': ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'],
          'billing': ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'],
          'inventory': ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'],
          'staff': ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER', 'STAFF'],
          'analytics': ['SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'],
          'marketing': ['SALON_OWNER', 'FRANCHISE_OWNER']
        };
        const allowedRoles = pagePermissions[activePage];
        if (activePage === 'super-admin' || (allowedRoles && !allowedRoles.includes(currentUser.role))) {
          setActivePage('dashboard');
        }
      }
    } else {
      if (activePage !== 'login' && activePage !== 'signup') {
        setActivePage('landing');
      }
    }
  }, [currentUser, activePage]);

  // Route Dispatcher
  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} />;
      case 'customers':
        return <Customers />;
      case 'appointments':
        return (
          <Appointments 
            setActivePage={setActivePage} 
            setSelectedApptForCheckout={setSelectedApptForCheckout} 
          />
        );
      case 'services':
        return <Services />;
      case 'billing':
        return (
          <Billing 
            apptForCheckout={selectedApptForCheckout} 
            clearApptCheckout={() => setSelectedApptForCheckout(null)} 
          />
        );
      case 'inventory':
        return <Inventory />;
      case 'staff':
        return <Staff />;
      case 'analytics':
        return <Analytics />;
      case 'marketing':
        return <Marketing />;
      case 'super-admin':
        return <SuperAdmin />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  };

  // 1. PUBLIC LANDING & AUTH VIEWS
  if (!currentUser) {
    if (activePage === 'login') {
      return (
        <AuthPages 
          defaultView="login" 
          onAuthSuccess={() => setActivePage('dashboard')} 
          onBackToLanding={() => setActivePage('landing')} 
        />
      );
    }
    if (activePage === 'signup') {
      return (
        <AuthPages 
          defaultView="signup" 
          onAuthSuccess={() => setActivePage('dashboard')} 
          onBackToLanding={() => setActivePage('landing')} 
        />
      );
    }
    return (
      <LandingPage 
        onStartTrial={() => setActivePage('signup')} 
        onLogin={() => setActivePage('login')} 
      />
    );
  }

  const notifications = db?.notifications && currentUser
    ? db.notifications.filter(n => n.salonId === currentUser.salonId).slice(0, 5)
    : [];

  // 2. INNER WORKSPACE WORKFLOW LAYOUT
  return (
    <div className="app-container">
      {/* Backdrop for mobile drawer */}
      {mobileSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)}></div>
      )}

      {/* Sidebar navigation wrapper */}
      <div className={`sidebar-container ${mobileSidebarOpen ? 'open' : ''}`}>
        <Sidebar 
          activePage={activePage} 
          setActivePage={(page) => {
            setActivePage(page);
            setMobileSidebarOpen(false); // Close drawer on menu click
          }} 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
          user={currentUser}
          logout={logout}
          closeMobileSidebar={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main workplace pane */}
      <div className="main-content" style={{ position: 'relative' }}>
        <Header toggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        
        {/* Render page */}
        <div style={{ flex: 1 }}>
          {renderActivePage()}
        </div>

        {/* Floating Notification Button & Dropdown Drawer */}
        {currentUser && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'var(--gold-primary)',
                color: '#000000',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(112, 130, 56, 0.4)',
                position: 'relative'
              }}
            >
              <Bell size={22} />
              {notifications.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: 'var(--accent-red)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
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
                bottom: '65px',
                right: 0,
                width: 'calc(100vw - 48px)',
                maxWidth: '320px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-premium)',
                padding: '1.25rem',
                zIndex: 10000
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
        )}
      </div>
    </div>
  );
}

export default App;
