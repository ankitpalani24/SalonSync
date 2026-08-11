import React from 'react';
import {
  TrendingUp, Users, Calendar, AlertTriangle,
  CreditCard, Sparkles, UserPlus, FileText, ArrowUpRight,
  MapPin, Phone, Star, X, Clock, ChevronLeft,
  DollarSign, ShoppingBag, Activity, BarChart3,
  Zap, PlusCircle, Receipt, UserCheck, Package,
  ArrowUp, ArrowDown, Bell, CheckCircle2, XCircle,
  ClipboardList, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  RevenueExpenseChart,
  MonthlyProfitChart,
  AppointmentTrendChart,
  CustomerGrowthChart,
  PopularServicesDonut
} from '../components/DashboardCharts';
import StaffDashboard from '../components/StaffDashboard';

// ─── KPI CARD COMPONENT ──────────────────────────────────────────────────────
const KpiCard = ({ title, value, subtitle, icon: Icon, iconColor, trend, trendUp, accentBorder, glowColor, delay = 0 }) => (
  <div
    className="dash-kpi-card"
    style={{
      animationDelay: `${delay}ms`,
      borderLeft: accentBorder ? `3px solid ${accentBorder}` : undefined,
    }}
  >
    <div className="dash-kpi-header">
      <div
        className="dash-kpi-icon"
        style={{
          background: `${iconColor}12`,
          color: iconColor,
          boxShadow: glowColor ? `0 0 20px ${glowColor}` : undefined,
        }}
      >
        <Icon size={20} />
      </div>
      {trend !== undefined && (
        <div className={`dash-kpi-trend ${trendUp ? 'up' : 'down'}`}>
          {trendUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          <span>{trend}%</span>
        </div>
      )}
    </div>
    <div className="dash-kpi-value">{value}</div>
    <div className="dash-kpi-title">{title}</div>
    {subtitle && <div className="dash-kpi-subtitle">{subtitle}</div>}
  </div>
);

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, action, actionLabel, actionIcon: ActionIcon }) => (
  <div className="dash-section-header">
    <div className="dash-section-title">
      {Icon && <Icon size={18} style={{ color: 'var(--gold-primary)' }} />}
      <h3>{title}</h3>
    </div>
    {action && (
      <button className="dash-section-action" onClick={action}>
        {actionLabel} {ActionIcon && <ActionIcon size={12} />}
      </button>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Dashboard = ({ setActivePage }) => {
  const { currentUser, currentBranch, tenantFilter, db, updateAppointmentStatus, addAppointment, addNotification, addToast } = useApp();

  // Exploration / Client States
  const [activeTab, setActiveTab] = React.useState('my-desk');
  const [selectedSalon, setSelectedSalon] = React.useState(null);
  const [selectedService, setSelectedService] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showBookingModal, setShowBookingModal] = React.useState(false);

  // Booking Form States
  const [bookingBranchId, setBookingBranchId] = React.useState('');
  const [bookingStaffId, setBookingStaffId] = React.useState('');
  const [bookingDate, setBookingDate] = React.useState('');
  const [bookingTime, setBookingTime] = React.useState('10:00');
  const [bookingLoading, setBookingLoading] = React.useState(false);
  const [bookingSuccess, setBookingSuccess] = React.useState('');

  // Filter entities by tenant (salonId) and active branch
  const salonInvoices = tenantFilter(db.invoices);
  const salonAppointments = tenantFilter(db.appointments);
  const salonExpenses = tenantFilter(db.expenses);
  const salonCustomers = tenantFilter(db.customers);
  const salonProducts = tenantFilter(db.products);
  const salonStaff = tenantFilter(db.staff);

  // Branch filter helper
  const matchBranch = (itemBranchId) => {
    if (!currentBranch?._id) return true;
    if (!itemBranchId) return true;
    const a = typeof itemBranchId === 'object' ? itemBranchId?._id : itemBranchId;
    return String(a) === String(currentBranch._id);
  };
  const branchInvoices = salonInvoices.filter(i => matchBranch(i.branchId));
  const branchAppointments = salonAppointments.filter(a => matchBranch(a.branchId));
  const branchExpenses = salonExpenses.filter(e => matchBranch(e.branchId));

  // Date ranges
  const today = new Date().toLocaleDateString('en-CA');
  const getLatestDataMonthStr = () => {
    const dates = [
      ...branchInvoices.map(i => i.createdAt ? i.createdAt.split('T')[0] : ''),
      ...branchExpenses.map(e => e.date ? (e.date.includes('T') ? e.date.split('T')[0] : e.date) : '')
    ].filter(Boolean);
    if (dates.length === 0) {
      const today = new Date();
      today.setDate(1);
      return today.toLocaleDateString('en-CA');
    }
    dates.sort();
    const latestDate = new Date(dates[dates.length - 1]);
    latestDate.setDate(1);
    return latestDate.toLocaleDateString('en-CA');
  };

  const startOfMonthStr = getLatestDataMonthStr();
  const currentMonthName = new Date(startOfMonthStr).toLocaleString('default', { month: 'long' });

  // ────────────────────────────────────────────────────────────────────────────
  // CALCULATIONS (PROFIT & LOSS ENGINE)
  // ────────────────────────────────────────────────────────────────────────────

  // Today's Revenue
  const todayRevenue = branchInvoices
    .filter(i => i.createdAt && i.createdAt.startsWith(today))
    .reduce((sum, i) => sum + i.finalAmount, 0);

  // Monthly Revenue
  const monthlyRevenue = branchInvoices
    .filter(i => i.createdAt && i.createdAt >= startOfMonthStr)
    .reduce((sum, i) => sum + i.finalAmount, 0);

  // Today's Expenses
  const todayExpenses = branchExpenses
    .filter(e => {
      if (!e.date) return false;
      const expDateStr = e.date.includes('T') ? e.date.split('T')[0] : e.date;
      return expDateStr === today;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // Monthly Expenses
  const monthlyExpenses = branchExpenses
    .filter(e => {
      if (!e.date) return false;
      const expDateStr = e.date.includes('T') ? e.date.split('T')[0] : e.date;
      return expDateStr >= startOfMonthStr;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // Material costs
  let monthlyMaterialCost = 0;
  branchInvoices.forEach(inv => {
    inv.services.forEach(item => {
      const originalServ = db.services.find(s => s._id === item.serviceId);
      if (originalServ) {
        monthlyMaterialCost += (originalServ.materialCost || 0) * (item.quantity || 1);
      }
    });
  });

  const todayProfit = todayRevenue - todayExpenses;
  const netProfit = monthlyRevenue - monthlyExpenses - monthlyMaterialCost;

  // Today's Appointments
  const todayAppointments = branchAppointments.filter(a => a.date === today);
  const todayAppointmentCount = todayAppointments.length;

  // Total Customers
  const totalCustomers = salonCustomers.length;

  // New Customers (this month)
  const newCustomersThisMonth = salonCustomers.filter(c => {
    if (!c.createdAt) return false;
    return c.createdAt >= startOfMonthStr;
  }).length;

  // Active Staff
  const activeStaffCount = salonStaff.filter(s => s.status === 'Active' || !s.status).length;

  // Stock Warnings
  const lowStockAlerts = salonProducts.filter(p => p.quantity <= p.lowStockThreshold);

  // Active Memberships
  const activeMemberships = salonCustomers.filter(c => c.membershipLevel !== 'None');

  // Widget Lists
  const upcomingAppointments = branchAppointments
    .filter(a => a.status !== 'Completed' && a.status !== 'Cancelled')
    .slice(0, 6);

  const recentPayments = branchInvoices.slice(-5).reverse();
  const lowStockProductsList = lowStockAlerts.slice(0, 5);

  // Recent Activities (generated from recent invoices & appointments)
  const recentActivities = React.useMemo(() => {
    const activities = [];

    // From recent invoices
    branchInvoices.slice(-4).reverse().forEach(inv => {
      const client = (() => {
        if (inv.customerId && typeof inv.customerId === 'object') return inv.customerId;
        return db.customers.find(c => String(c._id) === String(inv.customerId));
      })();
      activities.push({
        id: `inv-${inv._id}`,
        type: 'payment',
        icon: CreditCard,
        color: 'var(--gold-primary)',
        title: `Payment received from ${client ? client.name : 'Walk-in'}`,
        detail: `₹${inv.finalAmount.toLocaleString()} via ${inv.paymentMethod || 'Cash'}`,
        time: inv.createdAt ? new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
      });
    });

    // From recent appointments
    branchAppointments.slice(-3).reverse().forEach(appt => {
      const customer = (() => {
        if (appt.customerId && typeof appt.customerId === 'object') return appt.customerId;
        return db.customers.find(c => String(c._id) === String(appt.customerId));
      })();
      const iconMap = {
        Completed: CheckCircle2,
        Cancelled: XCircle,
        Scheduled: Calendar,
        'In Progress': Activity,
      };
      const colorMap = {
        Completed: 'var(--accent-green)',
        Cancelled: 'var(--accent-red)',
        Scheduled: '#3498db',
        'In Progress': 'var(--accent-orange)',
      };
      activities.push({
        id: `appt-${appt._id}`,
        type: 'appointment',
        icon: iconMap[appt.status] || Calendar,
        color: colorMap[appt.status] || '#3498db',
        title: `${appt.status} – ${appt.services.map(s => s.name).join(', ')}`,
        detail: customer ? customer.name : 'Walk-in client',
        time: appt.time || 'Scheduled',
      });
    });

    return activities.slice(0, 6);
  }, [branchInvoices, branchAppointments, db.customers]);


  // ════════════════════════════════════════════════════════════════════════════
  // CLIENT DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  if (currentUser.role === 'CLIENT') {
    const myCustomerProfiles = db.customers.filter(c => c.email === currentUser.email || (c.phone && c.phone === currentUser.phone));
    const totalLoyaltyPoints = myCustomerProfiles.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);

    const customerProfile = {
      _id: myCustomerProfiles.length > 0 ? myCustomerProfiles[0]._id : 'guest_cust',
      loyaltyPoints: totalLoyaltyPoints,
      membershipLevel: myCustomerProfiles.map(c => c.membershipLevel).includes('Platinum') ? 'Platinum'
        : (myCustomerProfiles.map(c => c.membershipLevel).includes('Gold') ? 'Gold'
        : (myCustomerProfiles.map(c => c.membershipLevel).includes('Silver') ? 'Silver' : 'None')),
      name: currentUser.name
    };

    const matchesCustomer = (apptCustomerId) => {
      if (!apptCustomerId) return false;
      const targetId = typeof apptCustomerId === 'object' && apptCustomerId !== null
        ? String(apptCustomerId._id)
        : String(apptCustomerId);

      const myCustomerIds = myCustomerProfiles.map(c => String(c._id));
      if (myCustomerIds.includes(targetId)) return true;

      if (typeof apptCustomerId === 'object' && apptCustomerId !== null) {
        if (apptCustomerId.email === currentUser.email) return true;
        if (apptCustomerId.phone && apptCustomerId.phone === currentUser.phone) return true;
      }
      return false;
    };

    const myAppointments = db.appointments.filter(a => matchesCustomer(a.customerId));
    const myInvoices = db.invoices.filter(i => matchesCustomer(i.customerId));
    const myTotalSpending = myInvoices.reduce((sum, inv) => sum + inv.finalAmount, 0);

    const upcomingMyAppts = myAppointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled');
    const pastMyAppts = myAppointments.filter(a => a.status === 'Completed');

    const myStaffIds = pastMyAppts.map(a => a.staffId);
    const favStaffId = myStaffIds.sort((a,b) =>
      myStaffIds.filter(v => v===a).length - myStaffIds.filter(v => v===b).length
    ).pop();
    const favStaff = db.staff.find(s => s._id === favStaffId) || db.staff[0];

    const salonsList = db.salons || [];
    const filteredSalons = salonsList.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSelectSalon = (salon) => {
      setSelectedSalon(salon);
      setSelectedService(null);
      setShowBookingModal(false);
      const salonBranches = db.branches.filter(b => b.salonId === salon._id);
      if (salonBranches.length > 0) {
        setBookingBranchId(salonBranches[0]._id);
      } else {
        setBookingBranchId('');
      }
      const salonStaff = db.staff.filter(st => st.salonId === salon._id);
      if (salonStaff.length > 0) {
        setBookingStaffId(salonStaff[0]._id);
      } else {
        setBookingStaffId('');
      }
      setBookingDate(new Date().toLocaleDateString('en-CA'));
      setBookingTime('10:00');
      setBookingSuccess('');
    };

    const handleOpenBookingModal = (srv) => {
      setSelectedService(srv);
      setBookingSuccess('');
      setShowBookingModal(true);
    };

    const handleCloseBookingModal = () => {
      setShowBookingModal(false);
      setSelectedService(null);
      setBookingSuccess('');
    };

    const handleBookingSubmit = async (e) => {
      e.preventDefault();
      if (!selectedSalon || !selectedService || !bookingBranchId || !bookingStaffId || !bookingDate || !bookingTime) {
        addToast('Please fill out all booking fields', 'warning');
        return;
      }

      setBookingLoading(true);
      try {
        const payload = {
          salonId: selectedSalon._id,
          branchId: bookingBranchId,
          staffId: bookingStaffId,
          date: bookingDate,
          time: bookingTime,
          services: [{
            serviceId: selectedService._id,
            name: selectedService.name,
            price: selectedService.price
          }],
          status: 'Scheduled'
        };

        const result = await addAppointment(payload);
        if (result && result.success === false) {
          addToast(`Booking failed: ${result.message}`, 'error');
          setBookingLoading(false);
          return;
        }

        addNotification({
          salonId: selectedSalon._id,
          customerId: null,
          type: 'Appointment',
          message: `New booking: Client ${currentUser.name} booked ${selectedService.name} on ${bookingDate} at ${bookingTime}.`,
          status: 'Sent'
        });

        const clientProfile = db.customers.find(c => c.email === currentUser.email || (c.phone && c.phone === currentUser.phone));
        if (clientProfile) {
          addNotification({
            customerId: clientProfile._id,
            salonId: null,
            type: 'Appointment',
            message: `Your booking for ${selectedService.name} at ${selectedSalon.name} is confirmed for ${bookingDate} at ${bookingTime}.`,
            status: 'Sent'
          });
        }

        setBookingSuccess('Session booked successfully! You can view it in My Desk.');
        addToast('Session booked successfully!', 'success');
        setTimeout(() => {
          handleCloseBookingModal();
          setSelectedSalon(null);
          setActiveTab('my-desk');
        }, 2500);
      } catch (err) {
        console.error(err);
        addToast('Booking failed. Please try again.', 'error');
      } finally {
        setBookingLoading(false);
      }
    };

    return (
      <div className="page-container animated-fade-in">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Welcome back, {currentUser.name}!</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Track your beauty loyalty status, check-in history, and book upcoming slots.
            </p>
          </div>

          {/* Dashboard Tab Switcher */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => { setActiveTab('my-desk'); setSelectedSalon(null); }}
              className={activeTab === 'my-desk' ? 'gold-btn' : 'outline-btn'}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              My Desk & Bookings
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={activeTab === 'explore' ? 'gold-btn' : 'outline-btn'}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              Explore Salons
            </button>
          </div>
        </div>

        {/* VIEW 1: MY DESK */}
        {activeTab === 'my-desk' && (
          <>
            {/* Client KPI Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem'
            }}>
              <div className="glass-card">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Loyalty Balance</span>
                <h3 style={{ fontSize: '1.65rem', color: 'var(--gold-primary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} /> {customerProfile.loyaltyPoints} Points
                </h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>1 point per ₹100 spent</p>
              </div>

              <div className="glass-card gold-border" style={{ background: 'var(--gold-bg)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)' }}>Membership Status</span>
                <h3 style={{ fontSize: '1.65rem', color: 'var(--gold-primary)', marginTop: '0.5rem' }}>
                  {customerProfile.membershipLevel} Club
                </h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Exclusive treatment tier benefits</p>
              </div>

              <div className="glass-card">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Spending</span>
                <h3 style={{ fontSize: '1.65rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                  ₹{myTotalSpending.toLocaleString()}
                </h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Accumulated checkouts</p>
              </div>
            </div>

            {/* Client Roster and Recommendations Split */}
            <div className="grid-split-2-1" style={{ marginBottom: '2rem' }}>
              {/* Left panel: Bookings */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Upcoming Reserved Slots</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {upcomingMyAppts.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                      No upcoming reservations. Click "Explore Salons" to book a session.
                    </p>
                  ) : (
                    upcomingMyAppts.map(appt => {
                      const staffId = typeof appt.staffId === 'object' ? appt.staffId?._id : appt.staffId;
                      const salonId = typeof appt.salonId === 'object' ? appt.salonId?._id : appt.salonId;
                      const staff = db.staff.find(s => String(s._id) === String(staffId));
                      const salon = db.salons.find(s => String(s._id) === String(salonId));
                      return (
                        <div key={appt._id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '6px'
                        }}>
                          <div>
                            <strong>{appt.services.map(s => s.name).join(', ')}</strong>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                              Salon: {salon ? salon.name : 'SalonSync'} • Stylist: {staff ? staff.name : 'Any'} • Date: {new Date(appt.date).toLocaleDateString()} at {appt.time}
                            </p>
                          </div>
                          <span className={`badge ${appt.status.toLowerCase().replace(' ', '')}`}>{appt.status}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right panel: Recommendations */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Recommended Services</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { name: 'Gold Facial Cleanse', price: '₹1,500', time: '60 mins', benefit: 'Skin rejuvenation' },
                    { name: 'Bridal/Party Makeover', price: '₹15,000', time: '180 mins', benefit: 'Luxury grooming' },
                    { name: 'Deep Conditioning Treatment', price: '₹1,200', time: '45 mins', benefit: 'Hair health' }
                  ].map((rec, rIdx) => (
                    <div key={rIdx} style={{
                      padding: '0.75rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.01)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '0.8rem', color: 'var(--gold-primary)' }}>
                        <span>{rec.name}</span>
                        <span>{rec.price}</span>
                      </div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {rec.time} • {rec.benefit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* VIEW 2: EXPLORE SALONS LIST */}
        {activeTab === 'explore' && !selectedSalon && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Partner Salons & Spas</h2>
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search by salon name or city..."
                style={{ maxWidth: '320px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredSalons.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No salons found matching your search.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {filteredSalons.map(salon => {
                  const salonServices = db.services.filter(s => s.salonId === salon._id);
                  const salonStaffList = db.staff.filter(st => st.salonId === salon._id);
                  const salonBranchesList = db.branches.filter(b => b.salonId === salon._id);
                  return (
                    <div
                      key={salon._id}
                      onClick={() => handleSelectSalon(salon)}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--gold-primary)';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-premium)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border-light)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ height: '6px', background: 'linear-gradient(90deg, var(--gold-primary) 0%, #b38f20 100%)' }} />

                      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <h4 style={{ color: 'var(--gold-primary)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{salon.name}</h4>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '0.65rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '20px',
                            background: 'var(--gold-bg)',
                            color: 'var(--gold-primary)',
                            fontWeight: '600',
                            letterSpacing: '0.3px',
                            textTransform: 'uppercase'
                          }}>
                            {salon.businessType || 'Beauty Salon'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            <MapPin size={13} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--gold-primary)' }} />
                            <span>{[salon.address, salon.city, salon.state].filter(Boolean).join(', ')}</span>
                          </div>
                          {salon.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              <Phone size={12} style={{ flexShrink: 0, color: 'var(--gold-primary)' }} />
                              <span>{salon.phone}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                          {[
                            { label: 'Services', value: salonServices.length },
                            { label: 'Stylists', value: salonStaffList.length },
                            { label: 'Branches', value: salonBranchesList.length },
                          ].map(stat => (
                            <div key={stat.label} style={{ textAlign: 'center', flex: 1, minWidth: '60px', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--gold-primary)' }}>{stat.value}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{stat.label}</div>
                            </div>
                          ))}
                        </div>

                        <div
                          style={{
                            marginTop: 'auto',
                            padding: '0.6rem 1rem',
                            background: 'linear-gradient(135deg, var(--gold-primary) 0%, #b38f20 100%)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#000'
                          }}
                        >
                          View Full Details & Book →
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: SALON DETAIL */}
        {activeTab === 'explore' && selectedSalon && (() => {
          const salonServices = db.services.filter(s => s.salonId === selectedSalon._id);
          const salonCats = [...new Set(salonServices.map(s => s.category))];
          const salonBranchesList = db.branches.filter(b => b.salonId === selectedSalon._id);
          const salonStaffList = db.staff.filter(st => st.salonId === selectedSalon._id);

          return (
            <div style={{ marginBottom: '2rem' }}>
              <button
                onClick={() => { setSelectedSalon(null); setSelectedService(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: 'none', border: 'none', color: 'var(--gold-primary)',
                  fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                  marginBottom: '1.25rem', padding: 0
                }}
              >
                <ChevronLeft size={16} /> Back to All Salons
              </button>

              <div className="glass-card gold-border" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{selectedSalon.name}</h2>
                    <span style={{
                      display: 'inline-block', fontSize: '0.7rem', padding: '0.2rem 0.7rem',
                      borderRadius: '20px', background: 'var(--gold-bg)', color: 'var(--gold-primary)',
                      fontWeight: '600', letterSpacing: '0.3px', textTransform: 'uppercase', marginBottom: '0.75rem'
                    }}>
                      {selectedSalon.businessType || 'Beauty Salon'}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--gold-primary)' }} />
                        <span>{[selectedSalon.address, selectedSalon.city, selectedSalon.state].filter(Boolean).join(', ')}</span>
                      </div>
                      {selectedSalon.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <Phone size={13} style={{ color: 'var(--gold-primary)' }} />
                          <span>{selectedSalon.phone}</span>
                        </div>
                      )}
                      {selectedSalon.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <span>✉</span>
                          <span>{selectedSalon.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Services', value: salonServices.length },
                      { label: 'Stylists', value: salonStaffList.length },
                      { label: 'Branches', value: salonBranchesList.length },
                    ].map(stat => (
                      <div key={stat.label} style={{
                        textAlign: 'center', minWidth: '70px',
                        padding: '0.75rem 1rem',
                        background: 'var(--gold-bg)',
                        border: '1px solid rgba(112,130,56,0.3)',
                        borderRadius: '10px'
                      }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--gold-primary)' }}>{stat.value}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {salonBranchesList.length > 0 && (
                <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={16} /> Branches & Locations
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
                    {salonBranchesList.map(branch => (
                      <div key={branch._id} style={{
                        padding: '0.85rem 1rem',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{branch.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{[branch.address, branch.city, branch.state].filter(Boolean).join(', ')}</div>
                        {branch.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>📞 {branch.phone}</div>}
                        <span style={{
                          display: 'inline-block', marginTop: '0.4rem',
                          fontSize: '0.65rem', padding: '0.15rem 0.5rem',
                          borderRadius: '20px',
                          background: branch.status === 'Active' ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
                          color: branch.status === 'Active' ? 'var(--accent-green)' : 'var(--accent-red)',
                          fontWeight: '600'
                        }}>{branch.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {salonStaffList.length > 0 && (
                <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} /> Our Team
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85rem' }}>
                    {salonStaffList.map(member => (
                      <div key={member._id} style={{
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '10px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--gold-primary) 0%, #b38f20 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          margin: '0 auto 0.6rem auto',
                          fontSize: '1.1rem', fontWeight: '700', color: '#000'
                        }}>
                          {member.name.charAt(0)}
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{member.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', marginTop: '0.2rem' }}>{member.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass-card">
                <h3 style={{ fontSize: '1rem', color: 'var(--gold-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} /> Services & Treatments
                </h3>
                {salonServices.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No services listed yet.</p>
                ) : (
                  salonCats.map(cat => (
                    <div key={cat} style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{
                        fontSize: '0.78rem', color: 'var(--gold-primary)',
                        textTransform: 'uppercase', letterSpacing: '0.6px',
                        marginBottom: '0.75rem',
                        paddingBottom: '0.4rem',
                        borderBottom: '1px solid var(--border-light)'
                      }}>{cat}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {salonServices.filter(s => s.category === cat).map(srv => (
                          <div
                            key={srv._id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.9rem 1rem',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid var(--border-light)',
                              borderRadius: '8px',
                              transition: 'var(--transition-smooth)'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{srv.name}</strong>
                              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Clock size={11} /> {srv.duration || 30} mins
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontWeight: '700', color: 'var(--gold-primary)', fontSize: '0.95rem' }}>₹{srv.price}</span>
                              <button
                                onClick={() => handleOpenBookingModal(srv)}
                                style={{
                                  padding: '0.4rem 0.85rem',
                                  background: 'linear-gradient(135deg, var(--gold-primary) 0%, #b38f20 100%)',
                                  color: '#000',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  transition: 'var(--transition-smooth)'
                                }}
                              >
                                Book Now
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {/* BOOKING MODAL */}
        {showBookingModal && selectedService && selectedSalon && (
          <div
            className="modal-backdrop-overlay"
            onClick={handleCloseBookingModal}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.75)',
              zIndex: 9000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--gold-primary)',
                borderRadius: '14px',
                padding: '2rem',
                width: '100%',
                maxWidth: '480px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative'
              }}
            >
              <button
                onClick={handleCloseBookingModal}
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-light)',
                  borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-secondary)'
                }}
              >
                <X size={16} />
              </button>

              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} style={{ color: 'var(--gold-primary)' }} /> Book Your Session
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{selectedSalon.name}</p>

              {bookingSuccess ? (
                <div style={{
                  textAlign: 'center', padding: '2rem 1rem',
                  background: 'rgba(46,204,113,0.07)',
                  border: '1px solid rgba(46,204,113,0.3)',
                  borderRadius: '10px'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✅</div>
                  <p style={{ color: 'var(--accent-green)', fontWeight: '600', fontSize: '0.9rem' }}>{bookingSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--gold-bg)',
                    border: '1px solid rgba(112,130,56,0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedService.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={11} /> {selectedService.duration || 30} mins
                      </div>
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--gold-primary)' }}>₹{selectedService.price}</span>
                  </div>

                  <div className="form-group">
                    <label>Select Branch</label>
                    <select className="form-control" required value={bookingBranchId} onChange={e => setBookingBranchId(e.target.value)}>
                      {db.branches.filter(b => b.salonId === selectedSalon._id).map(b => (
                        <option key={b._id} value={b._id}>{b.name}{b.city ? ` — ${b.city}` : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Select Stylist</label>
                    <select className="form-control" required value={bookingStaffId} onChange={e => setBookingStaffId(e.target.value)}>
                      {db.staff.filter(st => st.salonId === selectedSalon._id).map(st => (
                        <option key={st._id} value={st._id}>{st.name} ({st.role})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Appointment Date</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={bookingDate}
                      onChange={e => setBookingDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Preferred Time Slot</label>
                    <select className="form-control" required value={bookingTime} onChange={e => setBookingTime(e.target.value)}>
                      {['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'].map(t => {
                        const h = parseInt(t);
                        const label = h > 12 ? `${h - 12}:00 PM` : (h === 12 ? '12:00 PM' : `${t} AM`);
                        return <option key={t} value={t}>{label}</option>;
                      })}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="gold-btn"
                    disabled={bookingLoading}
                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem', marginTop: '0.25rem' }}
                  >
                    {bookingLoading ? 'Confirming...' : `✓ Confirm Appointment — ₹${selectedService.price}`}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STAFF DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  if (currentUser.role === 'STAFF') {
    return <StaffDashboard setActivePage={setActivePage} />;
  }


  // ════════════════════════════════════════════════════════════════════════════
  // OWNER / MANAGER PREMIUM SAAS DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="page-container animated-fade-in dash-premium">

      {/* ─── HEADER ───────────────────────────────────────────────────────── */}
      <div className="dash-hero-header">
        <div className="dash-hero-left">
          <div className="dash-hero-greeting">
            <h1>Dashboard</h1>
            <p>Real-time business analytics & operational insights</p>
          </div>
          <div className="dash-hero-date">
            <Clock size={14} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <div className="dash-hero-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['SALON_OWNER', 'FRANCHISE_OWNER', 'SALON_MANAGER'].includes(currentUser.role) && (
            <>
              <button onClick={() => setActivePage('billing')} className="gold-btn">
                <CreditCard size={15} /> POS Invoice
              </button>
              <button onClick={() => setActivePage('customers')} className="outline-btn">
                <Users size={15} /> + Client
              </button>
              <button onClick={() => setActivePage('inventory')} className="outline-btn hide-mobile">
                <Package size={15} /> + Product
              </button>
            </>
          )}
          <button onClick={() => setActivePage('appointments')} className="outline-btn">
            <Calendar size={15} /> Book Appt
          </button>
        </div>
      </div>


      {/* ─── KPI CARDS GRID ───────────────────────────────────────────────── */}
      <div className="dash-kpi-grid">
        <KpiCard
          title="Today's Revenue"
          value={`₹${todayRevenue.toLocaleString()}`}
          subtitle="Updated live"
          icon={TrendingUp}
          iconColor="var(--gold-primary)"
          glowColor="rgba(112,130,56,0.2)"
          trend={12.5}
          trendUp={true}
          accentBorder="var(--gold-primary)"
          delay={0}
        />
        <KpiCard
          title="Today's Profit"
          value={`₹${todayProfit.toLocaleString()}`}
          subtitle={`Net after ₹${todayExpenses.toLocaleString()} expenses`}
          icon={DollarSign}
          iconColor="#2ecc71"
          glowColor="rgba(46,204,113,0.15)"
          trend={8.3}
          trendUp={true}
          accentBorder="#2ecc71"
          delay={50}
        />
        <KpiCard
          title="Today's Expenses"
          value={`₹${todayExpenses.toLocaleString()}`}
          subtitle="Salary, Rent & Utilities"
          icon={Receipt}
          iconColor="var(--accent-red)"
          trend={3.2}
          trendUp={false}
          accentBorder="var(--accent-red)"
          delay={100}
        />
        <KpiCard
          title="Today's Appointments"
          value={todayAppointmentCount}
          subtitle={`${todayAppointments.filter(a => a.status === 'Completed').length} completed`}
          icon={Calendar}
          iconColor="#3498db"
          glowColor="rgba(52,152,219,0.15)"
          trend={15.7}
          trendUp={true}
          accentBorder="#3498db"
          delay={150}
        />
        <KpiCard
          title="Total Customers"
          value={totalCustomers}
          subtitle={`${activeMemberships.length} active members`}
          icon={Users}
          iconColor="#9b59b6"
          glowColor="rgba(155,89,182,0.15)"
          trend={5.4}
          trendUp={true}
          accentBorder="#9b59b6"
          delay={200}
        />
        <KpiCard
          title="New Customers"
          value={newCustomersThisMonth || totalCustomers}
          subtitle={`Acquired in ${currentMonthName}`}
          icon={UserPlus}
          iconColor="#2ecc71"
          glowColor="rgba(46,204,113,0.15)"
          trend={22.1}
          trendUp={true}
          accentBorder="#2ecc71"
          delay={250}
        />
        <KpiCard
          title="Active Staff"
          value={activeStaffCount}
          subtitle="Currently on roster"
          icon={UserCheck}
          iconColor="var(--gold-primary)"
          glowColor="rgba(112,130,56,0.15)"
          trend={4.2}
          trendUp={true}
          accentBorder="var(--gold-primary)"
          delay={300}
        />
        <KpiCard
          title="Inventory Alerts"
          value={lowStockAlerts.length}
          subtitle={lowStockAlerts.length > 0 ? 'Items need restocking' : 'All items fully stocked'}
          icon={Package}
          iconColor={lowStockAlerts.length > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}
          glowColor={lowStockAlerts.length > 0 ? 'rgba(231,76,60,0.15)' : 'rgba(46,204,113,0.15)'}
          trend={lowStockAlerts.length > 0 ? 12.0 : 0.0}
          trendUp={lowStockAlerts.length === 0}
          accentBorder={lowStockAlerts.length > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}
          delay={350}
        />
      </div>


      {/* ─── CHARTS ROW 1: Revenue vs Expenses + Monthly Profit ──────── */}
      <div className="dash-charts-row">
        <div className="dash-chart-card dash-chart-wide">
          <SectionHeader icon={BarChart3} title="Revenue vs Expenses" action={() => setActivePage('analytics')} actionLabel="View Analytics" actionIcon={ArrowUpRight} />
          <RevenueExpenseChart />
        </div>
        <div className="dash-chart-card">
          <SectionHeader icon={TrendingUp} title="Monthly Profit" />
          <MonthlyProfitChart />
        </div>
      </div>


      {/* ─── CHARTS ROW 2: Appointment Trend + Customer Growth + Services */}
      <div className="dash-charts-row-3">
        <div className="dash-chart-card">
          <SectionHeader icon={Calendar} title="Appointment Trend" action={() => setActivePage('appointments')} actionLabel="Schedule" actionIcon={ArrowUpRight} />
          <AppointmentTrendChart />
        </div>
        <div className="dash-chart-card">
          <SectionHeader icon={Users} title="Customer Growth" action={() => setActivePage('customers')} actionLabel="View All" actionIcon={ArrowUpRight} />
          <CustomerGrowthChart />
        </div>
        <div className="dash-chart-card">
          <SectionHeader icon={Sparkles} title="Popular Services" />
          <PopularServicesDonut />
        </div>
      </div>


      {/* ─── BOTTOM PANELS ────────────────────────────────────────────── */}
      <div className="dash-bottom-grid">

        {/* Recent Activities */}
        <div className="dash-panel-card">
          <SectionHeader icon={Activity} title="Recent Activities" />
          <div className="dash-activity-list">
            {recentActivities.length === 0 ? (
              <p className="dash-empty-state">No recent activities to display.</p>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="dash-activity-item">
                  <div className="dash-activity-icon" style={{ background: `${act.color}15`, color: act.color }}>
                    <act.icon size={16} />
                  </div>
                  <div className="dash-activity-content">
                    <div className="dash-activity-title">{act.title}</div>
                    <div className="dash-activity-detail">{act.detail}</div>
                  </div>
                  <div className="dash-activity-time">{act.time}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="dash-panel-card">
          <SectionHeader icon={Calendar} title="Upcoming Appointments" action={() => setActivePage('appointments')} actionLabel="View All" actionIcon={ArrowUpRight} />
          <div className="dash-upcoming-list">
            {upcomingAppointments.length === 0 ? (
              <p className="dash-empty-state">No upcoming appointments.</p>
            ) : (
              upcomingAppointments.map((appt) => {
                const customer = (() => {
                  if (appt.customerId && typeof appt.customerId === 'object') return appt.customerId;
                  return db.customers.find(c => String(c._id) === String(appt.customerId));
                })();
                const staffObj = (() => {
                  const sid = typeof appt.staffId === 'object' ? appt.staffId?._id : appt.staffId;
                  return db.staff.find(s => String(s._id) === String(sid));
                })();
                return (
                  <div key={appt._id} className="dash-upcoming-item">
                    <div className="dash-upcoming-avatar">
                      {customer ? customer.name.charAt(0) : 'W'}
                    </div>
                    <div className="dash-upcoming-info">
                      <div className="dash-upcoming-name">{customer ? customer.name : 'Walk-in Client'}</div>
                      <div className="dash-upcoming-service">
                        {appt.services.map(s => s.name).join(', ')} • {staffObj ? staffObj.name : 'Any'}
                      </div>
                    </div>
                    <div className="dash-upcoming-meta">
                      <div className="dash-upcoming-time">{appt.time}</div>
                      <span className={`badge ${appt.status.toLowerCase().replace(' ', '')}`}>{appt.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions + Inventory Alerts */}
        <div className="dash-side-stack">
          {/* Quick Actions */}
          <div className="dash-panel-card">
            <SectionHeader icon={Zap} title="Quick Actions" />
            <div className="dash-quick-actions">
              <button className="dash-quick-btn" onClick={() => setActivePage('billing')}>
                <div className="dash-quick-icon" style={{ background: 'rgba(112,130,56,0.12)', color: 'var(--gold-primary)' }}>
                  <CreditCard size={18} />
                </div>
                <span>New Invoice</span>
              </button>
              <button className="dash-quick-btn" onClick={() => setActivePage('appointments')}>
                <div className="dash-quick-icon" style={{ background: 'rgba(52,152,219,0.12)', color: '#3498db' }}>
                  <PlusCircle size={18} />
                </div>
                <span>Add Appointment</span>
              </button>
              <button className="dash-quick-btn" onClick={() => setActivePage('customers')}>
                <div className="dash-quick-icon" style={{ background: 'rgba(46,204,113,0.12)', color: '#2ecc71' }}>
                  <UserPlus size={18} />
                </div>
                <span>Add Customer</span>
              </button>
              <button className="dash-quick-btn" onClick={() => setActivePage('inventory')}>
                <div className="dash-quick-icon" style={{ background: 'rgba(155,89,182,0.12)', color: '#9b59b6' }}>
                  <ShoppingBag size={18} />
                </div>
                <span>Inventory</span>
              </button>
              <button className="dash-quick-btn" onClick={() => setActivePage('staff')}>
                <div className="dash-quick-icon" style={{ background: 'rgba(230,126,34,0.12)', color: '#e67e22' }}>
                  <Users size={18} />
                </div>
                <span>Manage Staff</span>
              </button>
              <button className="dash-quick-btn" onClick={() => setActivePage('analytics')}>
                <div className="dash-quick-icon" style={{ background: 'rgba(231,76,60,0.12)', color: '#e74c3c' }}>
                  <BarChart3 size={18} />
                </div>
                <span>Analytics</span>
              </button>
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="dash-panel-card">
            <SectionHeader icon={AlertTriangle} title="Inventory Alerts" action={() => setActivePage('inventory')} actionLabel="Manage" actionIcon={ArrowUpRight} />
            <div className="dash-inventory-list">
              {lowStockProductsList.length === 0 ? (
                <div className="dash-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.5rem' }}>
                  <CheckCircle2 size={24} style={{ color: 'var(--accent-green)' }} />
                  <span>All products fully stocked</span>
                </div>
              ) : (
                lowStockProductsList.map((prod) => (
                  <div key={prod._id} className="dash-inventory-item">
                    <div className="dash-inventory-info">
                      <div className="dash-inventory-name">{prod.name}</div>
                      <div className="dash-inventory-sku">SKU: {prod.sku}</div>
                    </div>
                    <div className="dash-inventory-stock">
                      <span className="dash-inventory-qty" style={{ color: prod.quantity === 0 ? 'var(--accent-red)' : 'var(--accent-orange)' }}>
                        {prod.quantity} left
                      </span>
                      <div className="dash-inventory-bar">
                        <div
                          className="dash-inventory-bar-fill"
                          style={{
                            width: `${Math.min((prod.quantity / (prod.lowStockThreshold * 2)) * 100, 100)}%`,
                            background: prod.quantity === 0 ? 'var(--accent-red)' : 'var(--accent-orange)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
