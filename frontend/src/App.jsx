import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';

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
  const { currentUser, logout } = useApp();
  const [activePage, setActivePage] = useState('landing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Transfer state for checking out appointments
  const [selectedApptForCheckout, setSelectedApptForCheckout] = useState(null);

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
        />
      </div>

      {/* Main workplace pane */}
      <div className="main-content">
        <Header toggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        
        {/* Render page */}
        <div style={{ flex: 1 }}>
          {renderActivePage()}
        </div>
      </div>
    </div>
  );
}

export default App;
