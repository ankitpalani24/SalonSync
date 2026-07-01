import React from 'react';
import { 
  TrendingUp, Users, Calendar, AlertTriangle, 
  CreditCard, Sparkles, UserPlus, FileText, ArrowUpRight,
  MapPin, Phone, Star, X, Clock, ChevronLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RevenueLineChart, ProfitBarChart, ServiceShareDonut } from '../components/DashboardCharts';

const Dashboard = ({ setActivePage }) => {
  const { currentUser, currentBranch, tenantFilter, db, updateAppointmentStatus, addAppointment, addNotification } = useApp();

  // Exploration / Client States
  const [activeTab, setActiveTab] = React.useState('my-desk'); // 'my-desk' or 'explore'
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

  // Branch filter helper - uses String() comparison for MongoDB ObjectId safety
  const matchBranch = (itemBranchId) => {
    if (!currentBranch?._id) return true; // no branch selected, show all
    if (!itemBranchId) return true; // salon-wide items
    const a = typeof itemBranchId === 'object' ? itemBranchId?._id : itemBranchId;
    return String(a) === String(currentBranch._id);
  };
  const branchInvoices = salonInvoices.filter(i => matchBranch(i.branchId));
  const branchAppointments = salonAppointments.filter(a => matchBranch(a.branchId));
  const branchExpenses = salonExpenses.filter(e => matchBranch(e.branchId));
  
  // Date ranges
  const today = new Date().toLocaleDateString('en-CA');
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startOfMonthStr = startOfMonth.toLocaleDateString('en-CA');

  // ----------------------------------------------------
  // CALCULATIONS (PROFIT & LOSS ENGINE)
  // ----------------------------------------------------
  
  // Today's Revenue
  const todayRevenue = branchInvoices
    .filter(i => i.createdAt.startsWith(today))
    .reduce((sum, i) => sum + i.finalAmount, 0);

  // Monthly Revenue
  const monthlyRevenue = branchInvoices
    .filter(i => i.createdAt >= startOfMonthStr)
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

  // Product Inventory material costs from monthly invoices
  let monthlyMaterialCost = 0;
  branchInvoices.forEach(inv => {
    inv.services.forEach(item => {
      const originalServ = db.services.find(s => s._id === item.serviceId);
      if (originalServ) {
        monthlyMaterialCost += (originalServ.materialCost || 0) * (item.quantity || 1);
      }
    });
  });

  const netProfit = monthlyRevenue - monthlyExpenses - monthlyMaterialCost;

  // Stock Warnings
  const lowStockAlerts = salonProducts.filter(p => p.quantity <= p.lowStockThreshold);

  // Active Memberships
  const activeMemberships = salonCustomers.filter(c => c.membershipLevel !== 'None');

  // Widget Lists
  const upcomingAppointments = branchAppointments
    .filter(a => a.status !== 'Completed' && a.status !== 'Cancelled')
    .slice(0, 5);

  const recentPayments = branchInvoices.slice(-4).reverse();
  const lowStockProductsList = lowStockAlerts.slice(0, 4);

  if (currentUser.role === 'CLIENT') {
    // Find all customer profiles for this client across all salons to aggregate stats
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

    // The GET /appointments endpoint populates customerId into an object.
    // We match by checking if the ID or email/phone matches any profile of the client.
    const matchesCustomer = (apptCustomerId) => {
      if (!apptCustomerId) return false;
      const targetId = typeof apptCustomerId === 'object' && apptCustomerId !== null
        ? String(apptCustomerId._id)
        : String(apptCustomerId);
      
      const myCustomerIds = myCustomerProfiles.map(c => String(c._id));
      if (myCustomerIds.includes(targetId)) return true;

      // Fallback: check email/phone if populated
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

    // Favorite staff: find staff from past appointments
    const myStaffIds = pastMyAppts.map(a => a.staffId);
    const favStaffId = myStaffIds.sort((a,b) =>
      myStaffIds.filter(v => v===a).length - myStaffIds.filter(v => v===b).length
    ).pop();
    const favStaff = db.staff.find(s => s._id === favStaffId) || db.staff[0];

    // Exploration variables
    const salonsList = db.salons || [];
    const filteredSalons = salonsList.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.city && s.city.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSelectSalon = (salon) => {
      setSelectedSalon(salon);
      setSelectedService(null);
      setShowBookingModal(false);
      // Auto select first branch of that salon if available
      const salonBranches = db.branches.filter(b => b.salonId === salon._id);
      if (salonBranches.length > 0) {
        setBookingBranchId(salonBranches[0]._id);
      } else {
        setBookingBranchId('');
      }
      // Auto select first staff of that salon if available
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
        alert('Please fill out all booking fields');
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
          alert(`Booking failed: ${result.message}`);
          setBookingLoading(false);
          return;
        }

        // 1. Send notification to the Salon Owner
        addNotification({
          salonId: selectedSalon._id,
          customerId: null, // Exclude from client feed, direct to Owner
          type: 'Appointment',
          message: `New booking: Client ${currentUser.name} booked ${selectedService.name} on ${bookingDate} at ${bookingTime}.`,
          status: 'Sent'
        });

        // 2. Send confirmation notification to the Client
        const clientProfile = db.customers.find(c => c.email === currentUser.email || (c.phone && c.phone === currentUser.phone));
        if (clientProfile) {
          addNotification({
            customerId: clientProfile._id,
            salonId: null, // Exclude from Owner's feed, direct to Client
            type: 'Appointment',
            message: `Your booking for ${selectedService.name} at ${selectedSalon.name} is confirmed for ${bookingDate} at ${bookingTime}.`,
            status: 'Sent'
          });
        }

        setBookingSuccess('Session booked successfully! You can view it in My Desk.');
        setTimeout(() => {
          handleCloseBookingModal();
          setSelectedSalon(null);
          setActiveTab('my-desk');
        }, 2500);
      } catch (err) {
        console.error(err);
        alert('Booking failed. Please try again.');
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
                      // staffId may be a populated object or a plain ID string
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
            {/* Search bar */}
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
                      {/* Salon colour band */}
                      <div style={{ height: '6px', background: 'linear-gradient(90deg, var(--gold-primary) 0%, #b38f20 100%)' }} />

                      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Name & type */}
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

                        {/* Location & phone */}
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

                        {/* Quick stats */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'center', flex: 1, minWidth: '60px', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--gold-primary)' }}>{salonServices.length}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Services</div>
                          </div>
                          <div style={{ textAlign: 'center', flex: 1, minWidth: '60px', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--gold-primary)' }}>{salonStaffList.length}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Stylists</div>
                          </div>
                          <div style={{ textAlign: 'center', flex: 1, minWidth: '60px', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--gold-primary)' }}>{salonBranchesList.length}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Branches</div>
                          </div>
                        </div>

                        {/* CTA */}
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

        {/* VIEW 3: SALON DETAIL — Full page, NO sidebar booking by default */}
        {activeTab === 'explore' && selectedSalon && (() => {
          const salonServices = db.services.filter(s => s.salonId === selectedSalon._id);
          const salonCats = [...new Set(salonServices.map(s => s.category))];
          const salonBranchesList = db.branches.filter(b => b.salonId === selectedSalon._id);
          const salonStaffList = db.staff.filter(st => st.salonId === selectedSalon._id);

          return (
            <div style={{ marginBottom: '2rem' }}>
              {/* Back nav */}
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

              {/* ── SALON HERO CARD ────────────────────────────── */}
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

              {/* ── BRANCHES ───────────────────────────────────── */}
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

              {/* ── TEAM / STAFF ────────────────────────────────── */}
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

              {/* ── SERVICES CATALOGUE ──────────────────────────── */}
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

        {/* ── BOOKING MODAL ────────────────────────────────── */}
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
              {/* Close button */}
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
                  {/* Selected service summary */}
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

  if (currentUser.role === 'STAFF') {
    const myStaff = db.staff.find(s => s.name === currentUser.name || s.phone === currentUser.phone)
      || db.staff.find(s => s.name === "Aarav Sharma")
      || db.staff[0];

    const getCommissionForInvoice = (inv, staffMember) => {
      if (!inv || !staffMember || inv.staffId !== staffMember._id) return 0;
      let servicesTotal = 0;
      inv.services.forEach(item => {
        servicesTotal += (item.price || 0) * (item.quantity || 1);
      });
      const commissionPercentage = staffMember.commissionPercentage || 15;
      return Math.round(servicesTotal * (commissionPercentage / 100));
    };

    const myAppointmentsToday = db.appointments.filter(a => a.staffId === myStaff?._id && a.date === today);
    const completedToday = myAppointmentsToday.filter(a => a.status === 'Completed').length;
    const totalToday = myAppointmentsToday.length;

    const myAppointmentsMonth = db.appointments.filter(a => a.staffId === myStaff?._id && a.date >= startOfMonthStr && a.status === 'Completed');
    const monthlyCompletedCount = myAppointmentsMonth.length;

    const myInvoices = db.invoices.filter(i => i.staffId === myStaff?._id);
    const myInvoicesToday = myInvoices.filter(i => i.createdAt.startsWith(today));
    const myInvoicesMonth = myInvoices.filter(i => i.createdAt >= startOfMonthStr);

    const todayCommission = myInvoicesToday.reduce((sum, inv) => sum + getCommissionForInvoice(inv, myStaff), 0);
    const monthlyCommission = myInvoicesMonth.reduce((sum, inv) => sum + getCommissionForInvoice(inv, myStaff), 0);

    return (
      <div className="page-container animated-fade-in">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Welcome back, {currentUser.name}!</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Track your daily tasks, scheduled client treatments, and commissions earned.
            </p>
          </div>
          <div style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', padding: '0.4rem 0.8rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} style={{ color: 'var(--gold-primary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '600' }}>Stylist Commission Rate: {myStaff?.commissionPercentage || 15}%</span>
          </div>
        </div>

        {/* Staff KPI Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          <div className="glass-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Today's Appointments</span>
            <h3 style={{ fontSize: '1.65rem', color: 'var(--gold-primary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} /> {completedToday} / {totalToday} Done
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Completed vs scheduled today</p>
          </div>

          <div className="glass-card gold-border" style={{ background: 'var(--gold-bg)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)' }}>Today's Commission</span>
            <h3 style={{ fontSize: '1.65rem', color: 'var(--gold-primary)', marginTop: '0.5rem' }}>
              ₹{todayCommission.toLocaleString()}
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Earned from today's service checkouts</p>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monthly Treatments</span>
            <h3 style={{ fontSize: '1.65rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
              {monthlyCompletedCount} Completed
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Total checked-out treatments in June</p>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monthly Commissions</span>
            <h3 style={{ fontSize: '1.65rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
              ₹{monthlyCommission.toLocaleString()}
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Accumulated commission earnings</p>
          </div>
        </div>

        {/* Staff Lists: Schedule & Commission Ledgers */}
        <div className="grid-split-2-1" style={{ marginBottom: '2rem' }}>
          {/* Left panel: My Schedule */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>My Schedule Today</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myAppointmentsToday.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  No appointments assigned to you today.
                </p>
              ) : (
                myAppointmentsToday.map(appt => {
                  const client = (() => {
                    if (appt.customerId && typeof appt.customerId === 'object') return appt.customerId;
                    return db.customers.find(c => String(c._id) === String(appt.customerId));
                  })();
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
                          Client: {client ? client.name : 'Walk-in'} • Time: {appt.time}
                        </p>
                      </div>
                      <span className={`badge ${appt.status.toLowerCase().replace(' ', '')}`}>{appt.status}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Commission Ledgers */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Recent Commission Ledgers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myInvoicesMonth.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No invoice checkouts registered this month.
                </p>
              ) : (
                myInvoicesMonth.slice(0, 5).map((inv) => {
                  const client = (() => {
                    if (inv.customerId && typeof inv.customerId === 'object') return inv.customerId;
                    return db.customers.find(c => String(c._id) === String(inv.customerId));
                  })();
                  const comm = getCommissionForInvoice(inv, myStaff);
                  return (
                    <div key={inv._id} style={{
                      padding: '0.75rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.01)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        <span>{inv.invoiceNumber}</span>
                        <span style={{ color: 'var(--gold-primary)' }}>+₹{comm.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        <span>Client: {client ? client.name : 'Walk-in'}</span>
                        <span>Total: ₹{inv.finalAmount}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animated-fade-in">
      {/* Header Info */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Dashboard Overview</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time financial analytics and operational desk logs.
          </p>
        </div>
        <div className="flex-mobile-column" style={{ gap: '0.75rem' }}>
          {['SALON_OWNER', 'FRANCHISE_OWNER', 'SALON_MANAGER'].includes(currentUser.role) && (
            <button onClick={() => setActivePage('billing')} className="gold-btn">
              <CreditCard size={16} /> Open POS Checkout
            </button>
          )}
          <button onClick={() => setActivePage('appointments')} className="outline-btn">
            <Calendar size={16} /> Book Appointment
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Card 1 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Today's Revenue</span>
            <TrendingUp size={16} style={{ color: 'var(--gold-primary)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', color: 'var(--gold-primary)' }}>₹{todayRevenue.toLocaleString()}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Updated live</p>
        </div>

        {/* Card 2 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Monthly Revenue</span>
            <FileText size={16} style={{ color: 'var(--gold-primary)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', color: 'var(--text-primary)' }}>₹{monthlyRevenue.toLocaleString()}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Target: ₹3,00,000</p>
        </div>

        {/* Card 3 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Monthly Expenses</span>
            <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', color: 'var(--text-primary)' }}>₹{monthlyExpenses.toLocaleString()}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Salary, Rent & Utilities</p>
        </div>

        {/* Card 4 */}
        <div className="glass-card gold-border" style={{ background: 'var(--gold-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--gold-primary)' }}>Net Profit (June)</span>
            <Sparkles size={16} style={{ color: 'var(--gold-primary)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', color: 'var(--gold-primary)' }}>₹{netProfit.toLocaleString()}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Material Deductions Incurred</p>
        </div>

        {/* Card 5 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Active Members</span>
            <Users size={16} style={{ color: 'var(--accent-green)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', color: 'var(--text-primary)' }}>{activeMemberships.length}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Silver, Gold & Platinum</p>
        </div>

        {/* Card 6 */}
        <div className="glass-card" style={{ border: lowStockAlerts.length > 0 ? '1px solid rgba(231,76,60,0.3)' : '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Low Stock Items</span>
            <AlertTriangle size={16} style={{ color: lowStockAlerts.length > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', color: lowStockAlerts.length > 0 ? 'var(--accent-red)' : '#fff' }}>
            {lowStockAlerts.length}
          </h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Needs restocking</p>
        </div>
      </div>

      {/* Analytics Charts Panel */}
      <div className="grid-split-2-1" style={{ marginBottom: '2rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Revenue Trends (Last 6 Months)</h3>
          <RevenueLineChart />
        </div>
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Service Category Share</h3>
          <ServiceShareDonut />
        </div>
      </div>

      {/* Staff Performance Overview */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Staff Monthly Performance & Salary</h3>
          <button onClick={() => setActivePage('staff')} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            View Full Roster <ArrowUpRight size={12} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {salonStaff.map(member => {
            const staffInvoices = branchInvoices.filter(inv => {
              const sid = typeof inv.staffId === 'object' ? inv.staffId?._id : inv.staffId;
              return String(sid) === String(member._id) && inv.createdAt >= startOfMonthStr;
            });
            const servicesDone = staffInvoices.reduce((sum, inv) => sum + (inv.services?.length || 0), 0);
            const revenueGenerated = staffInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
            const commissionEarned = staffInvoices.reduce((sum, inv) => {
              const servRev = (inv.services || []).reduce((s, item) => s + ((item.price || 0) * (item.quantity || 1)), 0);
              return sum + Math.round(servRev * ((member.commissionPercentage || 0) / 100));
            }, 0);
            return (
              <div key={member._id} style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-light)',
                borderRadius: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'var(--gold-bg)', border: '1px solid var(--gold-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--gold-primary)', fontWeight: 'bold', fontSize: '0.9rem'
                  }}>
                    {member.name[0]}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{member.name}</strong>
                    <p style={{ fontSize: '0.65rem', color: 'var(--gold-primary)' }}>{member.role}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Services Done</span>
                    <p style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{servicesDone}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Revenue</span>
                    <p style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{revenueGenerated.toLocaleString()}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Commission</span>
                    <p style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>₹{commissionEarned.toLocaleString()}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Base Salary</span>
                    <p style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>₹{(member.salary || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {salonStaff.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>No staff members registered yet.</p>
          )}
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid-split-1-5-1">
        
        {/* Upcoming Appointments */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Upcoming Appointments</h3>
            <button onClick={() => setActivePage('appointments')} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View Schedule <ArrowUpRight size={12} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {upcomingAppointments.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No upcoming appointments today.</p>
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
                  <div key={appt._id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px'
                  }}>
                    <div>
                      <h5 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>{customer ? customer.name : 'Walk-in Client'}</h5>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {appt.services.map(s => s.name).join(', ')} • Stylist: {staffObj ? staffObj.name : 'Any'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--gold-primary)', fontWeight: '600' }}>{appt.time}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{appt.date}</p>
                      </div>
                      <span className={`badge ${appt.status.toLowerCase().replace(' ', '')}`}>{appt.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Inventory & Expense Recaps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Low Stock Alerts */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Low Stock Inventory Warnings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lowStockProductsList.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>All product items fully stocked.</p>
              ) : (
                lowStockProductsList.map((prod) => (
                  <div key={prod._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <div>
                      <h6 style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '500' }}>{prod.name}</h6>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SKU: {prod.sku}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--accent-red)', fontWeight: 'bold', fontSize: '0.85rem' }}>{prod.quantity} units</span>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Threshold: {prod.lowStockThreshold}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Recent Checkouts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentPayments.map((inv) => {
                const client = db.customers.find(c => c._id === inv.customerId);
                return (
                  <div key={inv._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{client ? client.name : 'Walk-in Client'}</span>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{inv.invoiceNumber} • {inv.paymentMethod}</p>
                    </div>
                    <span style={{ color: 'var(--gold-primary)', fontWeight: '600' }}>₹{inv.finalAmount}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
