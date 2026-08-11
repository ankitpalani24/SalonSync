import React, { createContext, useContext, useState, useEffect } from 'react';
import * as mockData from '../data/mockData';
import { API_URL } from '../config/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const safeParse = (str, fallback = null) => {
    if (!str || str === 'undefined') return fallback;
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error('Error parsing JSON from localStorage:', e);
      return fallback;
    }
  };

  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const local = localStorage.getItem('theme');
    return local ? local === 'dark' : true;
  });

  // Demo Mode state
  const demoMode = false;
  const setDemoMode = () => {};

  // Active tenant states
  const [currentUser, setCurrentUser] = useState(() => {
    return safeParse(localStorage.getItem('user'));
  });

  const [currentSalon, setCurrentSalon] = useState(() => {
    return safeParse(localStorage.getItem('salon'));
  });

  const [currentBranch, setCurrentBranch] = useState(() => {
    return safeParse(localStorage.getItem('branch'));
  });

  // DB collections state
  const [db, setDb] = useState(() => {
    const getLocal = (key, defaultVal) => {
      return safeParse(localStorage.getItem(key), defaultVal);
    };
    return {
      salons: getLocal('sf_salons', mockData.mockSalons),
      branches: getLocal('sf_branches', mockData.mockBranches),
      users: getLocal('sf_users', mockData.mockUsers),
      customers: getLocal('sf_customers', mockData.mockCustomers),
      services: getLocal('sf_services', mockData.mockServices),
      packages: getLocal('sf_packages', mockData.mockPackages),
      memberships: getLocal('sf_memberships', mockData.mockMemberships),
      staff: getLocal('sf_staff', mockData.mockStaff),
      products: getLocal('sf_products', mockData.mockProducts),
      suppliers: getLocal('sf_suppliers', mockData.mockSuppliers),
      expenses: getLocal('sf_expenses', mockData.mockExpenses),
      appointments: getLocal('sf_appointments', mockData.mockAppointments),
      invoices: getLocal('sf_invoices', mockData.mockInvoices),
      attendance: getLocal('sf_attendance', mockData.mockAttendance),
      commissions: getLocal('sf_commissions', mockData.mockCommissions),
      notifications: getLocal('sf_notifications', mockData.mockNotifications),
    };
  });

  // ── Toast Notification System ──
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration)
  };

  // Apply dark mode CSS classes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch public data for unauthenticated guests
  const syncPublicData = async () => {
    try {
      const [salonsRes, servicesRes] = await Promise.allSettled([
        fetch(`${API_URL}/salons`),
        fetch(`${API_URL}/public/services`)
      ]);
      
      let fetchedSalons = null;
      let fetchedServices = null;

      if (salonsRes.status === 'fulfilled') {
        const data = await salonsRes.value.json();
        if (data.success && Array.isArray(data.data)) fetchedSalons = data.data;
      }
      if (servicesRes.status === 'fulfilled') {
        const data = await servicesRes.value.json();
        if (data.success && Array.isArray(data.data)) fetchedServices = data.data;
      }

      if (fetchedSalons || fetchedServices) {
        setDb(prev => {
          const updated = {
            ...prev,
            salons: fetchedSalons || prev.salons,
            services: fetchedServices || prev.services
          };
          if (fetchedSalons) localStorage.setItem('sf_salons', JSON.stringify(fetchedSalons));
          if (fetchedServices) localStorage.setItem('sf_services', JSON.stringify(fetchedServices));
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to sync public backend data:', err);
    }
  };

  // Sync all collection data from backend DB
  const syncBackendData = async (token = localStorage.getItem('token'), user = currentUser) => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch active salon safely
      try {
        const salonRes = await fetch(`${API_URL}/salons/mine`, { headers });
        const salonData = await salonRes.json();
        if (salonData.success && salonData.data) {
          setCurrentSalon(salonData.data);
          localStorage.setItem('salon', JSON.stringify(salonData.data));
        }
      } catch (e) {
        console.warn('Could not fetch salon details:', e.message);
      }

      // Fetch branches safely
      let activeBranches = [];
      try {
        const branchRes = await fetch(`${API_URL}/branches`, { headers });
        const branchData = await branchRes.json();
        if (branchData.success && Array.isArray(branchData.data)) {
          activeBranches = branchData.data;
          const local = localStorage.getItem('branch');
          let validLocalBranch = null;

          if (local) {
            try {
              const parsed = safeParse(local);
              const userSalonId = user ? (typeof user.salonId === 'object' ? user.salonId?._id : user.salonId) : null;
              const branchSalonId = parsed ? (typeof parsed.salonId === 'object' ? parsed.salonId?._id : parsed.salonId) : null;
              
              if (userSalonId && String(branchSalonId) === String(userSalonId) && activeBranches.some(b => String(b._id) === String(parsed._id))) {
                validLocalBranch = parsed;
              }
            } catch (e) {
              console.error('Error parsing branch from localStorage:', e);
            }
          }

          if (validLocalBranch) {
            setCurrentBranch(validLocalBranch);
          } else {
            localStorage.removeItem('branch');
            const targetBranchId = user ? (typeof user.branchId === 'object' ? user.branchId?._id : user.branchId) : null;
            const userB = targetBranchId ? activeBranches.find(b => String(b._id) === String(targetBranchId)) : null;

            if (userB) {
              setCurrentBranch(userB);
              localStorage.setItem('branch', JSON.stringify(userB));
            } else if (activeBranches.length > 0) {
              setCurrentBranch(activeBranches[0]);
              localStorage.setItem('branch', JSON.stringify(activeBranches[0]));
            } else {
              setCurrentBranch(null);
            }
          }
        }
      } catch (e) {
        console.warn('Could not fetch branches:', e.message);
      }

      // Fetch other collections with Promise.allSettled for maximum fault tolerance
      const endpointKeys = [
        ['customers', 'sf_customers'],
        ['appointments', 'sf_appointments'],
        ['services', 'sf_services'],
        ['packages', 'sf_packages'],
        ['expenses', 'sf_expenses'],
        ['invoices', 'sf_invoices'],
        ['products', 'sf_products'],
        ['suppliers', 'sf_suppliers'],
        ['staff', 'sf_staff'],
        ['attendance', 'sf_attendance'],
        ['commissions', 'sf_commissions'],
        ['salons', 'sf_salons']
      ];

      const results = await Promise.allSettled(
        endpointKeys.map(([ep]) => fetch(`${API_URL}/${ep}`, { headers }).then(r => r.json()))
      );

      const updates = {};
      results.forEach((res, index) => {
        const [epKey, storageKey] = endpointKeys[index];
        if (res.status === 'fulfilled' && res.value && res.value.success && Array.isArray(res.value.data)) {
          updates[epKey] = res.value.data;
          localStorage.setItem(storageKey, JSON.stringify(res.value.data));
        }
      });

      if (activeBranches.length > 0) {
        updates['branches'] = activeBranches;
        localStorage.setItem('sf_branches', JSON.stringify(activeBranches));
      }

      setDb(prev => ({
        ...prev,
        ...updates
      }));
    } catch (err) {
      console.error('Failed to sync backend data:', err);
    }
  };

  // Sync on startup / mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && currentUser) {
      syncBackendData(token);
    } else {
      syncPublicData();
    }
  }, [currentUser]);

  // Auth Operations
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        await syncBackendData(data.token, data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: 'Failed to connect to API backend.' };
    }
  };

  const signup = async (payload) => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        await syncBackendData(data.token, data.user);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: 'Signup failed. API is offline.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentSalon(null);
    setCurrentBranch(null);
    localStorage.removeItem('user');
    localStorage.removeItem('salon');
    localStorage.removeItem('branch');
    localStorage.removeItem('token');
    [
      'sf_salons', 'sf_branches', 'sf_users', 'sf_customers', 
      'sf_services', 'sf_packages', 'sf_memberships', 'sf_staff', 
      'sf_products', 'sf_suppliers', 'sf_expenses', 'sf_appointments', 
      'sf_invoices', 'sf_attendance', 'sf_commissions', 'sf_notifications'
    ].forEach(k => localStorage.removeItem(k));
  };

  // Helper filter by tenant (salonId)
  const tenantFilter = (items) => {
    if (!items) return [];
    if (!currentUser || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'CLIENT') return items;
    let filtered = items.filter(item => {
      if (!item.salonId) return true; // Don't drop global / unpopulated records
      const itemSalonId = typeof item.salonId === 'object' ? item.salonId?._id : item.salonId;
      const userSalonId = typeof currentUser.salonId === 'object' ? currentUser.salonId?._id : currentUser.salonId;
      return String(itemSalonId) === String(userSalonId);
    });
    if (['SALON_MANAGER', 'STAFF'].includes(currentUser.role) && currentUser.branchId) {
      filtered = filtered.filter(item => {
        if (!item.branchId) return true; // global/salon-wide config
        const itemBranchId = typeof item.branchId === 'object' ? item.branchId?._id : item.branchId;
        const userBranchId = typeof currentUser.branchId === 'object' ? currentUser.branchId?._id : currentUser.branchId;
        return String(itemBranchId) === String(userBranchId);
      });
    }
    return filtered;
  };

  // ----------------------------------------------------
  // ENTITY OPERATIONS (LIVE DATABASE INTEGRATION)
  // ----------------------------------------------------

  const addCustomer = async (customer) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...customer,
          branchId: currentBranch ? currentBranch._id : null
        })
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);

        // Show login credentials if a new CLIENT user was auto-created
        if (data.clientCredentials) {
          addToast(`✅ Client account created!\nEmail: ${data.clientCredentials.email}\nPassword: ${data.clientCredentials.defaultPassword}`, 'success', 8000);
        } else {
          addToast('Customer added successfully!', 'success');
        }

        return data.data;
      }
    } catch (err) {
      console.error('Error adding customer:', err);
      addToast('Failed to add customer', 'error');
    }
  };

  const updateCustomer = async (id, updatedFields) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
        addToast('Customer updated successfully!', 'success');
        return data.data;
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      addToast('Failed to update customer', 'error');
    }
  };

  const deleteCustomer = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
        addToast('Customer deleted successfully!', 'info');
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      addToast('Failed to delete customer', 'error');
    }
  };

  const addAppointment = async (appt) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // CLIENT users supply their own salonId/branchId from the booking form.
      // Non-client users use currentBranch as the branchId fallback.
      const branchIdToUse = user.role === 'CLIENT'
        ? appt.branchId
        : (currentBranch ? currentBranch._id : appt.branchId);

      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...appt,
          branchId: branchIdToUse
        })
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
        return { success: true, data: data.data };
      } else {
        console.error('Appointment creation failed:', data.message);
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Error adding appointment:', err);
      return { success: false, message: 'Network error' };
    }
  };


  const updateAppointmentStatus = async (id, status) => {
    try {
      // Optimistic local update
      setDb(prev => ({
        ...prev,
        appointments: prev.appointments.map(a => a._id === id ? { ...a, status } : a)
      }));
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`${API_URL}/appointments/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (data.success) {
          await syncBackendData(token);
        }
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }
  };

  const updateAppointment = async (id, updatedFields) => {
    try {
      // Optimistic local update
      setDb(prev => {
        const updatedAppts = prev.appointments.map(a => a._id === id ? { ...a, ...updatedFields } : a);
        localStorage.setItem('sf_appointments', JSON.stringify(updatedAppts));
        return { ...prev, appointments: updatedAppts };
      });
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`${API_URL}/appointments/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedFields)
        });
        const data = await res.json();
        if (data.success) {
          await syncBackendData(token);
        }
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  };

  const addService = async (srv) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(srv)
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error adding service:', err);
    }
  };

  const addPackage = async (pkg) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pkg)
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error adding package:', err);
    }
  };

  const addExpense = async (exp) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...exp,
          branchId: currentBranch ? currentBranch._id : null
        })
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error adding expense:', err);
    }
  };

  const addProduct = async (prod) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(prod)
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  const updateProductQuantity = async (productId, delta) => {
    try {
      const token = localStorage.getItem('token');
      const matched = db.products.find(p => p._id === productId);
      if (!matched) return;
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: Math.max(0, matched.quantity + delta)
        })
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error updating product stock:', err);
    }
  };

  const addSupplier = async (supp) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(supp)
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error adding supplier:', err);
    }
  };

  const addStaff = async (member) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...member,
          branchId: currentBranch ? currentBranch._id : null
        })
      });
      const data = await res.json();
      if (data.success) {
        const creds = data.credentials || { email: member.email || `${member.phone}@salonsync.com`, password: member.password || 'password123' };
        addToast(`✅ Staff registered! Login Email/Phone: ${member.email || member.phone} | Password: ${creds.password}`, 'success', 10000);
        await syncBackendData(token);
        return data;
      }
    } catch (err) {
      console.error('Error adding staff:', err);
    }
  };

  const updateService = async (serviceId, updatedFields) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error updating service:', err);
    }
  };

  const updateStaff = async (staffId, updatedFields) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/staff/${staffId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error updating staff:', err);
    }
  };

  const updateProduct = async (productId, updatedFields) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  const clockInStaff = async (staffId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          staffId,
          action: 'clockin'
        })
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error clocking in:', err);
    }
  };

  const clockOutStaff = async (staffId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          staffId,
          action: 'clockout'
        })
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error clocking out:', err);
    }
  };

  const addNotification = (notif) => {
    // Left as client side logger simulator for SMS notification outbox
    const newNotif = {
      _id: `nt_${Date.now()}`,
      salonId: currentUser ? currentUser.salonId : null,
      sentAt: new Date().toISOString(),
      status: 'Sent',
      ...notif
    };
    setDb(prev => {
      const updatedNotifs = [newNotif, ...prev.notifications];
      localStorage.setItem('sf_notifications', JSON.stringify(updatedNotifs));
      return {
        ...prev,
        notifications: updatedNotifs
      };
    });
  };

  // POS Checkout Billing Generator
  const createInvoice = async (invoiceData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(invoiceData)
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
        return data.data;
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
    }
  };

  // Change Salon details (Owner Profile settings)
  const updateSalonDetails = async (updatedFields) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/salons/mine`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error updating salon details:', err);
    }
  };

  // Change active branch
  const switchBranch = (branchId) => {
    const branch = db.branches.find(b => b._id === branchId);
    if (branch) {
      setCurrentBranch(branch);
      localStorage.setItem('branch', JSON.stringify(branch));
    }
  };

  // Super Admin: Update subscription
  const updateSalonSubscription = async (salonId, plan, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/superadmin/salons/${salonId}/subscription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan, status })
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error updating subscription:', err);
    }
  };

  return (
    <AppContext.Provider value={{
      darkMode, setDarkMode,
      demoMode, setDemoMode,
      currentUser, setCurrentUser,
      currentSalon, setCurrentSalon,
      currentBranch, setCurrentBranch,
      db, setDb,
      login, signup, logout,
      tenantFilter,
      
      // CRM
      addCustomer, updateCustomer, deleteCustomer,
      // Bookings
      addAppointment, updateAppointmentStatus, updateAppointment,
      // Services & packages
      addService, updateService, addPackage,
      // Finance & Inventory
      addExpense, addProduct, updateProduct, updateProductQuantity, addSupplier, createInvoice,
      // HR
      addStaff, updateStaff, clockInStaff, clockOutStaff,
      // Configurations
      updateSalonDetails, switchBranch, updateSalonSubscription,
      // Marketing
      addNotification,
      // Toast
      addToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
