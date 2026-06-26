import React, { createContext, useContext, useState, useEffect } from 'react';
import * as mockData from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
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
    const local = localStorage.getItem('user');
    return local ? JSON.parse(local) : null;
  });

  const [currentSalon, setCurrentSalon] = useState(() => {
    const local = localStorage.getItem('salon');
    return local ? JSON.parse(local) : null;
  });

  const [currentBranch, setCurrentBranch] = useState(() => {
    const local = localStorage.getItem('branch');
    return local ? JSON.parse(local) : null;
  });

  // DB collections state
  const [db, setDb] = useState(() => {
    const getLocal = (key, defaultVal) => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultVal;
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

  // API Backend sync base url (dynamic host to support local network/mobile testing)
  const API_URL = `http://${window.location.hostname}:5000/api`;

  // Sync all collection data from backend DB
  const syncBackendData = async (token = localStorage.getItem('token')) => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch active salon
      const salonRes = await fetch(`${API_URL}/salons/mine`, { headers });
      const salonData = await salonRes.json();
      if (salonData.success) {
        setCurrentSalon(salonData.data);
        localStorage.setItem('salon', JSON.stringify(salonData.data));
      }

      // Fetch branches
      const branchRes = await fetch(`${API_URL}/branches`, { headers });
      const branchData = await branchRes.json();
      let activeBranches = [];
      if (branchData.success) {
        activeBranches = branchData.data;
        const local = localStorage.getItem('branch');
        if (local) {
          setCurrentBranch(JSON.parse(local));
        } else if (currentUser && currentUser.branchId) {
          const userB = activeBranches.find(b => b._id === currentUser.branchId);
          if (userB) {
            setCurrentBranch(userB);
            localStorage.setItem('branch', JSON.stringify(userB));
          } else if (activeBranches.length > 0) {
            setCurrentBranch(activeBranches[0]);
            localStorage.setItem('branch', JSON.stringify(activeBranches[0]));
          }
        } else if (activeBranches.length > 0) {
          setCurrentBranch(activeBranches[0]);
          localStorage.setItem('branch', JSON.stringify(activeBranches[0]));
        }
      }

      // Fetch other collections
      const [
        customersRes,
        appointmentsRes,
        servicesRes,
        packagesRes,
        expensesRes,
        invoicesRes,
        productsRes,
        suppliersRes,
        staffRes,
        attendanceRes,
        commissionsRes,
        salonsRes
      ] = await Promise.all([
        fetch(`${API_URL}/customers`, { headers }),
        fetch(`${API_URL}/appointments`, { headers }),
        fetch(`${API_URL}/services`, { headers }),
        fetch(`${API_URL}/packages`, { headers }),
        fetch(`${API_URL}/expenses`, { headers }),
        fetch(`${API_URL}/invoices`, { headers }),
        fetch(`${API_URL}/products`, { headers }),
        fetch(`${API_URL}/suppliers`, { headers }),
        fetch(`${API_URL}/staff`, { headers }),
        fetch(`${API_URL}/attendance`, { headers }),
        fetch(`${API_URL}/commissions`, { headers }),
        fetch(`${API_URL}/salons`, { headers })
      ]);

      const [
        customers,
        appointments,
        services,
        packages,
        expenses,
        invoices,
        products,
        suppliers,
        staff,
        attendance,
        commissions,
        salons
      ] = await Promise.all([
        customersRes.json(),
        appointmentsRes.json(),
        servicesRes.json(),
        packagesRes.json(),
        expensesRes.json(),
        invoicesRes.json(),
        productsRes.json(),
        suppliersRes.json(),
        staffRes.json(),
        attendanceRes.json(),
        commissionsRes.json(),
        salonsRes.json()
      ]);

      setDb(prev => ({
        ...prev,
        branches: activeBranches.length > 0 ? activeBranches : prev.branches,
        customers: customers.success ? customers.data : prev.customers,
        appointments: appointments.success ? appointments.data : prev.appointments,
        services: services.success ? services.data : prev.services,
        packages: packages.success ? packages.data : prev.packages,
        expenses: expenses.success ? expenses.data : prev.expenses,
        invoices: invoices.success ? invoices.data : prev.invoices,
        products: products.success ? products.data : prev.products,
        suppliers: suppliers.success ? suppliers.data : prev.suppliers,
        staff: staff.success ? staff.data : prev.staff,
        attendance: attendance.success ? attendance.data : prev.attendance,
        commissions: commissions.success ? commissions.data : prev.commissions,
        salons: salons.success ? salons.data : prev.salons
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
        await syncBackendData(data.token);
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
        await syncBackendData(data.token);
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
  };

  // Helper filter by tenant (salonId)
  const tenantFilter = (items) => {
    if (!currentUser || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'CLIENT') return items;
    let filtered = items.filter(item => item.salonId === currentUser.salonId);
    if (['SALON_MANAGER', 'STAFF'].includes(currentUser.role) && currentUser.branchId) {
      filtered = filtered.filter(item => !item.branchId || item.branchId === currentUser.branchId);
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
        if (customer.email) {
          try {
            await fetch(`${API_URL}/auth/create-user`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                password: 'password123',
                role: 'CLIENT'
              })
            });
          } catch (err) {
            console.error('Failed to create customer user credentials:', err);
          }
        }
        await syncBackendData(token);
        return data.data;
      }
    } catch (err) {
      console.error('Error adding customer:', err);
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
      }
    } catch (err) {
      console.error('Error updating customer:', err);
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
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };

  const addAppointment = async (appt) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...appt,
          branchId: currentBranch ? currentBranch._id : appt.branchId
        })
      });
      const data = await res.json();
      if (data.success) {
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error adding appointment:', err);
    }
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
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
    } catch (err) {
      console.error('Error updating appointment status:', err);
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
        try {
          await fetch(`${API_URL}/auth/create-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: member.name,
              email: `${member.phone}@salonsync.com`,
              phone: member.phone,
              password: 'password123',
              role: 'STAFF'
            })
          });
        } catch (userErr) {
          console.error('Failed to create staff user credentials:', userErr);
        }
        await syncBackendData(token);
      }
    } catch (err) {
      console.error('Error adding staff:', err);
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
    setDb(prev => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications]
    }));
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
      addAppointment, updateAppointmentStatus,
      // Services & packages
      addService, addPackage,
      // Finance & Inventory
      addExpense, addProduct, updateProductQuantity, addSupplier, createInvoice,
      // HR
      addStaff, clockInStaff, clockOutStaff,
      // Configurations
      updateSalonDetails, switchBranch, updateSalonSubscription,
      // Marketing
      addNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
