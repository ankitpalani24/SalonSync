import React, { useState, useMemo } from 'react';
import {
  Search, Plus, Edit, Trash2, Mail, Phone, Calendar as CalendarIcon,
  User, Download, X, Star, Sparkles, CreditCard, ShoppingBag,
  Clock, ArrowUpRight, CheckCircle2, MessageSquare, Filter, SlidersHorizontal,
  ChevronRight, Camera, Image, Layers, Activity, Award, ExternalLink,
  ShieldCheck, RefreshCw, FileText, ArrowRight, Heart
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// ─── SAMPLE BEFORE & AFTER TRANSFORMATION SEED DATA ──────────────────────────
const INITIAL_BEFORE_AFTER = {
  cust_1: [
    {
      id: 'ba_1',
      title: 'Global Balayage & Gold Hair Transformation',
      date: '2026-06-20',
      serviceName: 'Global Balayage & Highlights',
      beforeImg: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',
      afterImg: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=500',
      notes: 'Lightened from natural dark brown to warm honey gold balayage with Olaplex bond repair.'
    }
  ],
  cust_3: [
    {
      id: 'ba_2',
      title: '24K Gold Rejuvenation Facial',
      date: '2026-06-15',
      serviceName: '24K Gold Luxury Facial',
      beforeImg: 'https://images.unsplash.com/photo-1512290900676-26c2a4d4b51d?w=500',
      afterImg: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500',
      notes: 'Instant skin hydration & radiant golden glow achieved.'
    }
  ]
};

// Helper for date formatting
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CUSTOMER CRM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Customers = ({ setActivePage, setSelectedApptForCheckout }) => {
  const { tenantFilter, db, addCustomer, updateCustomer, deleteCustomer, addNotification, addToast } = useApp();

  const customers = tenantFilter(db.customers);
  const invoices = tenantFilter(db.invoices);
  const appointments = tenantFilter(db.appointments);
  const staffList = tenantFilter(db.staff);
  const servicesList = tenantFilter(db.services);

  // Active Directory & Filter States
  const [selectedCust, setSelectedCust] = useState(customers[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('ALL');
  const [segmentFilter, setSegmentFilter] = useState('ALL'); // ALL, VIP, ACTIVE, NEW
  const [sortBy, setSortBy] = useState('SPENT_HIGH'); // SPENT_HIGH, VISITS_HIGH, RECENT, NAME

  // Workspace Tabs: 'timeline', 'appointments', 'invoices', 'products', 'beforeafter'
  const [activeTab, setActiveTab] = useState('timeline');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBAModal, setShowBAModal] = useState(false);

  // Before & After Local State
  const [transformations, setTransformations] = useState(INITIAL_BEFORE_AFTER);

  // Form States
  const [photo, setPhoto] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Female');
  const [birthday, setBirthday] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [membershipLevel, setMembershipLevel] = useState('None');

  // Before & After Form States
  const [baTitle, setBaTitle] = useState('');
  const [baService, setBaService] = useState('');
  const [baBeforeUrl, setBaBeforeUrl] = useState('');
  const [baAfterUrl, setBaAfterUrl] = useState('');
  const [baNotes, setBaNotes] = useState('');

  // ────────────────────────────────────────────────────────────────────────────
  // CUSTOMER ANALYTICS COMPUTATIONS (PER CUSTOMER)
  // ────────────────────────────────────────────────────────────────────────────
  const getCustomerAnalytics = (cust) => {
    if (!cust) return null;
    const cid = String(cust._id);

    // Invoices for this customer
    const custInvoices = invoices.filter(inv => {
      const id = inv.customerId && typeof inv.customerId === 'object' ? inv.customerId._id : inv.customerId;
      return String(id) === cid;
    });

    // Appointments for this customer
    const custAppts = appointments.filter(appt => {
      const id = appt.customerId && typeof appt.customerId === 'object' ? appt.customerId._id : appt.customerId;
      return String(id) === cid;
    });

    const totalSpent = custInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
    const totalVisits = custInvoices.length > 0 ? custInvoices.length : custAppts.filter(a => a.status === 'Completed').length;
    const avgBill = totalVisits > 0 ? Math.round(totalSpent / totalVisits) : 0;

    // Favorite Staff (Most booked staff member)
    const staffFrequency = {};
    custInvoices.forEach(inv => {
      const sid = typeof inv.staffId === 'object' ? inv.staffId?._id : inv.staffId;
      if (sid) staffFrequency[sid] = (staffFrequency[sid] || 0) + 1;
    });
    custAppts.forEach(appt => {
      const sid = typeof appt.staffId === 'object' ? appt.staffId?._id : appt.staffId;
      if (sid) staffFrequency[sid] = (staffFrequency[sid] || 0) + 1;
    });

    let favStaffId = Object.keys(staffFrequency).sort((a, b) => staffFrequency[b] - staffFrequency[a])[0];
    const favStaff = staffList.find(s => String(s._id) === String(favStaffId)) || staffList[0];

    // Favorite Services (Top services booked)
    const serviceFrequency = {};
    custInvoices.forEach(inv => {
      (inv.services || []).forEach(s => {
        serviceFrequency[s.name] = (serviceFrequency[s.name] || 0) + (s.quantity || 1);
      });
    });
    custAppts.forEach(appt => {
      (appt.services || []).forEach(s => {
        serviceFrequency[s.name] = (serviceFrequency[s.name] || 0) + 1;
      });
    });

    const topServices = Object.keys(serviceFrequency)
      .sort((a, b) => serviceFrequency[b] - serviceFrequency[a])
      .slice(0, 4)
      .map(servName => ({ name: servName, count: serviceFrequency[servName] }));

    // Products Purchased
    const productsBought = [];
    custInvoices.forEach(inv => {
      (inv.products || []).forEach(p => {
        productsBought.push({
          ...p,
          invoiceNumber: inv.invoiceNumber,
          date: inv.createdAt ? inv.createdAt.split('T')[0] : 'N/A'
        });
      });
    });

    // Timeline Activities Aggregation
    const timeline = [];

    custAppts.forEach(a => {
      timeline.push({
        id: `appt-${a._id}`,
        type: 'appointment',
        icon: CalendarIcon,
        color: '#3498db',
        title: `Appointment ${a.status}: ${a.services ? a.services.map(s => s.name).join(', ') : 'Treatment'}`,
        detail: `Scheduled for ${a.date} at ${a.time}`,
        date: a.date,
        rawDate: new Date(a.date)
      });
    });

    custInvoices.forEach(i => {
      timeline.push({
        id: `inv-${i._id}`,
        type: 'invoice',
        icon: CreditCard,
        color: 'var(--gold-primary)',
        title: `Completed POS Checkout — ${i.invoiceNumber}`,
        detail: `Paid ₹${i.finalAmount.toLocaleString()} via ${i.paymentMethod || 'Cash'} (+${Math.round(i.finalAmount / 100)} loyalty pts)`,
        date: i.createdAt ? i.createdAt.split('T')[0] : 'Recent',
        rawDate: i.createdAt ? new Date(i.createdAt) : new Date()
      });
    });

    // Sort timeline newest first
    timeline.sort((a, b) => b.rawDate - a.rawDate);

    return {
      custInvoices,
      custAppts,
      totalSpent,
      totalVisits,
      avgBill,
      favStaff,
      topServices,
      productsBought,
      timeline
    };
  };

  // Currently selected analytics
  const selectedAnalytics = useMemo(() => getCustomerAnalytics(selectedCust), [selectedCust, invoices, appointments, staffList]);

  // ────────────────────────────────────────────────────────────────────────────
  // FILTERING & SORTING DIRECTORY
  // ────────────────────────────────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = cust.name.toLowerCase().includes(q);
        const matchesPhone = cust.phone && cust.phone.includes(q);
        const matchesEmail = cust.email && cust.email.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail) return false;
      }

      // Membership Filter
      if (membershipFilter !== 'ALL') {
        if (cust.membershipLevel !== membershipFilter) return false;
      }

      // Segment Filter
      if (segmentFilter !== 'ALL') {
        const analytics = getCustomerAnalytics(cust);
        if (segmentFilter === 'VIP' && (analytics?.totalSpent || 0) < 5000) return false;
        if (segmentFilter === 'ACTIVE' && (analytics?.totalVisits || 0) === 0) return false;
        if (segmentFilter === 'NEW' && cust.createdAt && new Date(cust.createdAt) < new Date(Date.now() - 30 * 86400000)) return false;
      }

      return true;
    }).sort((a, b) => {
      const aAnalytics = getCustomerAnalytics(a);
      const bAnalytics = getCustomerAnalytics(b);

      if (sortBy === 'SPENT_HIGH') {
        return (bAnalytics?.totalSpent || 0) - (aAnalytics?.totalSpent || 0);
      } else if (sortBy === 'VISITS_HIGH') {
        return (bAnalytics?.totalVisits || 0) - (aAnalytics?.totalVisits || 0);
      } else if (sortBy === 'NAME') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [customers, searchTerm, membershipFilter, segmentFilter, sortBy, invoices, appointments]);


  // ────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ────────────────────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setPhoto('');
    setName('');
    setPhone('');
    setEmail('');
    setGender('Female');
    setBirthday('');
    setAddress('');
    setNotes('');
    setMembershipLevel('None');
    setShowAddModal(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const created = addCustomer({
      name, phone, email, gender, birthday, address, notes,
      photo: photo || `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150`,
      membershipLevel,
      loyaltyPoints: 50 // Welcome bonus
    });
    addToast(`Added new customer ${name}`, 'success');
    setShowAddModal(false);
    if (created) setSelectedCust(created);
  };

  const handleOpenEdit = (cust) => {
    setSelectedCust(cust);
    setPhoto(cust.photo || '');
    setName(cust.name);
    setPhone(cust.phone);
    setEmail(cust.email || '');
    setGender(cust.gender || 'Female');
    setBirthday(cust.birthday || '');
    setAddress(cust.address || '');
    setNotes(cust.notes || '');
    setMembershipLevel(cust.membershipLevel || 'None');
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateCustomer(selectedCust._id, {
      name, phone, email, gender, birthday, address, notes, photo, membershipLevel
    });
    addToast(`Updated ${name}'s customer file`, 'info');
    setShowEditModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this customer profile?')) {
      deleteCustomer(id);
      setSelectedCust(null);
      addToast('Customer profile deleted', 'info');
    }
  };

  // Add Before & After Transformation
  const handleAddTransformation = (e) => {
    e.preventDefault();
    if (!selectedCust) return;
    const cid = String(selectedCust._id);
    const newBA = {
      id: `ba_${Date.now()}`,
      title: baTitle || 'Treatment Transformation',
      serviceName: baService || 'Salon Treatment',
      beforeImg: baBeforeUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',
      afterImg: baAfterUrl || 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=500',
      date: new Date().toLocaleDateString('en-CA'),
      notes: baNotes
    };

    setTransformations(prev => ({
      ...prev,
      [cid]: [newBA, ...(prev[cid] || [])]
    }));

    addToast('Transformation photos added to customer file', 'success');
    setShowBAModal(false);
    setBaTitle('');
    setBaService('');
    setBaBeforeUrl('');
    setBaAfterUrl('');
    setBaNotes('');
  };

  // Export Complete CRM CSV Data
  const handleExportData = () => {
    const headers = 'Name,Mobile,Email,Gender,Birthday,Address,Membership Tier,Loyalty Points,Total Visits,Total Spent (INR),Average Bill (INR)\n';
    const rows = filteredCustomers.map(c => {
      const analytics = getCustomerAnalytics(c);
      return `"${c.name}","${c.phone}","${c.email || ''}","${c.gender || ''}","${c.birthday || ''}","${(c.address || '').replace(/"/g, '""')}","${c.membershipLevel || 'None'}",${c.loyaltyPoints || 0},${analytics.totalVisits},${analytics.totalSpent},${analytics.avgBill}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SalonSync_Salesforce_CRM_Export_${new Date().toLocaleDateString('en-CA')}.csv`;
    link.click();
    addToast('Exported complete CRM customer database to CSV', 'success');
  };

  const handleSendWhatsApp = (cust) => {
    if (!cust) return;
    const msg = `Hello ${cust.name}, greetings from SalonSync! Check out your exclusive loyalty balance (${cust.loyaltyPoints || 0} pts) & book your next session.`;
    addNotification({
      customerId: cust._id,
      type: 'WhatsApp',
      message: msg
    });
    addToast(`Simulated WhatsApp alert sent to ${cust.name}`, 'success');
  };


  // ════════════════════════════════════════════════════════════════════════════
  // JSX RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="page-container animated-fade-in crm-container">

      {/* ─── SALESFORCE / HUBSPOT STYLE CRM HERO HEADER ───────────────────── */}
      <div className="crm-hero-header">
        <div className="crm-hero-left">
          <h1>Customer Relationship Management</h1>
          <p>Salesforce-grade 360° client profiles, treatment analytics, & lifetime value tracking</p>
        </div>

        <div className="crm-hero-actions">
          <button onClick={handleExportData} className="outline-btn">
            <Download size={16} /> Export CRM CSV
          </button>
          <button onClick={handleOpenAdd} className="gold-btn">
            <Plus size={16} /> Add Customer File
          </button>
        </div>
      </div>


      {/* ─── CRM OVERVIEW SUMMARY CARDS ───────────────────────────────────── */}
      <div className="crm-summary-grid">
        <div className="crm-summary-card">
          <div className="crm-sum-icon" style={{ background: 'rgba(112, 130, 56, 0.12)', color: 'var(--gold-primary)' }}>
            <User size={20} />
          </div>
          <div>
            <div className="crm-sum-value">{customers.length}</div>
            <div className="crm-sum-title">Total Database Contacts</div>
          </div>
        </div>

        <div className="crm-summary-card">
          <div className="crm-sum-icon" style={{ background: 'rgba(46, 204, 113, 0.12)', color: '#2ecc71' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div className="crm-sum-value">
              {customers.filter(c => c.membershipLevel && c.membershipLevel !== 'None').length}
            </div>
            <div className="crm-sum-title">Active Club Members</div>
          </div>
        </div>

        <div className="crm-summary-card">
          <div className="crm-sum-icon" style={{ background: 'rgba(52, 152, 219, 0.12)', color: '#3498db' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <div className="crm-sum-value">
              ₹{invoices.reduce((s, i) => s + i.finalAmount, 0).toLocaleString()}
            </div>
            <div className="crm-sum-title">Lifetime CRM Revenue</div>
          </div>
        </div>

        <div className="crm-summary-card">
          <div className="crm-sum-icon" style={{ background: 'rgba(155, 89, 182, 0.12)', color: '#9b59b6' }}>
            <Award size={20} />
          </div>
          <div>
            <div className="crm-sum-value">
              ₹{invoices.length > 0 ? Math.round(invoices.reduce((s, i) => s + i.finalAmount, 0) / invoices.length).toLocaleString() : 0}
            </div>
            <div className="crm-sum-title">Average Order Value (AOV)</div>
          </div>
        </div>
      </div>


      {/* ─── MAIN CRM WORKSPACE GRID (DIRECTORY + 360 PROFILE) ────────────── */}
      <div className="crm-main-workspace">

        {/* ─── LEFT: DIRECTORY & SEARCH PANEL ────────────────────────────── */}
        <div className="crm-directory-card">
          <div className="crm-dir-header">
            <h3>Contact Directory</h3>
            <span className="crm-dir-count">{filteredCustomers.length} clients</span>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="crm-dir-toolbar">
            <div className="crm-search-input">
              <Search size={15} style={{ color: 'var(--gold-primary)' }} />
              <input
                type="text"
                placeholder="Search name, phone, email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && <X size={13} style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />}
            </div>

            <div className="crm-filter-row">
              <select value={membershipFilter} onChange={e => setMembershipFilter(e.target.value)}>
                <option value="ALL">All Tiers</option>
                <option value="Platinum">Platinum Club</option>
                <option value="Gold">Gold Club</option>
                <option value="Silver">Silver Club</option>
                <option value="None">Non-Member</option>
              </select>

              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="SPENT_HIGH">Spent: High to Low</option>
                <option value="VISITS_HIGH">Visits: High to Low</option>
                <option value="NAME">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Customer Directory List */}
          <div className="crm-dir-list">
            {filteredCustomers.length === 0 ? (
              <div className="crm-empty-dir">No clients found matching search & filters.</div>
            ) : (
              filteredCustomers.map(cust => {
                const isSelected = selectedCust && selectedCust._id === cust._id;
                const analytics = getCustomerAnalytics(cust);

                return (
                  <div
                    key={cust._id}
                    className={`crm-dir-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedCust(cust)}
                  >
                    <div className="crm-dir-avatar">
                      {cust.photo ? (
                        <img src={cust.photo} alt={cust.name} />
                      ) : (
                        <span>{cust.name.charAt(0)}</span>
                      )}
                    </div>

                    <div className="crm-dir-info">
                      <div className="crm-dir-name-row">
                        <span className="crm-dir-name">{cust.name}</span>
                        <span className={`badge ${cust.membershipLevel.toLowerCase()}`}>
                          {cust.membershipLevel}
                        </span>
                      </div>
                      <div className="crm-dir-contact">{cust.phone}</div>
                      <div className="crm-dir-stats">
                        <span>{analytics.totalVisits} visits</span> •
                        <span style={{ color: 'var(--gold-primary)', fontWeight: '600' }}> ₹{analytics.totalSpent.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>


        {/* ─── RIGHT: HUBSPOT 360° CLIENT PROFILE WORKSPACE ─────────────── */}
        <div className="crm-profile-card">
          {selectedCust ? (
            <div className="crm-360-workspace">

              {/* 1. PROFILE HEADER CARD */}
              <div className="crm-profile-hero">
                <div className="crm-profile-hero-left">
                  <div className="crm-profile-avatar-large">
                    {selectedCust.photo ? (
                      <img src={selectedCust.photo} alt={selectedCust.name} />
                    ) : (
                      <span>{selectedCust.name.charAt(0)}</span>
                    )}
                  </div>

                  <div className="crm-profile-identity">
                    <div className="crm-name-flex">
                      <h2>{selectedCust.name}</h2>
                      <span className={`badge ${selectedCust.membershipLevel.toLowerCase()}`}>
                        {selectedCust.membershipLevel} Club
                      </span>
                    </div>

                    <div className="crm-contact-pills">
                      <span>📱 {selectedCust.phone}</span>
                      {selectedCust.email && <span>✉ {selectedCust.email}</span>}
                      {selectedCust.gender && <span>👤 {selectedCust.gender}</span>}
                      {selectedCust.birthday && <span>🎂 {selectedCust.birthday}</span>}
                    </div>

                    {selectedCust.address && (
                      <div className="crm-address-line">
                        📍 {selectedCust.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Toolbar */}
                <div className="crm-profile-actions">
                  <button className="crm-action-icon-btn" onClick={() => handleSendWhatsApp(selectedCust)} title="Send WhatsApp">
                    <MessageSquare size={16} />
                  </button>
                  <button className="crm-action-icon-btn" onClick={() => handleOpenEdit(selectedCust)} title="Edit Profile">
                    <Edit size={16} />
                  </button>
                  <button className="crm-action-icon-btn delete" onClick={() => handleDelete(selectedCust._id)} title="Delete Profile">
                    <Trash2 size={16} />
                  </button>
                  <button className="gold-btn" onClick={() => setActivePage && setActivePage('appointments')}>
                    <CalendarIcon size={14} /> Book Session
                  </button>
                </div>
              </div>


              {/* 2. CUSTOMER ANALYTICS DASHBOARD GRID (7 METRICS) */}
              <div className="crm-analytics-grid">
                {/* Metric 1: Total Visits */}
                <div className="crm-metric-card">
                  <div className="crm-metric-title">Total Visits</div>
                  <div className="crm-metric-value">{selectedAnalytics.totalVisits} visits</div>
                  <div className="crm-metric-sub">Completed checkouts</div>
                </div>

                {/* Metric 2: Total Spent */}
                <div className="crm-metric-card gold">
                  <div className="crm-metric-title">Lifetime Value (LTV)</div>
                  <div className="crm-metric-value" style={{ color: 'var(--gold-primary)' }}>
                    ₹{selectedAnalytics.totalSpent.toLocaleString()}
                  </div>
                  <div className="crm-metric-sub">Accumulated billings</div>
                </div>

                {/* Metric 3: Average Bill */}
                <div className="crm-metric-card">
                  <div className="crm-metric-title">Average Bill Value</div>
                  <div className="crm-metric-value">₹{selectedAnalytics.avgBill.toLocaleString()}</div>
                  <div className="crm-metric-sub">Per checkout average</div>
                </div>

                {/* Metric 4: Favorite Staff */}
                <div className="crm-metric-card">
                  <div className="crm-metric-title">Favourite Stylist</div>
                  <div className="crm-metric-value" style={{ fontSize: '1.1rem' }}>
                    {selectedAnalytics.favStaff ? selectedAnalytics.favStaff.name : 'Unassigned'}
                  </div>
                  <div className="crm-metric-sub">{selectedAnalytics.favStaff?.role || 'Staff'}</div>
                </div>

                {/* Metric 5: Membership Tier */}
                <div className="crm-metric-card">
                  <div className="crm-metric-title">Membership Tier</div>
                  <div className="crm-metric-value" style={{ fontSize: '1.1rem', color: 'var(--gold-primary)' }}>
                    {selectedCust.membershipLevel || 'None'}
                  </div>
                  <div className="crm-metric-sub">Perks & discounts enabled</div>
                </div>

                {/* Metric 6: Loyalty Points */}
                <div className="crm-metric-card">
                  <div className="crm-metric-title">Loyalty Points Balance</div>
                  <div className="crm-metric-value">{selectedCust.loyaltyPoints || 0} pts</div>
                  <div className="crm-metric-sub">Redeemable for treatments</div>
                </div>

                {/* Metric 7: Favorite Services */}
                <div className="crm-metric-card wide">
                  <div className="crm-metric-title">Favourite Services</div>
                  <div className="crm-fav-services-pills">
                    {selectedAnalytics.topServices.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No treatment history logged yet.</span>
                    ) : (
                      selectedAnalytics.topServices.map((srv, idx) => (
                        <span key={idx} className="crm-service-pill">
                          {srv.name} ({srv.count}x)
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>


              {/* 3. WORKSPACE HISTORY TABS */}
              <div className="crm-workspace-tabs">
                {[
                  { id: 'timeline', label: 'Activity Timeline', icon: Activity },
                  { id: 'appointments', label: `Appointments (${selectedAnalytics.custAppts.length})`, icon: CalendarIcon },
                  { id: 'invoices', label: `Invoices (${selectedAnalytics.custInvoices.length})`, icon: CreditCard },
                  { id: 'products', label: `Products (${selectedAnalytics.productsBought.length})`, icon: ShoppingBag },
                  { id: 'beforeafter', label: 'Before & After Gallery', icon: Camera },
                ].map(t => (
                  <button
                    key={t.id}
                    className={`crm-tab-btn ${activeTab === t.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    <t.icon size={15} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>


              {/* ─── TAB CONTENT PANELS ───────────────────────────────────── */}
              <div className="crm-tab-content">

                {/* TAB 1: TIMELINE */}
                {activeTab === 'timeline' && (
                  <div className="crm-timeline-container">
                    {selectedAnalytics.timeline.length === 0 ? (
                      <div className="crm-empty-state">No recent activity logged on customer timeline.</div>
                    ) : (
                      selectedAnalytics.timeline.map((act) => (
                        <div key={act.id} className="crm-timeline-item">
                          <div className="crm-timeline-marker" style={{ background: `${act.color}20`, color: act.color, borderColor: act.color }}>
                            <act.icon size={15} />
                          </div>
                          <div className="crm-timeline-content">
                            <div className="crm-timeline-header">
                              <span className="crm-timeline-title">{act.title}</span>
                              <span className="crm-timeline-date">{act.date}</span>
                            </div>
                            <div className="crm-timeline-detail">{act.detail}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 2: APPOINTMENTS */}
                {activeTab === 'appointments' && (
                  <div className="table-responsive">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Services</th>
                          <th>Stylist</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAnalytics.custAppts.length === 0 ? (
                          <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No appointment records found.</td></tr>
                        ) : (
                          selectedAnalytics.custAppts.map(appt => {
                            const staff = db.staff.find(s => String(s._id) === String(appt.staffId));
                            return (
                              <tr key={appt._id}>
                                <td>
                                  <strong style={{ color: 'var(--gold-primary)' }}>{appt.date}</strong> at {appt.time}
                                </td>
                                <td>{appt.services ? appt.services.map(s => s.name).join(', ') : 'Treatment'}</td>
                                <td>{staff ? staff.name : 'Stylist'}</td>
                                <td>
                                  <span className={`badge ${appt.status.toLowerCase().replace(' ', '')}`}>{appt.status}</span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 3: INVOICES */}
                {activeTab === 'invoices' && (
                  <div className="table-responsive">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Date</th>
                          <th>Payment Method</th>
                          <th>Final Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAnalytics.custInvoices.length === 0 ? (
                          <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No invoices found.</td></tr>
                        ) : (
                          selectedAnalytics.custInvoices.map(inv => (
                            <tr key={inv._id}>
                              <td><strong style={{ color: 'var(--text-primary)' }}>{inv.invoiceNumber}</strong></td>
                              <td>{inv.createdAt ? inv.createdAt.split('T')[0] : 'N/A'}</td>
                              <td><span className="gcal-tag">{inv.paymentMethod || 'UPI/Cash'}</span></td>
                              <td><span style={{ color: 'var(--gold-primary)', fontWeight: '700' }}>₹{inv.finalAmount.toLocaleString()}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 4: PRODUCTS PURCHASED */}
                {activeTab === 'products' && (
                  <div className="table-responsive">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Checkout Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAnalytics.productsBought.length === 0 ? (
                          <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No retail product purchases logged.</td></tr>
                        ) : (
                          selectedAnalytics.productsBought.map((prod, idx) => (
                            <tr key={idx}>
                              <td><strong>{prod.name}</strong></td>
                              <td>₹{prod.price}</td>
                              <td>{prod.quantity || 1} units</td>
                              <td>{prod.date}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 5: BEFORE & AFTER GALLERY */}
                {activeTab === 'beforeafter' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                        Client Treatment Transformations
                      </h4>
                      <button className="gold-btn" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }} onClick={() => setShowBAModal(true)}>
                        <Camera size={14} /> Add Transformation Photos
                      </button>
                    </div>

                    {(!transformations[selectedCust._id] || transformations[selectedCust._id].length === 0) ? (
                      <div className="crm-empty-state">
                        No before & after photos uploaded for {selectedCust.name}. Click "Add Transformation Photos" to upload.
                      </div>
                    ) : (
                      <div className="crm-ba-grid">
                        {transformations[selectedCust._id].map(item => (
                          <div key={item.id} className="crm-ba-card">
                            <div className="crm-ba-header">
                              <strong>{item.title}</strong>
                              <span className="crm-ba-date">{item.date}</span>
                            </div>

                            {/* Before & After Comparison Photos */}
                            <div className="crm-ba-photos">
                              <div className="crm-ba-photo-box">
                                <span className="crm-ba-tag before">BEFORE</span>
                                <img src={item.beforeImg} alt="Before Treatment" />
                              </div>
                              <div className="crm-ba-photo-box">
                                <span className="crm-ba-tag after">AFTER</span>
                                <img src={item.afterImg} alt="After Treatment" />
                              </div>
                            </div>

                            {item.notes && <p className="crm-ba-notes">"{item.notes}"</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="crm-no-selection">
              <User size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3>No Customer Selected</h3>
              <p>Select a client profile from the directory on the left to display complete 360° Salesforce-style CRM analytics & activity history.</p>
            </div>
          )}
        </div>

      </div>


      {/* ════════════════════════════════════════════════════════════════════
         ADD CUSTOMER MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-scrollable-content crm-modal" onClick={e => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3><User size={18} style={{ color: 'var(--gold-primary)' }} /> Add New Customer Profile</h3>
              <button className="gcal-modal-close" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Profile Photo Image URL</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="https://images.unsplash.com/..."
                  value={photo}
                  onChange={e => setPhoto(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" required className="form-control" placeholder="Customer full name" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input type="text" required className="form-control" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="form-control" placeholder="client@domain.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="grid-3-cols">
                <div className="form-group">
                  <label>Gender</label>
                  <select className="form-control" value={gender} onChange={e => setGender(e.target.value)}>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Birthday</label>
                  <input type="date" className="form-control" value={birthday} onChange={e => setBirthday(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Membership Tier</label>
                  <select className="form-control" value={membershipLevel} onChange={e => setMembershipLevel(e.target.value)}>
                    <option value="None">None</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Home Address</label>
                <input type="text" className="form-control" placeholder="Complete address" value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Notes & Treatment Preferences</label>
                <textarea className="form-control" rows="2" placeholder="Product allergies, tea preferences, etc." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <button type="submit" className="gold-btn crm-submit-btn">✓ Create Customer File</button>
            </form>
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════
         EDIT CUSTOMER MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {showEditModal && selectedCust && (
        <div className="modal-backdrop-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-scrollable-content crm-modal" onClick={e => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3><Edit size={18} style={{ color: 'var(--gold-primary)' }} /> Edit Customer File</h3>
              <button className="gcal-modal-close" onClick={() => setShowEditModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Profile Photo Image URL</label>
                <input type="text" className="form-control" value={photo} onChange={e => setPhoto(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" required className="form-control" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input type="text" required className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="grid-3-cols">
                <div className="form-group">
                  <label>Gender</label>
                  <select className="form-control" value={gender} onChange={e => setGender(e.target.value)}>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Birthday</label>
                  <input type="date" className="form-control" value={birthday} onChange={e => setBirthday(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Membership Tier</label>
                  <select className="form-control" value={membershipLevel} onChange={e => setMembershipLevel(e.target.value)}>
                    <option value="None">None</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Home Address</label>
                <input type="text" className="form-control" value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Notes & Preferences</label>
                <textarea className="form-control" rows="2" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <button type="submit" className="gold-btn crm-submit-btn">✓ Save Changes</button>
            </form>
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════
         BEFORE & AFTER UPLOAD MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {showBAModal && selectedCust && (
        <div className="modal-backdrop-overlay" onClick={() => setShowBAModal(false)}>
          <div className="modal-scrollable-content crm-modal" onClick={e => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3><Camera size={18} style={{ color: 'var(--gold-primary)' }} /> Add Transformation Photos</h3>
              <button className="gcal-modal-close" onClick={() => setShowBAModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddTransformation}>
              <div className="form-group">
                <label>Transformation Title *</label>
                <input type="text" required className="form-control" placeholder="e.g. Global Honey Balayage" value={baTitle} onChange={e => setBaTitle(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Service / Treatment Rendered</label>
                <select className="form-control" value={baService} onChange={e => setBaService(e.target.value)}>
                  <option value="">Select service...</option>
                  {servicesList.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Before Image URL *</label>
                <input type="text" required className="form-control" placeholder="https://images.unsplash.com/..." value={baBeforeUrl} onChange={e => setBaBeforeUrl(e.target.value)} />
              </div>

              <div className="form-group">
                <label>After Image URL *</label>
                <input type="text" required className="form-control" placeholder="https://images.unsplash.com/..." value={baAfterUrl} onChange={e => setBaAfterUrl(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Stylist Notes & Details</label>
                <textarea className="form-control" rows="2" placeholder="Formula used, processing time..." value={baNotes} onChange={e => setBaNotes(e.target.value)} />
              </div>

              <button type="submit" className="gold-btn crm-submit-btn">✓ Save Transformation Photos</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;
