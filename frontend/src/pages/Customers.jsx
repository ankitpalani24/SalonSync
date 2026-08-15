import React, { useState, useMemo } from 'react';
import {
  Search, Plus, Edit, Trash2, Mail, Phone, Calendar as CalendarIcon,
  User, Download, X, Star, Sparkles, CreditCard, ShoppingBag,
  Clock, ArrowUpRight, CheckCircle2, MessageSquare, Filter, SlidersHorizontal,
  ChevronRight, Camera, Image, Layers, Activity, Award, ExternalLink,
  ShieldCheck, RefreshCw, FileText, ArrowRight, Heart, DollarSign, Tag,
  ChevronLeft, Send, AlertCircle, Bookmark, Layers3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';

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

// Customer Status helper & badge color map
const STATUS_CONFIG = {
  'New': { label: 'New', badgeClass: 'status-new', color: '#3498db' },
  'Regular': { label: 'Regular', badgeClass: 'status-regular', color: '#2ecc71' },
  'VIP': { label: 'VIP', badgeClass: 'status-vip', color: '#9b59b6' },
  'Inactive': { label: 'Inactive', badgeClass: 'status-inactive', color: '#95a5a6' },
  'High Value': { label: 'High Value', badgeClass: 'status-high-value', color: '#d4af37' },
  'At Risk': { label: 'At Risk', badgeClass: 'status-at-risk', color: '#e67e22' }
};

const PAGE_SIZE = 10;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CUSTOMER CRM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Customers = ({ setActivePage, setSelectedApptForCheckout }) => {
  const { tenantFilter, db, addCustomer, updateCustomer, deleteCustomer, addNotification, addToast, hasPermission, PERMISSIONS } = useApp();

  const customers = tenantFilter(db.customers || []);
  const invoices = tenantFilter(db.invoices || []);
  const appointments = tenantFilter(db.appointments || []);
  const staffList = tenantFilter(db.staff || []);
  const servicesList = tenantFilter(db.services || []);
  const reviews = tenantFilter(db.reviews || []);

  // Directory Selection State
  const [selectedCust, setSelectedCust] = useState(customers[0] || null);

  // Search & Multi-Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [membershipFilter, setMembershipFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('SPENT_HIGH');

  // Directory Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // 10 Workspace Sub-View Tabs
  const [activeTab, setActiveTab] = useState('timeline');

  // Modal Dialog States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBAModal, setShowBAModal] = useState(false);

  // Dynamic Customer Notes Map
  const [customerNotesMap, setCustomerNotesMap] = useState({});
  const [newNoteText, setNewNoteText] = useState('');

  // Before & After Local Gallery State
  const [transformations, setTransformations] = useState(INITIAL_BEFORE_AFTER);

  // Form Field States
  const [photo, setPhoto] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Female');
  const [birthday, setBirthday] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [membershipLevel, setMembershipLevel] = useState('None');

  // Transformation Form States
  const [baTitle, setBaTitle] = useState('');
  const [baService, setBaService] = useState('');
  const [baBeforeUrl, setBaBeforeUrl] = useState('');
  const [baAfterUrl, setBaAfterUrl] = useState('');
  const [baNotes, setBaNotes] = useState('');

  // ────────────────────────────────────────────────────────────────────────────
  // 360° CUSTOMER ANALYTICS COMPUTATIONS
  // ────────────────────────────────────────────────────────────────────────────
  const getCustomerAnalytics = (cust) => {
    if (!cust) return null;
    const cid = String(cust._id);

    // Matching Invoices
    const custInvoices = invoices.filter(inv => {
      const id = inv.customerId && typeof inv.customerId === 'object' ? inv.customerId._id : inv.customerId;
      return String(id) === cid;
    });

    // Matching Appointments
    const custAppts = appointments.filter(appt => {
      const id = appt.customerId && typeof appt.customerId === 'object' ? appt.customerId._id : appt.customerId;
      return String(id) === cid;
    });

    // Matching Reviews
    const custReviews = reviews.filter(rev => {
      const id = rev.customerId && typeof rev.customerId === 'object' ? rev.customerId._id : rev.customerId;
      return String(id) === cid || rev.customerName === cust.name;
    });

    const totalSpent = custInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
    const totalVisits = custInvoices.length > 0 ? custInvoices.length : custAppts.filter(a => a.status === 'Completed').length;
    const avgBill = totalVisits > 0 ? Math.round(totalSpent / totalVisits) : 0;

    // Determine Last Visit Date
    let lastVisitDate = null;
    const dates = [];
    custInvoices.forEach(i => { if (i.createdAt) dates.push(new Date(i.createdAt)); });
    custAppts.forEach(a => { if (a.date) dates.push(new Date(a.date)); });
    if (dates.length > 0) {
      dates.sort((a, b) => b - a);
      lastVisitDate = dates[0].toISOString().split('T')[0];
    }

    // Favorite Staff Member
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
    const favStaff = staffList.find(s => String(s._id) === String(favStaffId)) || staffList[0] || null;

    // Favorite Services & Top Services
    const serviceFrequency = {};
    custInvoices.forEach(inv => {
      (inv.services || []).forEach(s => {
        if (s.name) serviceFrequency[s.name] = (serviceFrequency[s.name] || 0) + (s.quantity || 1);
      });
    });
    custAppts.forEach(appt => {
      (appt.services || []).forEach(s => {
        if (s.name) serviceFrequency[s.name] = (serviceFrequency[s.name] || 0) + 1;
      });
    });

    const topServices = Object.keys(serviceFrequency)
      .sort((a, b) => serviceFrequency[b] - serviceFrequency[a])
      .slice(0, 5)
      .map(servName => ({ name: servName, count: serviceFrequency[servName] }));

    const favService = topServices.length > 0 ? topServices[0] : null;

    // Retail Products Purchased
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

    // Payment History Breakdown
    const paymentHistory = custInvoices.map(inv => ({
      id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      date: inv.createdAt ? inv.createdAt.split('T')[0] : 'N/A',
      paymentMethod: inv.paymentMethod || 'Cash',
      amount: inv.finalAmount,
      status: inv.paymentStatus || 'Paid'
    }));

    // Customer Status Dynamic Calculation
    const now = new Date();
    const regDate = cust.createdAt ? new Date(cust.createdAt) : new Date(2025, 0, 15);
    const daysSinceReg = Math.max(0, Math.floor((now - regDate) / (1000 * 60 * 60 * 24)));

    let daysSinceLastVisit = Infinity;
    if (lastVisitDate) {
      const lv = new Date(lastVisitDate);
      if (!isNaN(lv.getTime())) {
        daysSinceLastVisit = Math.max(0, Math.floor((now - lv) / (1000 * 60 * 60 * 24)));
      }
    }

    let customerStatus = 'Regular';
    if (daysSinceLastVisit > 90 || (totalVisits === 0 && daysSinceReg > 60)) {
      customerStatus = 'Inactive';
    } else if (daysSinceLastVisit >= 60 && daysSinceLastVisit <= 90 && (totalVisits >= 2 || totalSpent >= 3000)) {
      customerStatus = 'At Risk';
    } else if (totalSpent >= 15000 || avgBill >= 2500) {
      customerStatus = 'High Value';
    } else if (totalSpent >= 10000 || totalVisits >= 10) {
      customerStatus = 'VIP';
    } else if (daysSinceReg <= 30 || totalVisits <= 1) {
      customerStatus = 'New';
    } else {
      customerStatus = 'Regular';
    }

    // Chronological Timeline Events Aggregation
    const timeline = [];

    // 1. Appointments
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

    // 2. Invoices & Checkouts
    custInvoices.forEach(i => {
      timeline.push({
        id: `inv-${i._id}`,
        type: 'invoice',
        icon: CreditCard,
        color: 'var(--gold-primary)',
        title: `Completed Checkout — ${i.invoiceNumber}`,
        detail: `Paid ₹${i.finalAmount.toLocaleString()} via ${i.paymentMethod || 'Cash'} (+${Math.round(i.finalAmount / 100)} loyalty pts)`,
        date: i.createdAt ? i.createdAt.split('T')[0] : 'Recent',
        rawDate: i.createdAt ? new Date(i.createdAt) : new Date()
      });
    });

    // 3. Reviews
    custReviews.forEach(r => {
      timeline.push({
        id: `rev-${r._id}`,
        type: 'review',
        icon: Star,
        color: '#f39c12',
        title: `Submitted ${r.rating}★ Review`,
        detail: r.comment ? `"${r.comment}"` : 'Rating recorded without written feedback',
        date: r.date ? new Date(r.date).toISOString().split('T')[0] : 'N/A',
        rawDate: r.date ? new Date(r.date) : new Date()
      });
    });

    // 4. Loyalty Point Events
    if (cust.loyaltyPoints > 0) {
      timeline.push({
        id: `loyalty-${cust._id}`,
        type: 'loyalty',
        icon: Award,
        color: '#9b59b6',
        title: `Loyalty Points Balance Updated`,
        detail: `Current Balance: ${cust.loyaltyPoints} redeemable points`,
        date: formatDate(cust.updatedAt || cust.createdAt),
        rawDate: cust.updatedAt ? new Date(cust.updatedAt) : new Date()
      });
    }

    // 5. Membership Tier Event
    if (cust.membershipLevel && cust.membershipLevel !== 'None') {
      timeline.push({
        id: `mship-${cust._id}`,
        type: 'membership',
        icon: ShieldCheck,
        color: '#16a085',
        title: `Enrolled in ${cust.membershipLevel} Club`,
        detail: `Enjoys exclusive tier discount & VIP perks`,
        date: formatDate(cust.createdAt),
        rawDate: cust.createdAt ? new Date(cust.createdAt) : new Date(2025, 0, 15)
      });
    }

    // 6. Timeline Notes
    const customNotes = customerNotesMap[cid] || [];
    customNotes.forEach(n => {
      timeline.push({
        id: `note-${n.id}`,
        type: 'note',
        icon: FileText,
        color: '#e74c3c',
        title: `Client Note Added`,
        detail: n.text,
        date: n.date,
        rawDate: new Date(n.rawDate)
      });
    });

    // Sort timeline newest first
    timeline.sort((a, b) => b.rawDate - a.rawDate);

    return {
      custInvoices,
      custAppts,
      custReviews,
      totalSpent,
      totalVisits,
      avgBill,
      lastVisitDate,
      favStaff,
      favService,
      topServices,
      productsBought,
      paymentHistory,
      customerStatus,
      timeline
    };
  };

  // Currently selected customer's calculated analytics
  const selectedAnalytics = useMemo(() => getCustomerAnalytics(selectedCust), [selectedCust, invoices, appointments, staffList, reviews, customerNotesMap]);

  // ────────────────────────────────────────────────────────────────────────────
  // FILTERING, SEARCH & SORTING DIRECTORY
  // ────────────────────────────────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      const analytics = getCustomerAnalytics(cust);

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = cust.name.toLowerCase().includes(q);
        const matchesPhone = cust.phone && cust.phone.includes(q);
        const matchesEmail = cust.email && cust.email.toLowerCase().includes(q);
        const matchesAddress = cust.address && cust.address.toLowerCase().includes(q);
        const matchesNotes = cust.notes && cust.notes.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesAddress && !matchesNotes) {
          return false;
        }
      }

      // Customer Status filter
      if (statusFilter !== 'ALL') {
        if (analytics?.customerStatus !== statusFilter) return false;
      }

      // Membership filter
      if (membershipFilter !== 'ALL') {
        if (cust.membershipLevel !== membershipFilter) return false;
      }

      // Gender filter
      if (genderFilter !== 'ALL') {
        if (cust.gender !== genderFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      const aAnalytics = getCustomerAnalytics(a);
      const bAnalytics = getCustomerAnalytics(b);

      if (sortBy === 'SPENT_HIGH') {
        return (bAnalytics?.totalSpent || 0) - (aAnalytics?.totalSpent || 0);
      } else if (sortBy === 'SPENT_LOW') {
        return (aAnalytics?.totalSpent || 0) - (bAnalytics?.totalSpent || 0);
      } else if (sortBy === 'VISITS_HIGH') {
        return (bAnalytics?.totalVisits || 0) - (aAnalytics?.totalVisits || 0);
      } else if (sortBy === 'VISITS_LOW') {
        return (aAnalytics?.totalVisits || 0) - (bAnalytics?.totalVisits || 0);
      } else if (sortBy === 'RECENT_VISIT') {
        const dateA = aAnalytics?.lastVisitDate ? new Date(aAnalytics.lastVisitDate) : new Date(0);
        const dateB = bAnalytics?.lastVisitDate ? new Date(bAnalytics.lastVisitDate) : new Date(0);
        return dateB - dateA;
      } else if (sortBy === 'NAME_AZ') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'NAME_ZA') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });
  }, [customers, searchTerm, statusFilter, membershipFilter, genderFilter, sortBy, invoices, appointments, reviews, customerNotesMap]);

  // Directory Pagination Logic
  const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE) || 1;

  const paginatedCustomers = useMemo(() => {
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  // Handle Page Changes
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // ACTION HANDLERS
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

  // Add Note to Customer Notes Timeline
  const handleAddCustomerNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedCust) return;
    const cid = String(selectedCust._id);
    const noteObj = {
      id: Date.now(),
      text: newNoteText.trim(),
      date: formatDate(new Date()),
      rawDate: new Date()
    };
    setCustomerNotesMap(prev => ({
      ...prev,
      [cid]: [noteObj, ...(prev[cid] || [])]
    }));
    setNewNoteText('');
    addToast('Added client note to timeline', 'success');
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

  // Export Complete CRM CSV Dataset
  const handleExportData = () => {
    const headers = 'Name,Mobile,Email,Gender,Birthday,Address,Registration Date,Last Visit,Total Visits,Total Spent (INR),Average Bill (INR),Favorite Service,Favorite Staff,Loyalty Points,Membership Tier,Customer Status\n';
    const rows = filteredCustomers.map(c => {
      const analytics = getCustomerAnalytics(c);
      const regDate = formatDate(c.createdAt || '2025-01-15');
      const lastVisit = formatDate(analytics.lastVisitDate);
      const favServ = analytics.favService ? analytics.favService.name : 'N/A';
      const favStf = analytics.favStaff ? analytics.favStaff.name : 'Unassigned';

      return `"${c.name}","${c.phone}","${c.email || ''}","${c.gender || ''}","${c.birthday || ''}","${(c.address || '').replace(/"/g, '""')}","${regDate}","${lastVisit}",${analytics.totalVisits},${analytics.totalSpent},${analytics.avgBill},"${favServ}","${favStf}",${c.loyaltyPoints || 0},"${c.membershipLevel || 'None'}","${analytics.customerStatus}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SalonSync_CRM_Customers_Export_${new Date().toLocaleDateString('en-CA')}.csv`;
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

      {/* ─── CRM HERO HEADER ──────────────────────────────────────────────── */}
      <div className="crm-hero-header">
        <div className="crm-hero-left">
          <h1>Customer Relationship Management</h1>
          <p>Salesforce-grade 360° client profiles, treatment analytics, activity timelines & customer status tracking</p>
        </div>

        <div className="crm-hero-actions">
          <button onClick={handleExportData} className="outline-btn">
            <Download size={16} /> Export CRM CSV
          </button>
          {hasPermission(PERMISSIONS.CUSTOMERS_CREATE) && (
            <button onClick={handleOpenAdd} className="gold-btn">
              <Plus size={16} /> Add Customer File
            </button>
          )}
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
              ₹{invoices.reduce((s, i) => s + (i.finalAmount || 0), 0).toLocaleString()}
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
              ₹{invoices.length > 0 ? Math.round(invoices.reduce((s, i) => s + (i.finalAmount || 0), 0) / invoices.length).toLocaleString() : 0}
            </div>
            <div className="crm-sum-title">Average Order Value (AOV)</div>
          </div>
        </div>
      </div>


      {/* ─── MAIN CRM WORKSPACE GRID (DIRECTORY + 360° PROFILE) ────────────── */}
      <div className="crm-main-workspace">

        {/* ─── LEFT: DIRECTORY & MULTI-FILTER PANEL ───────────────────────── */}
        <div className="crm-directory-card">
          <div className="crm-dir-header">
            <h3>Contact Directory</h3>
            <span className="crm-dir-count">{filteredCustomers.length} clients</span>
          </div>

          {/* Search & Multi-Filter Controls */}
          <div className="crm-dir-toolbar">
            <div className="crm-search-input">
              <Search size={15} style={{ color: 'var(--gold-primary)' }} />
              <input
                type="text"
                placeholder="Search name, phone, email, address..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
              {searchTerm && <X size={13} style={{ cursor: 'pointer' }} onClick={() => { setSearchTerm(''); setCurrentPage(1); }} />}
            </div>

            <div className="crm-filter-row">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                <option value="ALL">All Statuses</option>
                <option value="New">New</option>
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
                <option value="Inactive">Inactive</option>
                <option value="High Value">High Value</option>
                <option value="At Risk">At Risk</option>
              </select>

              <select value={membershipFilter} onChange={e => { setMembershipFilter(e.target.value); setCurrentPage(1); }}>
                <option value="ALL">All Tiers</option>
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="None">Non-Member</option>
              </select>
            </div>

            <div className="crm-filter-row">
              <select value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setCurrentPage(1); }}>
                <option value="ALL">All Genders</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>

              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="SPENT_HIGH">Spent: High → Low</option>
                <option value="SPENT_LOW">Spent: Low → High</option>
                <option value="VISITS_HIGH">Visits: High → Low</option>
                <option value="RECENT_VISIT">Last Visit: Recent</option>
                <option value="NAME_AZ">Name: A → Z</option>
              </select>
            </div>
          </div>

          {/* Directory Client List */}
          <div className="crm-dir-list">
            {paginatedCustomers.length === 0 ? (
              <div className="crm-empty-dir">No clients found matching search & filters.</div>
            ) : (
              paginatedCustomers.map(cust => {
                const isSelected = selectedCust && selectedCust._id === cust._id;
                const analytics = getCustomerAnalytics(cust);
                const statusInfo = STATUS_CONFIG[analytics.customerStatus] || STATUS_CONFIG['Regular'];

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
                        <span className={`badge ${statusInfo.badgeClass}`}>
                          {analytics.customerStatus}
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

          {/* Directory Pagination Controls */}
          {filteredCustomers.length > 0 && (
            <div className="crm-pagination">
              <span>
                Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredCustomers.length)} - {Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} of {filteredCustomers.length}
              </span>
              <div className="crm-pagination-btns">
                <button
                  className="crm-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`crm-page-btn ${currentPage === p ? 'active' : ''}`}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                ))}

                <button
                  className="crm-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

        </div>


        {/* ─── RIGHT: 360° CLIENT PROFILE WORKSPACE ───────────────────────── */}
        <div className="crm-profile-card">
          {selectedCust && selectedAnalytics ? (
            <div className="crm-360-workspace">

              {/* 1. DETAILED PROFILE HERO SECTION */}
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
                      <span className={`badge ${(STATUS_CONFIG[selectedAnalytics.customerStatus] || STATUS_CONFIG['Regular']).badgeClass}`}>
                        {selectedAnalytics.customerStatus}
                      </span>
                      {selectedCust.membershipLevel && selectedCust.membershipLevel !== 'None' && (
                        <span className={`badge ${selectedCust.membershipLevel.toLowerCase()}`}>
                          {selectedCust.membershipLevel} Club
                        </span>
                      )}
                    </div>

                    <div className="crm-contact-pills">
                      <span>📱 {selectedCust.phone}</span>
                      {selectedCust.email && <span>✉ {selectedCust.email}</span>}
                      {selectedCust.gender && <span>👤 {selectedCust.gender}</span>}
                      {selectedCust.birthday && <span>🎂 {formatDate(selectedCust.birthday)}</span>}
                      <span>📅 Member Since: {formatDate(selectedCust.createdAt || '2025-01-15')}</span>
                    </div>

                    {selectedCust.address && (
                      <div className="crm-address-line">
                        📍 {selectedCust.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Toolbar Actions */}
                <div className="crm-profile-actions">
                  <button className="crm-action-icon-btn" onClick={() => handleSendWhatsApp(selectedCust)} title="Send WhatsApp">
                    <MessageSquare size={16} />
                  </button>
                  {hasPermission(PERMISSIONS.CUSTOMERS_EDIT) && (
                    <button className="crm-action-icon-btn" onClick={() => handleOpenEdit(selectedCust)} title="Edit Profile">
                      <Edit size={16} />
                    </button>
                  )}
                  {hasPermission(PERMISSIONS.CUSTOMERS_DELETE) && (
                    <button className="crm-action-icon-btn delete" onClick={() => handleDelete(selectedCust._id)} title="Delete Profile">
                      <Trash2 size={16} />
                    </button>
                  )}
                  {hasPermission(PERMISSIONS.APPOINTMENTS_CREATE) && (
                    <button className="gold-btn" onClick={() => setActivePage && setActivePage('appointments')}>
                      <CalendarIcon size={14} /> Book Session
                    </button>
                  )}
                </div>
              </div>


              {/* 2. CUSTOMER ANALYTICS & ATTRIBUTES GRID (17 KEY PROFILE FIELDS) */}
              <div className="crm-analytics-grid">
                {/* Metric 1: Total Visits */}
                <div className="crm-metric-card">
                  <div className="crm-metric-title">Total Visits</div>
                  <div className="crm-metric-value">{selectedAnalytics.totalVisits} visits</div>
                  <div className="crm-metric-sub">Last visit: {formatDate(selectedAnalytics.lastVisitDate)}</div>
                </div>

                {/* Metric 2: Lifetime Spent */}
                <div className="crm-metric-card gold">
                  <div className="crm-metric-title">Lifetime Spending (LTV)</div>
                  <div className="crm-metric-value" style={{ color: 'var(--gold-primary)' }}>
                    ₹{selectedAnalytics.totalSpent.toLocaleString()}
                  </div>
                  <div className="crm-metric-sub">Accumulated POS billings</div>
                </div>

                {/* Metric 3: Average Bill */}
                <div className="crm-metric-card">
                  <div className="crm-metric-title">Average Bill Value</div>
                  <div className="crm-metric-value">₹{selectedAnalytics.avgBill.toLocaleString()}</div>
                  <div className="crm-metric-sub">Per checkout average</div>
                </div>

                {/* Metric 4: Favorite Staff */}
                <div className="crm-metric-card">
                  <div className="crm-metric-title">Favorite Staff</div>
                  <div className="crm-metric-value" style={{ fontSize: '1.1rem' }}>
                    {selectedAnalytics.favStaff ? selectedAnalytics.favStaff.name : 'Unassigned'}
                  </div>
                  <div className="crm-metric-sub">{selectedAnalytics.favStaff?.role || 'Senior Stylist'}</div>
                </div>

                {/* Metric 5: Favorite Service */}
                <div className="crm-metric-card">
                  <div className="crm-metric-title">Favorite Service</div>
                  <div className="crm-metric-value" style={{ fontSize: '1.05rem', color: 'var(--gold-primary)' }}>
                    {selectedAnalytics.favService ? selectedAnalytics.favService.name : 'No service yet'}
                  </div>
                  <div className="crm-metric-sub">
                    {selectedAnalytics.favService ? `Booked ${selectedAnalytics.favService.count} times` : 'History clean'}
                  </div>
                </div>

                {/* Metric 6: Loyalty Points */}
                <div className="crm-metric-card">
                  <div className="crm-metric-title">Loyalty Points</div>
                  <div className="crm-metric-value">{selectedCust.loyaltyPoints || 0} pts</div>
                  <div className="crm-metric-sub">Redeemable balance</div>
                </div>

                {/* Metric 7: Favorite Services Tags */}
                <div className="crm-metric-card wide">
                  <div className="crm-metric-title">Top Preferred Services</div>
                  <div className="crm-fav-services-pills">
                    {selectedAnalytics.topServices.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No treatment history recorded.</span>
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


              {/* 3. 10 DEEP WORKSPACE SUB-VIEW TABS */}
              <div className="crm-workspace-tabs">
                {[
                  { id: 'timeline', label: 'Activity Timeline', icon: Activity },
                  { id: 'appointments', label: `Appointments (${selectedAnalytics.custAppts.length})`, icon: CalendarIcon },
                  { id: 'invoices', label: `Invoices (${selectedAnalytics.custInvoices.length})`, icon: CreditCard },
                  { id: 'services', label: 'Service History', icon: Layers },
                  { id: 'payments', label: `Payments (${selectedAnalytics.paymentHistory.length})`, icon: DollarSign },
                  { id: 'reviews', label: `Reviews (${selectedAnalytics.custReviews.length})`, icon: Star },
                  { id: 'loyalty', label: 'Loyalty History', icon: Award },
                  { id: 'memberships', label: 'Membership History', icon: ShieldCheck },
                  { id: 'notes', label: 'Customer Notes', icon: FileText },
                  { id: 'preferred', label: 'Preferred Services', icon: Bookmark },
                  { id: 'beforeafter', label: 'Transformations', icon: Camera },
                ].map(t => (
                  <button
                    key={t.id}
                    className={`crm-tab-btn ${activeTab === t.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    <t.icon size={14} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>


              {/* ─── TAB CONTENT PANELS ───────────────────────────────────── */}
              <div className="crm-tab-content">

                {/* TAB 1: CHRONOLOGICAL ACTIVITY TIMELINE */}
                {activeTab === 'timeline' && (
                  <div className="crm-timeline-container">
                    {selectedAnalytics.timeline.length === 0 ? (
                      <div className="crm-empty-state">No recent activities recorded on client timeline.</div>
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

                {/* TAB 2: APPOINTMENT HISTORY */}
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

                {/* TAB 3: INVOICE HISTORY */}
                {activeTab === 'invoices' && (
                  <div className="table-responsive">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Date</th>
                          <th>Payment Method</th>
                          <th>Final Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAnalytics.custInvoices.length === 0 ? (
                          <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No invoices logged.</td></tr>
                        ) : (
                          selectedAnalytics.custInvoices.map(inv => (
                            <tr key={inv._id}>
                              <td><strong style={{ color: 'var(--text-primary)' }}>{inv.invoiceNumber}</strong></td>
                              <td>{inv.createdAt ? inv.createdAt.split('T')[0] : 'N/A'}</td>
                              <td><span className="gcal-tag">{inv.paymentMethod || 'UPI/Cash'}</span></td>
                              <td><span style={{ color: 'var(--gold-primary)', fontWeight: '700' }}>₹{inv.finalAmount.toLocaleString()}</span></td>
                              <td><span className="badge paid">{inv.paymentStatus || 'Paid'}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 4: SERVICE HISTORY */}
                {activeTab === 'services' && (
                  <div className="table-responsive">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Service Name</th>
                          <th>Category</th>
                          <th>Rendered Date</th>
                          <th>Price (INR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAnalytics.topServices.length === 0 ? (
                          <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No completed services logged.</td></tr>
                        ) : (
                          selectedAnalytics.custInvoices.flatMap(inv => (inv.services || []).map((srv, i) => (
                            <tr key={`${inv._id}-${i}`}>
                              <td><strong>{srv.name}</strong></td>
                              <td><span className="gcal-tag">Treatment</span></td>
                              <td>{inv.createdAt ? inv.createdAt.split('T')[0] : 'N/A'}</td>
                              <td><span style={{ color: 'var(--gold-primary)', fontWeight: '600' }}>₹{srv.price || 0}</span></td>
                            </tr>
                          )))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 5: PAYMENT HISTORY */}
                {activeTab === 'payments' && (
                  <div className="table-responsive">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Invoice Ref</th>
                          <th>Date</th>
                          <th>Payment Method</th>
                          <th>Amount Paid</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAnalytics.paymentHistory.length === 0 ? (
                          <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No payment transactions found.</td></tr>
                        ) : (
                          selectedAnalytics.paymentHistory.map(pay => (
                            <tr key={pay.id}>
                              <td><strong>{pay.invoiceNumber}</strong></td>
                              <td>{pay.date}</td>
                              <td><span className="gcal-tag">{pay.paymentMethod}</span></td>
                              <td><strong style={{ color: 'var(--gold-primary)' }}>₹{pay.amount.toLocaleString()}</strong></td>
                              <td><span className="badge paid">{pay.status}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 6: REVIEW HISTORY */}
                {activeTab === 'reviews' && (
                  <div>
                    {selectedAnalytics.custReviews.length === 0 ? (
                      <div className="crm-empty-state">No feedback or reviews submitted by this customer.</div>
                    ) : (
                      selectedAnalytics.custReviews.map(rev => (
                        <div key={rev._id} className="crm-note-card">
                          <div className="crm-note-header">
                            <span><Star size={14} fill="#f39c12" color="#f39c12" /> {rev.rating} / 5 Stars</span>
                            <span>{formatDate(rev.date || rev.createdAt)}</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {rev.comment || 'Rating recorded without review text.'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 7: LOYALTY HISTORY */}
                {activeTab === 'loyalty' && (
                  <div className="table-responsive">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Transaction / Event</th>
                          <th>Points</th>
                          <th>Current Balance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Loyalty Points Accrued & Redeemed</strong></td>
                          <td><span style={{ color: '#2ecc71', fontWeight: '700' }}>+{selectedCust.loyaltyPoints || 0} pts</span></td>
                          <td><strong>{selectedCust.loyaltyPoints || 0} pts</strong></td>
                          <td><span className="badge confirm">Active Balance</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 8: MEMBERSHIP HISTORY */}
                {activeTab === 'memberships' && (
                  <div className="crm-note-card">
                    <div className="crm-note-header">
                      <strong style={{ color: 'var(--gold-primary)', fontSize: '0.95rem' }}>
                        {selectedCust.membershipLevel || 'None'} Tier Membership
                      </strong>
                      <span>Member Since: {formatDate(selectedCust.createdAt || '2025-01-15')}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {selectedCust.membershipLevel === 'Platinum' && 'Enjoys 20% discount on all services & priority booking privileges.'}
                      {selectedCust.membershipLevel === 'Gold' && 'Enjoys 15% discount on treatments & complimentary hair spa on birthdays.'}
                      {selectedCust.membershipLevel === 'Silver' && 'Enjoys 10% discount on retail products & treatments.'}
                      {(!selectedCust.membershipLevel || selectedCust.membershipLevel === 'None') && 'Standard client file. Upgrade client to Silver, Gold, or Platinum tier to enable discounts.'}
                    </p>
                  </div>
                )}

                {/* TAB 9: CUSTOMER NOTES */}
                {activeTab === 'notes' && (
                  <div>
                    {/* Add Note Input Box */}
                    <form onSubmit={handleAddCustomerNote} className="crm-add-note-box">
                      <label style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: '600' }}>
                        + Add Staff & Clinical Treatment Note
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Type customer allergies, color formula, tea preferences..."
                        value={newNoteText}
                        onChange={e => setNewNoteText(e.target.value)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="gold-btn" style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}>
                          <Send size={13} /> Save Note
                        </button>
                      </div>
                    </form>

                    {/* Customer Profile Notes */}
                    {selectedCust.notes && (
                      <div className="crm-note-card" style={{ borderColor: 'var(--gold-border)' }}>
                        <div className="crm-note-header">
                          <strong style={{ color: 'var(--gold-primary)' }}>Profile Note & Preferences</strong>
                          <span>Account Registration</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>"{selectedCust.notes}"</p>
                      </div>
                    )}

                    {/* Dynamic Staff Notes List */}
                    {(customerNotesMap[String(selectedCust._id)] || []).map(n => (
                      <div key={n.id} className="crm-note-card">
                        <div className="crm-note-header">
                          <span>Staff Note</span>
                          <span>{n.date}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{n.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 10: PREFERRED SERVICES */}
                {activeTab === 'preferred' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Client Preferred Treatments</h4>
                      {hasPermission(PERMISSIONS.APPOINTMENTS_CREATE) && (
                        <button className="gold-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => setActivePage && setActivePage('appointments')}>
                          + Book Preferred Treatment
                        </button>
                      )}
                    </div>

                    {selectedAnalytics.topServices.length === 0 ? (
                      <div className="crm-empty-state">No preferred services identified yet.</div>
                    ) : (
                      <div className="crm-summary-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                        {selectedAnalytics.topServices.map((srv, idx) => (
                          <div key={idx} className="crm-summary-card" style={{ minHeight: '75px', padding: '0.85rem 1rem' }}>
                            <div className="crm-sum-icon" style={{ background: 'var(--gold-bg)', color: 'var(--gold-primary)', width: '38px', height: '38px' }}>
                              <Bookmark size={18} />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{srv.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Booked {srv.count} times by client</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 11: BEFORE & AFTER TRANSFORMATIONS */}
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
