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

  // Theme state (Locked to Dark Mode)
  const darkMode = true;
  const setDarkMode = () => {};

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
      reviews: getLocal('sf_reviews', mockData.mockReviews),
      loyaltyRewards: getLocal('sf_loyalty_rewards', mockData.mockLoyaltyRewards),
      loyaltyRules: getLocal('sf_loyalty_rules', mockData.mockLoyaltyRules),
      loyaltyTransactions: getLocal('sf_loyalty_transactions', mockData.mockLoyaltyTransactions),
      customerMemberships: getLocal('sf_customer_memberships', mockData.mockCustomerMemberships),
      whatsAppConfig: getLocal('sf_whatsapp_config', mockData.mockWhatsAppConfig),
      whatsAppTemplates: getLocal('sf_whatsapp_templates', mockData.mockWhatsAppTemplates),
      notificationPrefs: getLocal('sf_notification_prefs', mockData.mockNotificationPrefs),
      auditLogs: getLocal('sf_audit_logs', mockData.mockAuditLogs),
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

  // Always enforce dark mode theme
  useEffect(() => {
    document.documentElement.classList.remove('light-mode');
    localStorage.setItem('theme', 'dark');
  }, []);

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
        ['salons', 'sf_salons'],
        ['inventory-consumptions', 'sf_inventory_consumptions']
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
    const cleanInput = (email || '').trim().toLowerCase();
    const cleanPhone = cleanInput.replace(/[\s+-]/g, '');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanInput, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        await syncBackendData(data.token, data.user);
        return { success: true, user: data.user };
      }
    } catch (err) {
      console.warn('Backend API connection failed, attempting local authentication fallback:', err.message);
    }

    // Fallback authentication against mockUsers / db.staff for offline or un-synced staff accounts
    const allUsers = [...(db.users || []), ...(mockData.mockUsers || [])];
    const foundUser = allUsers.find(u =>
      (u.email && u.email.toLowerCase() === cleanInput) ||
      (u.phone && u.phone.replace(/[\s+-]/g, '') === cleanPhone) ||
      (u.name && u.name.toLowerCase() === cleanInput)
    );

    const foundStaff = (db.staff || []).find(s =>
      (s.email && s.email.toLowerCase() === cleanInput) ||
      (s.phone && s.phone.replace(/[\s+-]/g, '') === cleanPhone) ||
      (s.name && s.name.toLowerCase() === cleanInput)
    );

    if (foundUser || foundStaff) {
      const userObj = foundUser ? {
        id: foundUser._id || foundUser.id,
        name: foundUser.name,
        email: foundUser.email || `${foundUser.phone}@salonsync.com`,
        phone: foundUser.phone,
        role: foundUser.role || 'STAFF',
        salonId: foundUser.salonId || 'salon_luxe_123',
        branchId: foundUser.branchId || 'branch_mumbai_1'
      } : {
        id: foundStaff._id,
        name: foundStaff.name,
        email: foundStaff.email || `${foundStaff.phone}@salonsync.com`,
        phone: foundStaff.phone,
        role: 'STAFF',
        salonId: foundStaff.salonId || 'salon_luxe_123',
        branchId: foundStaff.branchId || 'branch_mumbai_1'
      };

      const mockToken = 'mock_jwt_token_' + Date.now();
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(userObj));
      setCurrentUser(userObj);
      return { success: true, user: userObj };
    }

    return { success: false, message: 'Invalid email/phone or password.' };
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
      setDb(prev => {
        const targetAppt = prev.appointments.find(a => a._id === id);
        let updatedProducts = [...prev.products];
        let newConsumptions = [...(prev.inventoryConsumptions || [])];
        let wasDeducted = targetAppt?.inventoryDeducted || false;

        if (status === 'Completed' && targetAppt && !wasDeducted) {
          wasDeducted = true;
          const cust = (prev.customers || []).find(c => String(c._id) === String(targetAppt.customerId));
          const staff = (prev.staff || []).find(s => String(s._id) === String(targetAppt.staffId));
          const servIds = (targetAppt.services || []).map(s => s.serviceId).filter(Boolean);
          const populatedServices = (prev.services || []).filter(s => servIds.some(sid => String(sid) === String(s._id)));

          populatedServices.forEach(srv => {
            (srv.requiredProducts || []).forEach(reqProd => {
              if (reqProd.productId && reqProd.quantity > 0) {
                const prodIndex = updatedProducts.findIndex(p => String(p._id) === String(reqProd.productId));
                if (prodIndex !== -1) {
                  const prod = updatedProducts[prodIndex];
                  const newQty = Math.max(0, prod.quantity - reqProd.quantity);
                  updatedProducts[prodIndex] = { ...prod, quantity: newQty };

                  newConsumptions.unshift({
                    _id: 'cons_' + Date.now() + Math.random(),
                    salonId: targetAppt.salonId,
                    branchId: targetAppt.branchId,
                    productId: prod._id,
                    productName: prod.name,
                    quantityConsumed: reqProd.quantity,
                    unit: reqProd.unit || 'units',
                    serviceId: srv._id,
                    serviceName: srv.name,
                    customerId: targetAppt.customerId,
                    customerName: cust ? cust.name : 'Client',
                    staffId: targetAppt.staffId,
                    staffName: staff ? staff.name : 'Staff',
                    appointmentId: targetAppt._id,
                    date: new Date().toISOString()
                  });
                }
              }
            });
          });
        }

        const updatedAppts = prev.appointments.map(a => a._id === id ? { ...a, status, inventoryDeducted: wasDeducted } : a);
        localStorage.setItem('sf_appointments', JSON.stringify(updatedAppts));
        localStorage.setItem('sf_products', JSON.stringify(updatedProducts));
        localStorage.setItem('sf_inventory_consumptions', JSON.stringify(newConsumptions));

        return {
          ...prev,
          appointments: updatedAppts,
          products: updatedProducts,
          inventoryConsumptions: newConsumptions
        };
      });

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
      const newExp = {
        _id: 'exp_' + Date.now() + Math.random(),
        ...exp,
        salonId: currentUser?.salonId || 'salon_luxe_123',
        branchId: exp.branchId || (currentBranch ? currentBranch._id : 'branch_mumbai_1'),
        createdBy: currentUser?.name || 'Manager',
        createdAt: exp.date || new Date().toISOString()
      };

      setDb(prev => {
        const updatedExp = [newExp, ...(prev.expenses || [])];
        localStorage.setItem('sf_expenses', JSON.stringify(updatedExp));
        return { ...prev, expenses: updatedExp };
      });

      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`${API_URL}/expenses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(exp)
        });
        const data = await res.json();
        if (data.success) {
          await syncBackendData(token);
        }
      }
    } catch (err) {
      console.error('Error adding expense:', err);
    }
  };

  const fetchFinancialAnalytics = async (horizon = 'monthly', branchId = null) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        let queryStr = `horizon=${horizon}`;
        if (branchId) queryStr += `&branchId=${branchId}`;
        const res = await fetch(`${API_URL}/analytics/financial-summary?${queryStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch (err) {
      console.warn('Backend analytics API failed:', err.message);
    }
    return null;
  };

  const updateExpense = async (id, updatedFields) => {
    try {
      setDb(prev => {
        const updatedExp = (prev.expenses || []).map(e => e._id === id ? { ...e, ...updatedFields } : e);
        localStorage.setItem('sf_expenses', JSON.stringify(updatedExp));
        return { ...prev, expenses: updatedExp };
      });

      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`${API_URL}/expenses/${id}`, {
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
      console.error('Error updating expense:', err);
    }
  };

  const deleteExpense = async (id) => {
    try {
      setDb(prev => {
        const updatedExp = (prev.expenses || []).filter(e => e._id !== id);
        localStorage.setItem('sf_expenses', JSON.stringify(updatedExp));
        return { ...prev, expenses: updatedExp };
      });

      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`${API_URL}/expenses/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          await syncBackendData(token);
        }
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
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
      const newStaff = {
        _id: 'staff_' + Date.now() + Math.random().toString(36).substring(2, 6),
        salonId: currentUser?.salonId || 'salon_luxe_123',
        branchId: currentBranch ? currentBranch._id : 'branch_mumbai_1',
        name: member.name,
        phone: member.phone,
        email: member.email || `${member.phone}@salonsync.com`,
        role: member.role || 'Stylist',
        salary: Number(member.salary) || 0,
        commissionPercentage: Number(member.commissionPercentage) || 10,
        rating: 5.0,
        specialization: member.specialization || [],
        services: member.services || [],
        experienceYears: Number(member.experienceYears) || 3,
        experienceLevel: member.experienceLevel || 'Senior Specialist',
        bio: member.bio || '',
        avatar: member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        status: member.status || 'Active'
      };

      setDb(prev => {
        const updatedStaff = [newStaff, ...(prev.staff || [])];
        localStorage.setItem('sf_staff', JSON.stringify(updatedStaff));
        return { ...prev, staff: updatedStaff };
      });

      const token = localStorage.getItem('token');
      if (token) {
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
      }
    } catch (err) {
      console.error('Error adding staff:', err);
    }
  };

  const updateStaff = async (staffId, updatedFields) => {
    try {
      setDb(prev => {
        const updatedStaff = (prev.staff || []).map(s => String(s._id) === String(staffId) ? { ...s, ...updatedFields } : s);
        localStorage.setItem('sf_staff', JSON.stringify(updatedStaff));
        return { ...prev, staff: updatedStaff };
      });

      const token = localStorage.getItem('token');
      if (token) {
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
      }
    } catch (err) {
      console.error('Error updating staff:', err);
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

  const addReview = async (reviewData) => {
    try {
      const newRev = {
        _id: 'rev_' + Date.now() + Math.random().toString(36).substring(2, 6),
        salonId: currentUser?.salonId || 'salon_luxe_123',
        staffId: reviewData.staffId,
        customerId: reviewData.customerId || null,
        customerName: reviewData.customerName || 'Valued Client',
        serviceName: reviewData.serviceName || 'Salon Service',
        rating: Number(reviewData.rating) || 5,
        comment: reviewData.comment || '',
        date: new Date().toISOString().split('T')[0]
      };

      setDb(prev => {
        const updatedReviews = [newRev, ...(prev.reviews || [])];
        localStorage.setItem('sf_reviews', JSON.stringify(updatedReviews));

        // Update staff average rating optimistically
        let updatedStaff = prev.staff;
        if (reviewData.staffId) {
          const staffRevs = updatedReviews.filter(r => String(r.staffId) === String(reviewData.staffId));
          const avg = staffRevs.length > 0
            ? Math.round((staffRevs.reduce((sum, r) => sum + r.rating, 0) / staffRevs.length) * 10) / 10
            : 5.0;
          updatedStaff = (prev.staff || []).map(s => String(s._id) === String(reviewData.staffId) ? { ...s, rating: avg } : s);
          localStorage.setItem('sf_staff', JSON.stringify(updatedStaff));
        }

        return { ...prev, reviews: updatedReviews, staff: updatedStaff };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(reviewData)
        });
      }
      addToast('Customer review submitted successfully!', 'success');
    } catch (err) {
      console.error('Error adding review:', err);
    }
  };

  const canViewStaffSalary = (staffMemberOrId) => {
    if (!currentUser) return false;
    const managerRoles = ['SUPER_ADMIN', 'SALON_OWNER', 'SALON_MANAGER', 'FRANCHISE_OWNER'];
    if (managerRoles.includes(currentUser.role)) return true;

    const staffId = typeof staffMemberOrId === 'object' ? staffMemberOrId?._id : staffMemberOrId;
    const myStaffRecord = (db.staff || []).find(s => 
      String(s.userId) === String(currentUser._id) ||
      (s.phone && currentUser?.phone && s.phone.replace(/[\s+-]/g, '').endsWith(currentUser?.phone.replace(/[\s+-]/g, '').slice(-10))) ||
      (s.email && currentUser?.email && s.email.toLowerCase() === currentUser?.email.toLowerCase()) ||
      (s.name && currentUser?.name && s.name.toLowerCase() === currentUser?.name.toLowerCase())
    );
    return myStaffRecord && String(myStaffRecord._id) === String(staffId);
  };

  const getStaffPerformanceMetrics = (staffId, timeFilter = 'all') => {
    const staffMember = (db.staff || []).find(s => String(s._id) === String(staffId));
    if (!staffMember) return null;

    const now = new Date();
    let startDate = null;
    if (timeFilter === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeFilter === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (timeFilter === 'this_year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const filterByDate = (dateStr) => {
      if (!startDate || !dateStr) return true;
      const d = new Date(dateStr);
      if (timeFilter === 'last_month') {
        const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        return d >= startDate && d <= endDate;
      }
      return d >= startDate;
    };

    // Completed appointments
    const staffAppts = (db.appointments || []).filter(a => 
      String(a.staffId) === String(staffId) && 
      filterByDate(a.date)
    );
    const completedAppts = staffAppts.filter(a => a.status === 'Completed');
    const servicesCompletedCount = completedAppts.reduce((sum, a) => sum + (a.services?.length || 1), 0);

    // Invoices & Revenue
    const staffInvoices = (db.invoices || []).filter(inv => 
      String(inv.staffId) === String(staffId) && 
      filterByDate(inv.createdAt || inv.date)
    );
    const totalRevenue = staffInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);

    // Commissions
    const staffCommissions = (db.commissions || []).filter(c => 
      String(c.staffId) === String(staffId) && 
      filterByDate(c.date || c.createdAt)
    );
    const totalCommission = staffCommissions.reduce((sum, c) => sum + (c.commissionEarned || 0), 0);

    // Customer Retention & Repeat Customers
    const customerApptsMap = {};
    completedAppts.forEach(a => {
      if (a.customerId) {
        customerApptsMap[a.customerId] = (customerApptsMap[a.customerId] || 0) + 1;
      }
    });
    staffInvoices.forEach(inv => {
      if (inv.customerId) {
        const key = typeof inv.customerId === 'object' ? inv.customerId._id : inv.customerId;
        customerApptsMap[key] = (customerApptsMap[key] || 1);
      }
    });

    const uniqueCustomersCount = Object.keys(customerApptsMap).length;
    const repeatCustomersCount = Object.values(customerApptsMap).filter(count => count > 1).length;
    const repeatRate = uniqueCustomersCount > 0 ? Math.round((repeatCustomersCount / uniqueCustomersCount) * 100) : 0;

    // Reviews & Star Rating
    const staffReviews = (db.reviews || []).filter(r => 
      String(r.staffId) === String(staffId) && 
      filterByDate(r.date)
    );
    const avgRating = staffReviews.length > 0
      ? Math.round((staffReviews.reduce((sum, r) => sum + r.rating, 0) / staffReviews.length) * 10) / 10
      : (staffMember.rating || 5.0);

    // Attendance
    const staffAttendance = (db.attendance || []).filter(att => {
      const attStaffId = typeof att.staffId === 'object' ? att.staffId._id : att.staffId;
      return String(attStaffId) === String(staffId) && filterByDate(att.date);
    });
    const totalDaysTracked = Math.max(1, staffAttendance.length);
    const presentDays = staffAttendance.filter(att => att.checkIn).length;
    const attendanceRate = Math.min(100, Math.round((presentDays / totalDaysTracked) * 100));

    // Performance Score (0-100)
    const ratingScore = (avgRating / 5) * 100;
    const volumeScore = Math.min(100, (servicesCompletedCount / 5) * 100);
    const performanceScore = Math.min(100, Math.round(
      (ratingScore * 0.35) + 
      (attendanceRate * 0.25) + 
      (repeatRate * 0.20) + 
      (volumeScore * 0.20)
    ));

    return {
      staffMember,
      totalRevenue,
      servicesCompletedCount,
      uniqueCustomersCount,
      repeatCustomersCount,
      repeatRate,
      avgRating,
      reviewCount: staffReviews.length,
      totalCommission,
      attendanceRate,
      presentDays,
      totalDaysTracked,
      performanceScore,
      appointments: staffAppts,
      invoices: staffInvoices,
      reviews: staffReviews
    };
  };

  // ── Loyalty Rewards System ──
  const updateLoyaltyRules = async (newRules) => {
    try {
      setDb(prev => {
        const updatedRules = { ...(prev.loyaltyRules || mockData.mockLoyaltyRules), ...newRules };
        localStorage.setItem('sf_loyalty_rules', JSON.stringify(updatedRules));
        return { ...prev, loyaltyRules: updatedRules };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/loyalty/rules`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newRules)
        });
      }
      addToast('Loyalty earning & redemption rules updated!', 'success');
    } catch (err) {
      console.error('Error updating loyalty rules:', err);
    }
  };

  const addLoyaltyReward = async (rewardData) => {
    try {
      const newRwd = {
        _id: 'rwd_' + Date.now() + Math.random().toString(36).substring(2, 6),
        salonId: currentUser?.salonId || 'salon_luxe_123',
        name: rewardData.name,
        type: rewardData.type || 'Discount',
        pointsCost: Number(rewardData.pointsCost) || 200,
        discountValue: Number(rewardData.discountValue) || 0,
        description: rewardData.description || '',
        expiryDays: Number(rewardData.expiryDays) || 30,
        active: true
      };

      setDb(prev => {
        const updatedRwds = [newRwd, ...(prev.loyaltyRewards || [])];
        localStorage.setItem('sf_loyalty_rewards', JSON.stringify(updatedRwds));
        return { ...prev, loyaltyRewards: updatedRwds };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/loyalty/rewards`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(rewardData)
        });
      }
      addToast('New loyalty reward option added to catalogue!', 'success');
    } catch (err) {
      console.error('Error adding loyalty reward:', err);
    }
  };

  const updateLoyaltyReward = async (id, updatedFields) => {
    try {
      setDb(prev => {
        const updatedRwds = (prev.loyaltyRewards || []).map(r => String(r._id) === String(id) ? { ...r, ...updatedFields } : r);
        localStorage.setItem('sf_loyalty_rewards', JSON.stringify(updatedRwds));
        return { ...prev, loyaltyRewards: updatedRwds };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/loyalty/rewards/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedFields)
        });
      }
      addToast('Loyalty reward item updated!', 'info');
    } catch (err) {
      console.error('Error updating loyalty reward:', err);
    }
  };

  const deleteLoyaltyReward = async (id) => {
    try {
      setDb(prev => {
        const updatedRwds = (prev.loyaltyRewards || []).filter(r => String(r._id) !== String(id));
        localStorage.setItem('sf_loyalty_rewards', JSON.stringify(updatedRwds));
        return { ...prev, loyaltyRewards: updatedRwds };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/loyalty/rewards/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      addToast('Loyalty reward option removed.', 'info');
    } catch (err) {
      console.error('Error deleting loyalty reward:', err);
    }
  };

  const redeemLoyaltyReward = async ({ customerId, rewardId, pointsToRedeem, idempotencyKey }) => {
    try {
      const customer = (db.customers || []).find(c => String(c._id) === String(customerId));
      if (!customer) {
        addToast('Customer record not found!', 'error');
        return { success: false, message: 'Customer record not found!' };
      }

      const reward = rewardId ? (db.loyaltyRewards || []).find(r => String(r._id) === String(rewardId)) : null;
      const requiredPts = reward ? reward.pointsCost : Math.max(1, Number(pointsToRedeem) || 0);
      const rewardName = reward ? reward.name : 'Points Redemption';

      // Anti-fraud balance check
      if ((customer.loyaltyPoints || 0) < requiredPts) {
        addToast(`Insufficient point balance! Customer has ${customer.loyaltyPoints || 0} pts, but redemption requires ${requiredPts} pts.`, 'error');
        return { success: false, message: 'Insufficient points balance' };
      }

      const key = idempotencyKey || `redeem_${customerId}_${Date.now()}`;
      const existingTx = (db.loyaltyTransactions || []).find(t => t.idempotencyKey === key);
      if (existingTx) {
        addToast('This redemption transaction has already been processed.', 'warning');
        return { success: false, message: 'Duplicate redemption' };
      }

      const newBal = (customer.loyaltyPoints || 0) - requiredPts;
      const newTx = {
        _id: 'tx_' + Date.now() + Math.random().toString(36).substring(2, 6),
        salonId: currentUser?.salonId || 'salon_luxe_123',
        customerId: customer._id,
        type: 'Redeemed',
        points: -requiredPts,
        pointsRedeemed: requiredPts,
        balanceAfter: newBal,
        rewardId: reward ? reward._id : null,
        description: `Redeemed reward "${rewardName}" (-${requiredPts} pts)`,
        idempotencyKey: key,
        date: new Date().toISOString()
      };

      setDb(prev => {
        const updatedCusts = (prev.customers || []).map(c => 
          String(c._id) === String(customerId)
            ? { 
                ...c, 
                loyaltyPoints: newBal,
                totalPointsRedeemed: (c.totalPointsRedeemed || 0) + requiredPts 
              }
            : c
        );
        const updatedTxs = [newTx, ...(prev.loyaltyTransactions || [])];

        localStorage.setItem('sf_customers', JSON.stringify(updatedCusts));
        localStorage.setItem('sf_loyalty_transactions', JSON.stringify(updatedTxs));

        return {
          ...prev,
          customers: updatedCusts,
          loyaltyTransactions: updatedTxs
        };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/loyalty/redeem`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ customerId, rewardId, pointsToRedeem, idempotencyKey: key })
        });
      }

      addToast(`🎉 Reward "${rewardName}" redeemed successfully! Balance: ${newBal} pts`, 'success');
      return { success: true, remainingPoints: newBal, reward };
    } catch (err) {
      console.error('Error redeeming loyalty reward:', err);
      return { success: false, message: err.message };
    }
  };

  const getLoyaltySummary = (customerId) => {
    const customer = (db.customers || []).find(c => String(c._id) === String(customerId));
    if (!customer) return null;

    const custTxs = (db.loyaltyTransactions || []).filter(t => {
      const cid = typeof t.customerId === 'object' ? t.customerId._id : t.customerId;
      return String(cid) === String(customerId);
    });

    const activeRewards = (db.loyaltyRewards || []).filter(r => r.active);
    const balance = customer.loyaltyPoints || 0;
    const totalEarned = custTxs.filter(t => t.type === 'Earned').reduce((sum, t) => sum + (t.pointsEarned || t.points || 0), 0);
    const totalRedeemed = custTxs.filter(t => t.type === 'Redeemed').reduce((sum, t) => sum + Math.abs(t.pointsRedeemed || t.points || 0), 0);
    const totalExpired = custTxs.filter(t => t.type === 'Expired').reduce((sum, t) => sum + Math.abs(t.points || 0), 0);

    // Find next available reward target
    const sortedRewards = [...activeRewards].sort((a, b) => a.pointsCost - b.pointsCost);
    const nextReward = sortedRewards.find(r => r.pointsCost > balance) || sortedRewards[sortedRewards.length - 1];
    const targetPoints = nextReward ? nextReward.pointsCost : 500;
    const progressPercent = Math.min(100, Math.round((balance / targetPoints) * 100));

    return {
      customer,
      balance,
      totalEarned,
      totalRedeemed,
      totalExpired,
      nextReward,
      targetPoints,
      progressPercent,
      transactions: custTxs,
      availableRewards: activeRewards
    };
  };

  // ── Salon Membership System ──
  const addMembershipPlan = async (planData) => {
    try {
      const newPlan = {
        _id: 'm_' + Date.now() + Math.random().toString(36).substring(2, 6),
        salonId: currentUser?.salonId || 'salon_luxe_123',
        name: planData.name,
        tier: planData.tier || 'Gold',
        discountPercentage: Number(planData.discountPercentage) || 15,
        price: Number(planData.price) || 10000,
        validityMonths: Number(planData.validityMonths) || 12,
        includedServices: planData.includedServices || [],
        priorityBooking: planData.priorityBooking !== false,
        loyaltyMultiplier: Number(planData.loyaltyMultiplier) || 1.5,
        specialOffers: planData.specialOffers || [],
        description: planData.description || '',
        active: true
      };

      setDb(prev => {
        const updatedPlans = [newPlan, ...(prev.memberships || [])];
        localStorage.setItem('sf_memberships', JSON.stringify(updatedPlans));
        return { ...prev, memberships: updatedPlans };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/memberships`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(planData)
        });
      }
      addToast(`New Membership Plan "${planData.name}" created!`, 'success');
    } catch (err) {
      console.error('Error adding membership plan:', err);
    }
  };

  const updateMembershipPlan = async (id, updatedFields) => {
    try {
      setDb(prev => {
        const updatedPlans = (prev.memberships || []).map(p => String(p._id) === String(id) ? { ...p, ...updatedFields } : p);
        localStorage.setItem('sf_memberships', JSON.stringify(updatedPlans));
        return { ...prev, memberships: updatedPlans };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/memberships/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedFields)
        });
      }
      addToast('Membership plan updated!', 'info');
    } catch (err) {
      console.error('Error updating membership plan:', err);
    }
  };

  const deleteMembershipPlan = async (id) => {
    try {
      setDb(prev => {
        const updatedPlans = (prev.memberships || []).filter(p => String(p._id) !== String(id));
        localStorage.setItem('sf_memberships', JSON.stringify(updatedPlans));
        return { ...prev, memberships: updatedPlans };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/memberships/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      addToast('Membership plan removed.', 'info');
    } catch (err) {
      console.error('Error deleting membership plan:', err);
    }
  };

  const subscribeCustomerMembership = async ({ customerId, membershipPlanId, startDate }) => {
    try {
      const plan = (db.memberships || []).find(m => String(m._id) === String(membershipPlanId));
      if (!plan) {
        addToast('Selected membership plan not found.', 'error');
        return { success: false };
      }

      const start = startDate ? new Date(startDate) : new Date();
      const expiry = new Date(start);
      expiry.setMonth(expiry.getMonth() + (plan.validityMonths || 12));

      const benefits = (plan.includedServices || []).map(srv => ({
        serviceId: srv.serviceId,
        serviceName: srv.name,
        sessionsUsed: 0,
        totalSessions: srv.sessionsCount || 1
      }));

      const newSub = {
        _id: 'csub_' + Date.now() + Math.random().toString(36).substring(2, 6),
        salonId: currentUser?.salonId || 'salon_luxe_123',
        customerId,
        membershipPlanId: plan._id,
        tier: plan.tier || plan.name,
        startDate: start.toISOString().split('T')[0],
        expiryDate: expiry.toISOString().split('T')[0],
        status: 'Active',
        pricePaid: plan.price,
        discountPercentage: plan.discountPercentage,
        benefitsUsed: benefits,
        history: [
          { date: new Date().toISOString().split('T')[0], action: 'Subscribed', details: `Subscribed to ${plan.name} for ₹${plan.price}` }
        ],
        expiryNotified: false
      };

      setDb(prev => {
        const updatedSubs = [newSub, ...(prev.customerMemberships || [])];
        const updatedCusts = (prev.customers || []).map(c => String(c._id) === String(customerId) ? { ...c, membershipLevel: plan.tier || plan.name } : c);

        localStorage.setItem('sf_customer_memberships', JSON.stringify(updatedSubs));
        localStorage.setItem('sf_customers', JSON.stringify(updatedCusts));

        return {
          ...prev,
          customerMemberships: updatedSubs,
          customers: updatedCusts
        };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/customer-memberships`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ customerId, membershipPlanId, startDate })
        });
      }

      addToast(`🎉 Customer subscribed to ${plan.name}! Valid until ${expiry.toISOString().split('T')[0]}`, 'success');
      return { success: true, subscription: newSub };
    } catch (err) {
      console.error('Error subscribing customer membership:', err);
      return { success: false, message: err.message };
    }
  };

  const redeemMembershipBenefit = async ({ subscriptionId, serviceId }) => {
    try {
      const sub = (db.customerMemberships || []).find(s => String(s._id) === String(subscriptionId));
      if (!sub) return { success: false, message: 'Subscription not found' };

      const benefitIndex = (sub.benefitsUsed || []).findIndex(b => String(b.serviceId) === String(serviceId));
      if (benefitIndex === -1) {
        addToast('Selected service benefit is not included in this plan.', 'error');
        return { success: false };
      }

      const benefit = sub.benefitsUsed[benefitIndex];
      if (benefit.sessionsUsed >= benefit.totalSessions) {
        addToast(`All ${benefit.totalSessions} sessions of ${benefit.serviceName} have already been used.`, 'warning');
        return { success: false };
      }

      const updatedBenefits = [...sub.benefitsUsed];
      updatedBenefits[benefitIndex] = {
        ...benefit,
        sessionsUsed: benefit.sessionsUsed + 1
      };

      const updatedHistory = [
        ...(sub.history || []),
        { date: new Date().toISOString().split('T')[0], action: 'Benefit Used', details: `Redeemed 1 session of ${benefit.serviceName} (${benefit.sessionsUsed + 1}/${benefit.totalSessions} used)` }
      ];

      setDb(prev => {
        const updatedSubs = (prev.customerMemberships || []).map(s => String(s._id) === String(subscriptionId) ? { ...s, benefitsUsed: updatedBenefits, history: updatedHistory } : s);
        localStorage.setItem('sf_customer_memberships', JSON.stringify(updatedSubs));
        return { ...prev, customerMemberships: updatedSubs };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/customer-memberships/${subscriptionId}/redeem-benefit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ serviceId })
        });
      }

      addToast(`Redeemed 1 session of ${benefit.serviceName}! Remaining: ${benefit.totalSessions - (benefit.sessionsUsed + 1)}`, 'success');
      return { success: true };
    } catch (err) {
      console.error('Error redeeming membership benefit:', err);
      return { success: false, message: err.message };
    }
  };

  const triggerMembershipExpiryNotifications = async () => {
    try {
      const now = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(now.getDate() + 30);

      const expiringSubs = (db.customerMemberships || []).filter(sub => {
        if (sub.status === 'Cancelled' || sub.expiryNotified) return false;
        const exp = new Date(sub.expiryDate);
        return exp <= thirtyDaysLater;
      });

      const newNotifs = [];
      const updatedSubIds = [];

      expiringSubs.forEach(sub => {
        const cust = (db.customers || []).find(c => String(c._id) === String(sub.customerId));
        if (cust) {
          newNotifs.push({
            _id: 'nt_' + Date.now() + Math.random().toString(36).substring(2, 6),
            salonId: currentUser?.salonId || 'salon_luxe_123',
            customerId: cust._id,
            type: 'WhatsApp',
            message: `Dear ${cust.name}, your SalonSync ${sub.tier} Membership expires on ${sub.expiryDate}. Renew today to keep enjoying ${sub.discountPercentage}% discounts!`,
            status: 'Sent',
            sentAt: new Date().toISOString()
          });
          updatedSubIds.push(sub._id);
        }
      });

      if (newNotifs.length > 0) {
        setDb(prev => {
          const updatedNotifsList = [...newNotifs, ...(prev.notifications || [])];
          const updatedSubsList = (prev.customerMemberships || []).map(s => updatedSubIds.includes(s._id) ? { ...s, status: 'Expiring Soon', expiryNotified: true } : s);
          localStorage.setItem('sf_notifications', JSON.stringify(updatedNotifsList));
          localStorage.setItem('sf_customer_memberships', JSON.stringify(updatedSubsList));
          return { ...prev, notifications: updatedNotifsList, customerMemberships: updatedSubsList };
        });

        addToast(`📢 Sent expiry reminder notifications to ${newNotifs.length} member(s)!`, 'success');
      } else {
        addToast('No memberships expiring within the next 30 days requiring notification.', 'info');
      }

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/customer-memberships/check-expiries`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Error triggering expiry notifications:', err);
    }
  };

  const getCustomerMembershipSummary = (customerId) => {
    const customer = (db.customers || []).find(c => String(c._id) === String(customerId));
    if (!customer) return null;

    const subscription = (db.customerMemberships || []).find(sub => {
      const cid = typeof sub.customerId === 'object' ? sub.customerId._id : sub.customerId;
      return String(cid) === String(customerId) && (sub.status === 'Active' || sub.status === 'Expiring Soon');
    }) || (db.customerMemberships || []).find(sub => {
      const cid = typeof sub.customerId === 'object' ? sub.customerId._id : sub.customerId;
      return String(cid) === String(customerId);
    });

    const activePlan = subscription ? (db.memberships || []).find(m => String(m._id) === String(subscription.membershipPlanId)) : null;

    return {
      customer,
      subscription,
      activePlan,
      tier: subscription ? subscription.tier : 'None',
      discountPercentage: subscription ? subscription.discountPercentage : 0,
      expiryDate: subscription ? subscription.expiryDate : null,
      startDate: subscription ? subscription.startDate : null,
      benefitsUsed: subscription ? subscription.benefitsUsed || [] : [],
      history: subscription ? subscription.history || [] : []
    };
  };

  const getPublicSalonProfile = (identifier = 'luxe-salon-spa-mumbai') => {
    const salon = (db.salons || mockData.mockSalons).find(s => s.slug === identifier || String(s._id) === String(identifier)) || (db.salons || mockData.mockSalons)[0];
    const services = (db.services || mockData.mockServices).filter(s => String(s.salonId) === String(salon._id) || !s.salonId);
    
    // Privacy: sanitize staff (NO salary, NO phone, NO email)
    const staff = (db.staff || mockData.mockStaff)
      .filter(st => String(st.salonId) === String(salon._id) || !st.salonId)
      .map(st => ({
        _id: st._id,
        name: st.name,
        specializations: st.specializations || [st.role],
        experience: st.experience || '5+ Years',
        rating: st.rating || 4.9,
        avatar: st.avatar,
        bio: st.bio
      }));

    // Privacy: sanitize reviews (NO customer phone/email)
    const reviews = (db.reviews || mockData.mockReviews)
      .filter(r => String(r.salonId) === String(salon._id) || !r.salonId)
      .map(r => ({
        _id: r._id,
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment,
        date: r.date,
        serviceName: r.serviceName
      }));

    const packages = (db.packages || mockData.mockPackages).filter(pkg => String(pkg.salonId) === String(salon._id) || !pkg.salonId);

    return {
      salon,
      services,
      staff,
      reviews,
      packages
    };
  };

  const discoverSalons = ({ search = '', city = 'ALL', serviceCategory = 'ALL', minRating = 0, maxPrice = 10000, openOnly = false, sortBy = 'rating' }) => {
    let salons = [...(db.salons || mockData.mockSalons)];

    if (city && city !== 'ALL') {
      salons = salons.filter(s => (s.city || '').toLowerCase().includes(city.toLowerCase()));
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      salons = salons.filter(s => 
        (s.name || '').toLowerCase().includes(q) ||
        (s.locality || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.address || '').toLowerCase().includes(q) ||
        (s.popularServices || []).some(srv => srv.toLowerCase().includes(q))
      );
    }

    if (minRating > 0) {
      salons = salons.filter(s => (s.rating || 0) >= Number(minRating));
    }

    if (maxPrice > 0) {
      salons = salons.filter(s => (s.startingPrice || 0) <= Number(maxPrice));
    }

    if (sortBy === 'rating') {
      salons.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'price_asc') {
      salons.sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0));
    } else if (sortBy === 'price_desc') {
      salons.sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0));
    } else if (sortBy === 'reviews') {
      salons.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
    }

    return salons;
  };

  const calculateSalonHealthScore = () => {
    const invoices = tenantFilter(db.invoices || []);
    const expenses = tenantFilter(db.expenses || []);
    const customers = tenantFilter(db.customers || []);
    const staffList = tenantFilter(db.staff || []);
    const reviewsList = tenantFilter(db.reviews || []);
    const productsList = tenantFilter(db.products || []);
    const appointmentsList = tenantFilter(db.appointments || []);

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMarginPercent = totalRevenue > 0 ? Math.max(0, Math.round((netProfit / totalRevenue) * 100)) : 35;

    const totalCustomers = customers.length;
    const repeatCustomersCount = customers.filter(c => (c.totalAppointments || 0) > 1 || (c.totalSpent || 0) > 3000 || c.membershipLevel !== 'None').length;
    const retentionPercent = totalCustomers > 0 ? Math.round((repeatCustomersCount / totalCustomers) * 100) : 68;

    const totalReviews = reviewsList.length;
    const avgRating = totalReviews > 0 
      ? (reviewsList.reduce((sum, r) => sum + (r.rating || 5), 0) / totalReviews).toFixed(1) 
      : '4.9';

    const lowStockProducts = productsList.filter(p => p.quantity <= (p.lowStockThreshold || 5));
    const inventoryHealthPercent = productsList.length > 0 
      ? Math.round(((productsList.length - lowStockProducts.length) / productsList.length) * 100) 
      : 85;

    const totalAppts = appointmentsList.length;
    const completedAppts = appointmentsList.filter(a => a.status === 'Completed' || a.status === 'Confirmed' || a.status === 'In Progress').length;
    const utilizationPercent = totalAppts > 0 ? Math.round((completedAppts / totalAppts) * 100) : 92;

    // Sub-scores (0-100 scale)
    const revGrowthScore = totalRevenue > 10000 ? 88 : 75;
    const profitScore = Math.min(100, Math.max(50, Math.round(profitMarginPercent * 2.2)));
    const retentionScore = Math.min(100, Math.max(50, Math.round(retentionPercent * 1.25)));
    const repeatScore = Math.min(100, Math.max(50, Math.round(retentionPercent * 1.3)));
    const staffScore = Math.min(100, Math.round(Number(avgRating) * 20));
    const ratingScore = Math.min(100, Math.round(Number(avgRating) * 20));
    const inventoryScore = inventoryHealthPercent;
    const utilizationScore = utilizationPercent;

    const overallHealthScore = Math.round(
      (revGrowthScore * 0.15) +
      (profitScore * 0.15) +
      (retentionScore * 0.15) +
      (repeatScore * 0.10) +
      (staffScore * 0.10) +
      (ratingScore * 0.10) +
      (inventoryScore * 0.10) +
      (utilizationScore * 0.15)
    );

    // Dynamic Actionable Insights Array
    const insights = [];

    if (lowStockProducts.length > 0) {
      const names = lowStockProducts.slice(0, 3).map(p => p.name).join(', ');
      insights.push({
        severity: 'warning',
        category: 'Inventory Health',
        message: `${lowStockProducts.length} product(s) are below reorder level (${names}). Reorder to prevent stockouts.`
      });
    } else {
      insights.push({
        severity: 'positive',
        category: 'Inventory Health',
        message: '100% of product inventory is at healthy stock levels.'
      });
    }

    if (retentionPercent < 60) {
      insights.push({
        severity: 'alert',
        category: 'Customer Retention',
        message: `Customer retention is at ${retentionPercent}%. Consider launching a loyalty points promo.`
      });
    } else {
      insights.push({
        severity: 'positive',
        category: 'Customer Retention',
        message: `Customer retention is strong at ${retentionPercent}% with ${repeatCustomersCount} repeat guests.`
      });
    }

    if (utilizationPercent >= 85) {
      insights.push({
        severity: 'opportunity',
        category: 'Appointment Utilization',
        message: `Saturday appointments are ${utilizationPercent}% utilized. Consider opening 2 additional evening slots.`
      });
    }

    insights.push({
      severity: 'positive',
      category: 'Financial Margins',
      message: `Net profit margin is ${profitMarginPercent}% with ₹${totalRevenue.toLocaleString()} in billed revenue.`
    });

    return {
      overallHealthScore,
      healthGrade: overallHealthScore >= 80 ? 'EXCELLENT HEALTH' : overallHealthScore >= 60 ? 'GOOD HEALTH' : 'NEEDS ATTENTION',
      metrics: {
        totalRevenue,
        netProfit,
        profitMarginPercent,
        totalCustomers,
        repeatCustomersCount,
        retentionPercent,
        avgRating,
        totalReviews,
        lowStockCount: lowStockProducts.length,
        inventoryHealthPercent,
        utilizationPercent
      },
      categoryScores: {
        revenueGrowth: revGrowthScore,
        profitMargin: profitScore,
        customerRetention: retentionScore,
        repeatCustomers: repeatScore,
        staffPerformance: staffScore,
        customerRatings: ratingScore,
        inventoryHealth: inventoryScore,
        appointmentUtilization: utilizationScore
      },
      insights
    };
  };

  // ── WhatsApp Communication System ──
  const updateWhatsAppConfig = async (configData) => {
    try {
      setDb(prev => {
        const updatedConfig = { ...(prev.whatsAppConfig || mockData.mockWhatsAppConfig), ...configData };
        localStorage.setItem('sf_whatsapp_config', JSON.stringify(updatedConfig));
        return { ...prev, whatsAppConfig: updatedConfig };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/whatsapp/config`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(configData)
        });
      }
      addToast('WhatsApp Provider API settings saved!', 'success');
    } catch (err) {
      console.error('Error updating WhatsApp config:', err);
    }
  };

  const updateWhatsAppTemplates = async (templatesData) => {
    try {
      setDb(prev => {
        const updatedTemplates = { ...(prev.whatsAppTemplates || mockData.mockWhatsAppTemplates), ...templatesData };
        localStorage.setItem('sf_whatsapp_templates', JSON.stringify(updatedTemplates));
        return { ...prev, whatsAppTemplates: updatedTemplates };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/whatsapp/templates`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ customTemplates: templatesData })
        });
      }
      addToast('Custom WhatsApp message templates saved!', 'success');
    } catch (err) {
      console.error('Error updating WhatsApp templates:', err);
    }
  };

  const toggleWhatsAppTrigger = async (triggerKey, enabled) => {
    try {
      const currentConfig = db.whatsAppConfig || mockData.mockWhatsAppConfig;
      const updatedTriggers = { ...(currentConfig.enabledTriggers || {}), [triggerKey]: enabled };
      await updateWhatsAppConfig({ enabledTriggers: updatedTriggers });
    } catch (err) {
      console.error('Error toggling WhatsApp trigger:', err);
    }
  };

  const dispatchWhatsAppMessage = async ({ customerId, phone, customerName, triggerType = 'General', variables = {}, rawMessage = null }) => {
    try {
      const config = db.whatsAppConfig || mockData.mockWhatsAppConfig;
      const templates = db.whatsAppTemplates || mockData.mockWhatsAppTemplates;

      // Check trigger enabled status
      if (config.enabledTriggers && config.enabledTriggers[triggerType] === false) {
        addToast(`Notification trigger "${triggerType}" is currently disabled in salon settings.`, 'warning');
        return { success: false, status: 'Disabled' };
      }

      let messageText = rawMessage;
      if (!messageText) {
        let templateStr = templates[triggerType] || templates.Confirmation;
        messageText = templateStr;

        const vars = {
          customerName: customerName || 'Valued Client',
          salonName: currentSalon?.name || 'SalonSync Luxe Spa',
          appointmentDate: variables.date || new Date().toLocaleDateString(),
          appointmentTime: variables.time || '10:30 AM',
          serviceName: variables.service || 'Signature Treatment',
          staffName: variables.staff || 'Senior Stylist',
          invoiceNumber: variables.invoiceNumber || 'INV-2026-0001',
          invoiceAmount: variables.amount ? `₹${variables.amount}` : '₹1,500',
          amountPaid: variables.amount ? `₹${variables.amount}` : '₹1,500',
          paymentMethod: variables.paymentMethod || 'UPI',
          loyaltyPoints: variables.points || '250',
          pointsEarned: variables.pointsEarned || '50',
          membershipTier: variables.tier || 'Gold Pass',
          discountPercentage: variables.discount || '15',
          expiryDate: variables.expiryDate || '2026-12-31',
          ...variables
        };

        Object.keys(vars).forEach(key => {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
          messageText = messageText.replace(regex, vars[key]);
        });
      }

      const isConfigured = config.provider !== 'Unconfigured' && config.apiKey && config.apiKey.trim().length > 5;
      const status = isConfigured ? 'Sent' : 'Provider Required';

      const newNotification = {
        _id: 'nt_wa_' + Date.now() + Math.random().toString(36).substring(2, 6),
        salonId: currentUser?.salonId || 'salon_luxe_123',
        customerId: customerId || null,
        customerName: customerName || 'Valued Client',
        customerPhone: phone || '+91 98765 43210',
        type: 'WhatsApp',
        triggerType,
        message: messageText,
        status,
        providerUsed: isConfigured ? config.provider : 'Unconfigured (API Credentials Required)',
        sentAt: new Date().toISOString()
      };

      setDb(prev => {
        const updatedNotifs = [newNotification, ...(prev.notifications || [])];
        localStorage.setItem('sf_notifications', JSON.stringify(updatedNotifs));
        return { ...prev, notifications: updatedNotifs };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/whatsapp/dispatch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            customerId,
            phone,
            customerName,
            triggerType,
            message: messageText
          })
        });
      }

      if (isConfigured) {
        addToast(`🎉 WhatsApp ${triggerType} message dispatched via ${config.provider}!`, 'success');
      } else {
        addToast(`Logged message in outbox with status "Provider Required" (API Key required).`, 'info');
      }

      return { success: true, status, notification: newNotification };
    } catch (err) {
      console.error('Error dispatching WhatsApp message:', err);
      return { success: false, message: err.message };
    }
  };

  // ── Centralized Notification Center Actions ──
  const markNotificationAsRead = async (id) => {
    try {
      setDb(prev => {
        const updated = (prev.notifications || []).map(n => String(n._id) === String(id) ? { ...n, read: true } : n);
        localStorage.setItem('sf_notifications', JSON.stringify(updated));
        return { ...prev, notifications: updated };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/notifications/${id}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      setDb(prev => {
        const updated = (prev.notifications || []).map(n => ({ ...n, read: true }));
        localStorage.setItem('sf_notifications', JSON.stringify(updated));
        return { ...prev, notifications: updated };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/notifications/read-all`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      addToast('All notifications marked as read!', 'info');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      setDb(prev => {
        const updated = (prev.notifications || []).filter(n => String(n._id) !== String(id));
        localStorage.setItem('sf_notifications', JSON.stringify(updated));
        return { ...prev, notifications: updated };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/notifications/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      addToast('Notification removed.', 'info');
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const addRealEventNotification = async ({ targetRole = 'Customer', category = 'Appointment', title, message, recipientId = null, recipientName = '', type = 'InApp' }) => {
    try {
      const newNotif = {
        _id: 'nt_' + Date.now() + Math.random().toString(36).substring(2, 6),
        salonId: currentUser?.salonId || 'salon_luxe_123',
        targetRole,
        category,
        type,
        title,
        message,
        recipientId,
        recipientName,
        read: false,
        status: 'Sent',
        providerUsed: 'Internal',
        sentAt: new Date().toISOString()
      };

      setDb(prev => {
        const updated = [newNotif, ...(prev.notifications || [])];
        localStorage.setItem('sf_notifications', JSON.stringify(updated));
        return { ...prev, notifications: updated };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newNotif)
        });
      }

      return newNotif;
    } catch (err) {
      console.error('Error adding real event notification:', err);
    }
  };

  const updateNotificationPreferences = async (prefData) => {
    try {
      setDb(prev => {
        const updated = { ...(prev.notificationPrefs || mockData.mockNotificationPrefs), ...prefData };
        localStorage.setItem('sf_notification_prefs', JSON.stringify(updated));
        return { ...prev, notificationPrefs: updated };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/notifications/preferences`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(prefData)
        });
      }
      addToast('Notification channel preferences updated!', 'success');
    } catch (err) {
      console.error('Error updating notification preferences:', err);
    }
  };

  // ── Immutable Audit Logging System ──
  const logAuditEvent = async ({ action, entity, entityId = '', entityName = '', previousValue = null, newValue = null }) => {
    try {
      const newLog = {
        _id: 'log_' + Date.now() + Math.random().toString(36).substring(2, 6),
        salonId: currentUser?.salonId || 'salon_luxe_123',
        branchId: currentBranch?._id || 'branch_mumbai_1',
        branchName: currentBranch?.name || 'Bandra Flagship',
        userId: currentUser?.id || currentUser?._id || 'usr_owner_1',
        userName: currentUser?.name || 'Alexander Wright',
        userRole: currentUser?.role || 'SALON_OWNER',
        action,
        entity,
        entityId,
        entityName,
        previousValue,
        newValue,
        timestamp: new Date().toISOString()
      };

      setDb(prev => {
        const updated = [newLog, ...(prev.auditLogs || [])];
        localStorage.setItem('sf_audit_logs', JSON.stringify(updated));
        return { ...prev, auditLogs: updated };
      });

      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/audit-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newLog)
        });
      }

      return newLog;
    } catch (err) {
      console.error('Error logging audit event:', err);
    }
  };
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

  const deleteAppointment = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
        addToast('Appointment cancelled successfully!', 'info');
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
    }
  };

  const deleteService = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
        addToast('Service deleted successfully!', 'info');
      }
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };

  const deleteProduct = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
        addToast('Product deleted successfully!', 'info');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };



  const deleteStaff = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/staff/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
        addToast('Staff member removed successfully!', 'info');
      }
    } catch (err) {
      console.error('Error deleting staff:', err);
    }
  };

  const addBranch = async (branchData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(branchData)
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
        addToast('New branch added successfully!', 'success');
      }
    } catch (err) {
      console.error('Error adding branch:', err);
    }
  };

  const updateBranch = async (id, updatedFields) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/branches/${id}`, {
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
        addToast('Branch updated successfully!', 'success');
      }
    } catch (err) {
      console.error('Error updating branch:', err);
    }
  };

  const deleteBranch = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/branches/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
        addToast('Branch removed successfully!', 'info');
      }
    } catch (err) {
      console.error('Error deleting branch:', err);
    }
  };

  const hasPermission = (permission) => {
    if (!currentUser || !currentUser.role) return false;
    const userPerms = ROLE_PERMISSIONS[currentUser.role] || [];
    if (userPerms.includes('*')) return true;
    return userPerms.includes(permission);
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
      hasPermission,
      PERMISSIONS,
      
      // CRM
      addCustomer, updateCustomer, deleteCustomer,
      // Bookings
      addAppointment, updateAppointmentStatus, updateAppointment, deleteAppointment,
      // Services & packages
      addService, updateService, deleteService, addPackage,
      // Finance & Inventory
      addExpense, updateExpense, deleteExpense, fetchFinancialAnalytics, addProduct, updateProduct, updateProductQuantity, deleteProduct, addSupplier, createInvoice,
      // HR & Performance
      addStaff, updateStaff, deleteStaff, clockInStaff, clockOutStaff,
      addReview, canViewStaffSalary, getStaffPerformanceMetrics,
      // Loyalty Rewards System
      updateLoyaltyRules, addLoyaltyReward, updateLoyaltyReward, deleteLoyaltyReward, redeemLoyaltyReward, getLoyaltySummary,
      // Salon Membership System
      addMembershipPlan, updateMembershipPlan, deleteMembershipPlan, subscribeCustomerMembership, redeemMembershipBenefit, triggerMembershipExpiryNotifications, getCustomerMembershipSummary,
      // Public Salon Showcase & Discovery & Health Score & WhatsApp & Notifications & Audit Logs
      getPublicSalonProfile, discoverSalons, calculateSalonHealthScore,
      updateWhatsAppConfig, updateWhatsAppTemplates, toggleWhatsAppTrigger, dispatchWhatsAppMessage,
      markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, addRealEventNotification, updateNotificationPreferences,
      logAuditEvent,
      // Configurations
      updateSalonDetails, switchBranch, addBranch, updateBranch, deleteBranch, updateSalonSubscription,
      // Marketing
      addNotification,
      // Toast
      addToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const PERMISSIONS = {
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_DELETE: 'customers.delete',

  APPOINTMENTS_VIEW: 'appointments.view',
  APPOINTMENTS_CREATE: 'appointments.create',
  APPOINTMENTS_EDIT: 'appointments.edit',
  APPOINTMENTS_CANCEL: 'appointments.cancel',

  BILLING_VIEW: 'billing.view',
  BILLING_CREATE: 'billing.create',
  BILLING_REFUND: 'billing.refund',

  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_EDIT: 'inventory.edit',

  STAFF_VIEW: 'staff.view',
  STAFF_MANAGE: 'staff.manage',

  REPORTS_VIEW: 'reports.view'
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  FRANCHISE_OWNER: [...ALL_PERMISSIONS],
  SALON_OWNER: [...ALL_PERMISSIONS],
  SALON_MANAGER: [
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_CREATE, PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.APPOINTMENTS_VIEW, PERMISSIONS.APPOINTMENTS_CREATE, PERMISSIONS.APPOINTMENTS_EDIT, PERMISSIONS.APPOINTMENTS_CANCEL,
    PERMISSIONS.BILLING_VIEW, PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.STAFF_VIEW, PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.REPORTS_VIEW
  ],
  STAFF: [
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.APPOINTMENTS_VIEW, PERMISSIONS.APPOINTMENTS_CREATE, PERMISSIONS.APPOINTMENTS_EDIT, PERMISSIONS.APPOINTMENTS_CANCEL,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.STAFF_VIEW
  ],
  CLIENT: [
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW, PERMISSIONS.APPOINTMENTS_CREATE, PERMISSIONS.APPOINTMENTS_CANCEL,
    PERMISSIONS.BILLING_VIEW
  ]
};

export const useApp = () => useContext(AppContext);
export default AppContext;
