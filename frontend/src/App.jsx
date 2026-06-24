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

  // Transfer state for checking out appointments
  const [selectedApptForCheckout, setSelectedApptForCheckout] = useState(null);

  // Sync active page with login status
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'Super Admin') {
        setActivePage('super-admin');
      } else {
        setActivePage('dashboard');
      }
    } else {
      setActivePage('landing');
    }
  }, [currentUser]);

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
      {/* Sidebar navigation */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        user={currentUser}
        logout={logout}
      />

      {/* Main workplace pane */}
      <div className="main-content">
        <Header />
        
        {/* Render page */}
        <div style={{ flex: 1 }}>
          {renderActivePage()}
        </div>
      </div>
    </div>
  );
}

export default App;
