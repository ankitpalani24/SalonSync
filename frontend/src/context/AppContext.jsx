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
  const [demoMode, setDemoMode] = useState(false);

  // Active tenant states
  const [currentUser, setCurrentUser] = useState(() => {
    const local = localStorage.getItem('user');
    return local ? JSON.parse(local) : mockData.mockUsers[1]; // Logged in as Alexander (Salon Owner) by default
  });

  const [currentSalon, setCurrentSalon] = useState(() => {
    const local = localStorage.getItem('salon');
    return local ? JSON.parse(local) : mockData.mockSalons[0]; // Luxe & Gold
  });

  const [currentBranch, setCurrentBranch] = useState(() => {
    const local = localStorage.getItem('branch');
    return local ? JSON.parse(local) : mockData.mockBranches[0]; // Bandra Flagship
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

  // Persist collections in localStorage whenever they change
  useEffect(() => {
    if (demoMode) {
      Object.keys(db).forEach((key) => {
        localStorage.setItem(`sf_${key}`, JSON.stringify(db[key]));
      });
    }
  }, [db, demoMode]);

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

  // API Backend sync base url
  const API_URL = 'http://localhost:5000/api';

  // Auth Operations
  const login = async (email, password) => {
    if (demoMode) {
      const user = db.users.find(u => u.email === email);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        
        if (user.salonId) {
          const salon = db.salons.find(s => s._id === user.salonId);
          if (salon) {
            setCurrentSalon(salon);
            localStorage.setItem('salon', JSON.stringify(salon));
          }
          const branch = db.branches.find(b => b.salonId === user.salonId);
          if (branch) {
            setCurrentBranch(branch);
            localStorage.setItem('branch', JSON.stringify(branch));
          }
        }
        return { success: true, user };
      }
      return { success: false, message: 'Invalid credentials in Demo Database.' };
    } else {
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
          // Load Salon details
          const salonRes = await fetch(`${API_URL}/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${data.token}` }
          });
          // Synchronize core data sets after login
          return { success: true, user: data.user };
        }
        return { success: false, message: data.message };
      } catch (err) {
        return { success: false, message: 'Failed to connect to API backend.' };
      }
    }
  };

  const signup = async (payload) => {
    if (demoMode) {
      const newSalonId = `salon_${Date.now()}`;
      const newBranchId = `branch_${Date.now()}`;
      const newUserId = `user_${Date.now()}`;

      const newSalon = {
        _id: newSalonId,
        name: payload.salonName,
        ownerName: payload.ownerName,
        email: payload.email,
        phone: payload.phone,
        address: payload.salonAddress,
        city: payload.city,
        state: payload.state,
        gstNumber: payload.gstNumber,
        businessType: payload.businessType,
        subscriptionPlan: 'Starter',
        subscriptionStatus: 'Trial'
      };

      const newBranch = {
        _id: newBranchId,
        salonId: newSalonId,
        name: 'Main Branch',
        address: payload.salonAddress,
        city: payload.city,
        state: payload.state,
        phone: payload.phone,
        status: 'Active'
      };

      const newUser = {
        _id: newUserId,
        name: payload.ownerName,
        email: payload.email,
        phone: payload.phone,
        role: 'Salon Owner',
        salonId: newSalonId,
        branchId: newBranchId
      };

      setDb(prev => ({
        ...prev,
        salons: [...prev.salons, newSalon],
        branches: [...prev.branches, newBranch],
        users: [...prev.users, newUser],
        services: [
          ...prev.services,
          { _id: `serv_${Date.now()}_1`, salonId: newSalonId, name: 'Standard Haircut', category: 'Haircut', duration: 30, price: 400, materialCost: 30, profitMargin: 370 },
          { _id: `serv_${Date.now()}_2`, salonId: newSalonId, name: 'Facial Cleanse', category: 'Facial', duration: 45, price: 1000, materialCost: 100, profitMargin: 900 }
        ],
        staff: [
          ...prev.staff,
          { _id: `staff_${Date.now()}_1`, salonId: newSalonId, branchId: newBranchId, name: 'Standard Stylist', phone: payload.phone, role: 'Stylist', salary: 15000, commissionPercentage: 10, rating: 5 }
        ],
        products: [
          ...prev.products,
          { _id: `prod_${Date.now()}_1`, salonId: newSalonId, name: 'Sample Shampoo', sku: 'SMP-SH', category: 'Hair Care', quantity: 10, purchasePrice: 200, sellingPrice: 400, lowStockThreshold: 2 }
        ]
      }));

      setCurrentUser(newUser);
      setCurrentSalon(newSalon);
      setCurrentBranch(newBranch);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('salon', JSON.stringify(newSalon));
      localStorage.setItem('branch', JSON.stringify(newBranch));
      return { success: true };
    } else {
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
          return { success: true };
        }
        return { success: false, message: data.message };
      } catch (err) {
        return { success: false, message: 'Signup failed. API is offline.' };
      }
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Helper filter by tenant (salonId)
  const tenantFilter = (items) => {
    if (!currentUser || currentUser.role === 'Super Admin') return items;
    return items.filter(item => item.salonId === currentUser.salonId);
  };

  // ----------------------------------------------------
  // ENTITY OPERATIONS (LOCAL DB WRITING)
  // ----------------------------------------------------

  const addCustomer = (customer) => {
    const newCust = {
      _id: `cust_${Date.now()}`,
      salonId: currentUser.salonId,
      branchId: currentBranch ? currentBranch._id : null,
      loyaltyPoints: 0,
      membershipLevel: 'None',
      ...customer
    };
    setDb(prev => ({
      ...prev,
      customers: [...prev.customers, newCust]
    }));
    return newCust;
  };

  const updateCustomer = (id, updatedFields) => {
    setDb(prev => ({
      ...prev,
      customers: prev.customers.map(c => c._id === id ? { ...c, ...updatedFields } : c)
    }));
  };

  const deleteCustomer = (id) => {
    setDb(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c._id !== id)
    }));
  };

  const addAppointment = (appt) => {
    const newAppt = {
      _id: `appt_${Date.now()}`,
      salonId: currentUser.salonId,
      branchId: currentBranch ? currentBranch._id : null,
      status: 'Scheduled',
      ...appt
    };
    setDb(prev => ({
      ...prev,
      appointments: [...prev.appointments, newAppt]
    }));

    // Trigger WhatsApp notification simulator log
    addNotification({
      customerId: appt.customerId,
      type: 'WhatsApp',
      message: `Your booking for date ${appt.date} at ${appt.time} has been scheduled successfully.`
    });
  };

  const updateAppointmentStatus = (id, status) => {
    setDb(prev => ({
      ...prev,
      appointments: prev.appointments.map(a => a._id === id ? { ...a, status } : a)
    }));

    // If completed, trigger mock loyalty/commissions alert if checkout not manually run.
    const appt = db.appointments.find(a => a._id === id);
    if (appt && status === 'Completed') {
      addNotification({
        customerId: appt.customerId,
        type: 'WhatsApp',
        message: `Thank you for visiting us! Your treatment was marked completed.`
      });
    }
  };

  const addService = (srv) => {
    const profitMargin = srv.price - (srv.materialCost || 0);
    const newSrv = {
      _id: `serv_${Date.now()}`,
      salonId: currentUser.salonId,
      profitMargin,
      ...srv
    };
    setDb(prev => ({
      ...prev,
      services: [...prev.services, newSrv]
    }));
  };

  const addPackage = (pkg) => {
    const newPkg = {
      _id: `pkg_${Date.now()}`,
      salonId: currentUser.salonId,
      ...pkg
    };
    setDb(prev => ({
      ...prev,
      packages: [...prev.packages, newPkg]
    }));
  };

  const addExpense = (exp) => {
    const newExp = {
      _id: `exp_${Date.now()}`,
      salonId: currentUser.salonId,
      branchId: currentBranch ? currentBranch._id : null,
      date: new Date().toLocaleDateString('en-CA'),
      ...exp
    };
    setDb(prev => ({
      ...prev,
      expenses: [...prev.expenses, newExp]
    }));
  };

  const addProduct = (prod) => {
    const newProd = {
      _id: `prod_${Date.now()}`,
      salonId: currentUser.salonId,
      ...prod
    };
    setDb(prev => ({
      ...prev,
      products: [...prev.products, newProd]
    }));
  };

  const updateProductQuantity = (productId, delta) => {
    setDb(prev => ({
      ...prev,
      products: prev.products.map(p => p._id === productId ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p)
    }));
  };

  const addSupplier = (supp) => {
    const newSupp = {
      _id: `supp_${Date.now()}`,
      salonId: currentUser.salonId,
      outstandingDues: 0,
      ...supp
    };
    setDb(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, newSupp]
    }));
  };

  const addStaff = (member) => {
    const newStaff = {
      _id: `staff_${Date.now()}`,
      salonId: currentUser.salonId,
      branchId: currentBranch ? currentBranch._id : null,
      rating: 5.0,
      ...member
    };
    setDb(prev => ({
      ...prev,
      staff: [...prev.staff, newStaff]
    }));
  };

  const clockInStaff = (staffId) => {
    const today = new Date().toLocaleDateString('en-CA');
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"
    
    // Check if already clocked in
    const exists = db.attendance.some(att => att.staffId === staffId && att.date === today);
    if (exists) return;

    const newAtt = {
      _id: `att_${Date.now()}`,
      salonId: currentUser.salonId,
      branchId: currentBranch ? currentBranch._id : null,
      staffId,
      date: today,
      checkIn: nowTime,
      checkOut: '',
      workingHours: 0,
      overtime: 0
    };

    setDb(prev => ({
      ...prev,
      attendance: [...prev.attendance, newAtt]
    }));
  };

  const clockOutStaff = (staffId) => {
    const today = new Date().toLocaleDateString('en-CA');
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5);

    setDb(prev => {
      const updatedAtt = prev.attendance.map(att => {
        if (att.staffId === staffId && att.date === today && !att.checkOut) {
          const [inH, inM] = att.checkIn.split(':').map(Number);
          const [outH, outM] = nowTime.split(':').map(Number);
          const diffHrs = (outH + outM / 60) - (inH + inM / 60);
          const workingHours = Math.round(diffHrs * 10) / 10;
          const overtime = Math.max(0, workingHours - 8);

          return { ...att, checkOut: nowTime, workingHours, overtime };
        }
        return att;
      });
      return { ...prev, attendance: updatedAtt };
    });
  };

  const addNotification = (notif) => {
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
  const createInvoice = (invoiceData) => {
    const count = tenantFilter(db.invoices).length;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let subTotal = 0;

    // Calculate services cost
    invoiceData.services.forEach(item => {
      const s = db.services.find(serv => serv._id === item.serviceId);
      if (s) subTotal += s.price * (item.quantity || 1);
    });

    // Calculate products cost & deduct inventory
    invoiceData.products.forEach(item => {
      const p = db.products.find(prod => prod._id === item.productId);
      if (p) {
        subTotal += p.sellingPrice * (item.quantity || 1);
        updateProductQuantity(item.productId, -(item.quantity || 1));
      }
    });

    const taxVal = subTotal * (invoiceData.tax || 0) / 100;
    const finalAmount = Math.round(subTotal + taxVal - (invoiceData.discount || 0));

    const newInvoice = {
      _id: `inv_${Date.now()}`,
      invoiceNumber,
      salonId: currentUser.salonId,
      branchId: currentBranch ? currentBranch._id : null,
      customerId: invoiceData.customerId,
      services: invoiceData.services.map(i => {
        const s = db.services.find(serv => serv._id === i.serviceId);
        return { serviceId: i.serviceId, name: s ? s.name : 'Service', price: s ? s.price : 0, quantity: i.quantity || 1 };
      }),
      products: invoiceData.products.map(i => {
        const p = db.products.find(prod => prod._id === i.productId);
        return { productId: i.productId, name: p ? p.name : 'Product', price: p ? p.sellingPrice : 0, quantity: i.quantity || 1 };
      }),
      tax: invoiceData.tax || 0,
      discount: invoiceData.discount || 0,
      finalAmount,
      paymentMethod: invoiceData.paymentMethod || 'Cash',
      paymentStatus: 'Paid',
      staffId: invoiceData.staffId,
      createdAt: new Date().toISOString()
    };

    // Loyalty point awarding: ₹100 = 1 point
    if (invoiceData.customerId) {
      const pointsEarned = Math.floor(finalAmount / 100);
      if (pointsEarned > 0) {
        setDb(prev => ({
          ...prev,
          customers: prev.customers.map(c => c._id === invoiceData.customerId ? { ...c, loyaltyPoints: c.loyaltyPoints + pointsEarned } : c),
          loyaltyPoints: [...prev.loyaltyPoints, {
            _id: `lp_${Date.now()}`,
            salonId: currentUser.salonId,
            customerId: invoiceData.customerId,
            pointsEarned,
            transactionAmount: finalAmount,
            date: new Date().toISOString()
          }]
        }));
      }
    }

    // Staff Commission
    if (invoiceData.staffId) {
      const employee = db.staff.find(st => st._id === invoiceData.staffId);
      if (employee) {
        // service revenue only
        const serviceRev = invoiceData.services.reduce((acc, curr) => {
          const s = db.services.find(serv => serv._id === curr.serviceId);
          return acc + (s ? s.price * (curr.quantity || 1) : 0);
        }, 0);
        
        const commissionEarned = Math.round(serviceRev * (employee.commissionPercentage / 100));

        setDb(prev => ({
          ...prev,
          commissions: [...prev.commissions, {
            _id: `comm_${Date.now()}`,
            salonId: currentUser.salonId,
            branchId: currentBranch ? currentBranch._id : null,
            staffId: invoiceData.staffId,
            invoiceId: newInvoice._id,
            revenueGenerated: serviceRev,
            commissionRate: employee.commissionPercentage,
            commissionEarned,
            date: new Date().toLocaleDateString('en-CA')
          }]
        }));
      }
    }

    setDb(prev => ({
      ...prev,
      invoices: [...prev.invoices, newInvoice]
    }));

    // Trigger WhatsApp invoice text
    if (invoiceData.customerId) {
      const customer = db.customers.find(c => c._id === invoiceData.customerId);
      if (customer) {
        addNotification({
          customerId: invoiceData.customerId,
          type: 'WhatsApp',
          message: `Dear ${customer.name}, your invoice ${invoiceNumber} of ₹${finalAmount} was generated. Thanks for choosing SalonSync!`
        });
      }
    }

    return newInvoice;
  };

  // Change Salon details (Owner Profile settings)
  const updateSalonDetails = (updatedFields) => {
    const updated = { ...currentSalon, ...updatedFields };
    setCurrentSalon(updated);
    localStorage.setItem('salon', JSON.stringify(updated));
    setDb(prev => ({
      ...prev,
      salons: prev.salons.map(s => s._id === currentSalon._id ? updated : s)
    }));
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
  const updateSalonSubscription = (salonId, plan, status) => {
    setDb(prev => ({
      ...prev,
      salons: prev.salons.map(s => s._id === salonId ? { ...s, subscriptionPlan: plan, subscriptionStatus: status } : s)
    }));
  };

  return (
    <AppContext.Provider value={{
      darkMode, setDarkMode,
      demoMode, setDarkMode, setDemoMode,
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
