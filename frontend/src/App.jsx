import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useApp } from './context/AppContext';
import { Bell, LogOut, MapPin, Plus, Sparkles, Calendar, Users, CreditCard, DollarSign } from 'lucide-react';

// Import components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ToastContainer from './components/ToastContainer';
import CommandPalette from './components/CommandPalette';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';

// Eagerly loaded core views for instantaneous first paint
import LandingPage from './pages/LandingPage';
import AuthPages from './pages/Auth/AuthPages';
import Dashboard from './pages/Dashboard';

// Lazily loaded secondary feature views for optimal code-splitting and bundle size
const Customers = lazy(() => import('./pages/Customers'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Services = lazy(() => import('./pages/Services'));
const Billing = lazy(() => import('./pages/Billing'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Staff = lazy(() => import('./pages/Staff'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Marketing = lazy(() => import('./pages/Marketing'));
const Loyalty = lazy(() => import('./pages/Loyalty'));
const Memberships = lazy(() => import('./pages/Memberships'));
const PublicSalonProfile = lazy(() => import('./pages/PublicSalonProfile'));
const SalonDiscovery = lazy(() => import('./pages/SalonDiscovery'));
const SalonHealth = lazy(() => import('./pages/SalonHealth'));
const WhatsAppHub = lazy(() => import('./pages/WhatsAppHub'));
const NotificationCenter = lazy(() => import('./pages/NotificationCenter'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const RolePermissionMatrix = lazy(() => import('./pages/RolePermissionMatrix'));
const FranchiseOverview = lazy(() => import('./pages/FranchiseOverview'));
const SubscriptionBilling = lazy(() => import('./pages/SubscriptionBilling'));
const SuperAdmin = lazy(() => import('./pages/Admin/SuperAdmin'));

const PageLoadingFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ width: '36px', height: '36px', border: '3px solid rgba(112, 130, 56, 0.2)', borderTopColor: 'var(--gold-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading module...</span>
  </div>
);

function App() {
  const { currentUser, logout, db, currentBranch, currentSalon, hasPermission, PERMISSIONS } = useApp();

  const [activePage, setActivePage] = useState(() => {
    try {
      const user = localStorage.getItem('user');
      const saved = localStorage.getItem('salonsync_active_page');
      if (user && user !== 'null' && user !== 'undefined') {
        return saved || 'dashboard';
      }
      return 'landing';
    } catch {
      return 'landing';
    }
  });

  const handleNavigate = useCallback((page) => {
    setActivePage(page);
    try {
      localStorage.setItem('salonsync_active_page', page);
    } catch {}
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Splash Screen shown strictly once per day (not on every refresh)
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastShown = localStorage.getItem('salonsync_splash_shown_date');
      return lastShown !== todayStr;
    } catch {
      return false;
    }
  });

  const handleSplashFinish = useCallback(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem('salonsync_splash_shown_date', todayStr);
    } catch {}
    setShowSplash(false);
  }, []);

  // Global Ctrl + K Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll to top on page change and initial load/refresh
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
  }, [activePage]);

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
        if (activePage === 'landing' || activePage === 'login' || activePage === 'signup') {
          setActivePage('super-admin');
        }
      } else {
        const pagePermissionMap = {
          'dashboard': null,
          'notifications': null,
          'customers': PERMISSIONS.CUSTOMERS_VIEW,
          'appointments': PERMISSIONS.APPOINTMENTS_VIEW,
          'services': PERMISSIONS.INVENTORY_VIEW,
          'inventory': PERMISSIONS.INVENTORY_VIEW,
          'billing': PERMISSIONS.BILLING_VIEW,
          'expenses': PERMISSIONS.REPORTS_VIEW,
          'staff': PERMISSIONS.STAFF_VIEW,
          'analytics': PERMISSIONS.REPORTS_VIEW,
          'health': PERMISSIONS.REPORTS_VIEW,
          'whatsapp': PERMISSIONS.CUSTOMERS_VIEW,
          'loyalty': PERMISSIONS.CUSTOMERS_VIEW,
          'memberships': PERMISSIONS.CUSTOMERS_VIEW,
          'public-profile': null,
          'discovery': null,
          'audit-logs': PERMISSIONS.REPORTS_VIEW,
          'permissions': PERMISSIONS.REPORTS_VIEW,
          'franchise': PERMISSIONS.REPORTS_VIEW,
          'subscription': PERMISSIONS.REPORTS_VIEW,
          'marketing': null
        };
        const reqPerm = pagePermissionMap[activePage];
        if (activePage === 'landing' || activePage === 'login' || activePage === 'signup') {
          handleNavigate('dashboard');
        } else if (activePage === 'super-admin' || (reqPerm && !hasPermission(reqPerm))) {
          handleNavigate('dashboard');
        }
      }
    } else {
      if (activePage !== 'login' && activePage !== 'signup') {
        handleNavigate('landing');
      }
    }
  }, [currentUser, activePage]);

  // Route Dispatcher
  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={handleNavigate} />;
      case 'customers':
        return <Customers />;
      case 'appointments':
        return (
          <Appointments 
            setActivePage={handleNavigate} 
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
      case 'expenses':
        return <Expenses />;
      case 'staff':
        return <Staff />;
      case 'analytics':
        return <Analytics />;
      case 'health':
        return <SalonHealth setActivePage={handleNavigate} />;
      case 'whatsapp':
        return <WhatsAppHub />;
      case 'notifications':
        return <NotificationCenter />;
      case 'marketing':
        return <Marketing />;
      case 'loyalty':
        return <Loyalty />;
      case 'memberships':
        return <Memberships />;
      case 'public-profile':
        return <PublicSalonProfile setActivePage={handleNavigate} />;
      case 'discovery':
        return <SalonDiscovery setActivePage={handleNavigate} />;
      case 'audit-logs':
        return <AuditLogs />;
      case 'permissions':
        return <RolePermissionMatrix />;
      case 'franchise':
        return <FranchiseOverview setActivePage={handleNavigate} />;
      case 'subscription':
        return <SubscriptionBilling />;
      case 'super-admin':
        return <SuperAdmin />;
      default:
        return <Dashboard setActivePage={handleNavigate} />;
    }
  };

  // 1. PUBLIC LANDING & AUTH VIEWS
  if (!currentUser) {
    if (activePage === 'login') {
      return (
        <>
          {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
          <ToastContainer />
          <AuthPages 
            defaultView="login" 
            onAuthSuccess={() => handleNavigate('dashboard')} 
            onBackToLanding={() => handleNavigate('landing')} 
          />
        </>
      );
    }
    if (activePage === 'signup') {
      return (
        <>
          {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
          <ToastContainer />
          <AuthPages 
            defaultView="signup" 
            onAuthSuccess={() => handleNavigate('dashboard')} 
            onBackToLanding={() => handleNavigate('landing')} 
          />
        </>
      );
    }
    return (
      <>
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        <ToastContainer />
        <LandingPage 
          onStartTrial={() => handleNavigate('signup')} 
          onLogin={() => handleNavigate('login')} 
        />
      </>
    );
  }

  // Resolve client customer IDs for notification filtering
  const myCustomerIds = currentUser && currentUser.role === 'CLIENT'
    ? db.customers.filter(c => c.email === currentUser.email || (c.phone && c.phone === currentUser.phone)).map(c => String(c._id))
    : [];

  const notifications = db?.notifications && currentUser
    ? (currentUser.role === 'CLIENT'
        ? db.notifications.filter(n => myCustomerIds.includes(String(n.customerId)))
        : db.notifications.filter(n => n.salonId === currentUser.salonId && !n.customerId)
      ).slice(0, 5)
    : [];

  // 2. INNER WORKSPACE WORKFLOW LAYOUT
  return (
    <div className="app-container">
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <ToastContainer />
      {/* Backdrop for mobile drawer */}
      {mobileSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)}></div>
      )}

      {/* Sidebar navigation wrapper */}
      <div className={`sidebar-container ${mobileSidebarOpen ? 'open' : ''}`}>
        <Sidebar 
          activePage={activePage} 
          setActivePage={(page) => {
            handleNavigate(page);
            setMobileSidebarOpen(false); // Close drawer on menu click
          }} 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
          user={currentUser}
          logout={() => {
            try {
              localStorage.removeItem('salonsync_active_page');
            } catch {}
            logout();
            handleNavigate('landing');
          }}
          closeMobileSidebar={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        setActivePage={handleNavigate}
      />

      {/* Main workplace pane */}
      <div className="main-content" style={{ position: 'relative' }}>
        <Header 
          toggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
          onOpenProfile={() => setShowProfileModal(true)} 
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          setActivePage={handleNavigate}
        />
        
        {/* Render page */}
        <div style={{ flex: 1 }}>
          <ErrorBoundary onReset={() => handleNavigate('dashboard')}>
            <Suspense fallback={<PageLoadingFallback />}>
              {renderActivePage()}
            </Suspense>
          </ErrorBoundary>
        </div>


        {/* Profile Modal */}
        {showProfileModal && currentUser && (
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
                {currentUser.name ? currentUser.name[0] : 'U'}
              </div>
              
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{currentUser.name}</h3>
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
                  return rolesMap[currentUser.role] || currentUser.role;
                })()}
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <p><strong>Email Address:</strong> {currentUser.email}</p>
                <p><strong>Phone Number:</strong> {currentUser.phone || 'Not Provided'}</p>
                
                {currentUser.role !== 'SUPER_ADMIN' && currentSalon && (
                  <>
                    <p><strong>Associated Salon:</strong> {currentSalon.name}</p>
                    {currentBranch && <p><strong>Assigned Branch:</strong> {currentBranch.name} ({currentBranch.city})</p>}
                  </>
                )}

                {currentUser.role === 'CLIENT' && (
                  <div style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', padding: '0.75rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                    <p style={{ color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Loyalty & Rewards</p>
                    <p><strong>Membership Tier:</strong> <span className={`badge ${(db.customers.find(c => c.email === currentUser.email)?.membershipLevel || 'None').toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                      {db.customers.find(c => c.email === currentUser.email)?.membershipLevel || 'None'}
                    </span></p>
                    <p style={{ marginTop: '0.25rem' }}><strong>Accumulated Points:</strong> {db.customers.find(c => c.email === currentUser.email)?.loyaltyPoints || 0} Points</p>
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
      </div>
    </div>
  );
}

export default App;
