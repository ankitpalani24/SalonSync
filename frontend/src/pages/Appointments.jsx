import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock,
  User, Check, X, Search, Filter, RefreshCw, AlertCircle,
  CheckCircle2, XCircle, CreditCard, Sparkles, Phone, UserCheck, MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState, DataGridPagination } from '../components/UIComponents';

// ─── SERVICE COLOR PALETTE ENGINE ───────────────────────────────────────────
const SERVICE_COLORS = [
  { bg: 'rgba(112, 130, 56, 0.18)', border: '#708238', text: '#8b9b6a' }, // Olive Green
  { bg: 'rgba(52, 152, 219, 0.18)', border: '#3498db', text: '#5dade2' }, // Cyan Blue
  { bg: 'rgba(155, 89, 182, 0.18)', border: '#9b59b6', text: '#af7ac5' }, // Purple
  { bg: 'rgba(230, 126, 34, 0.18)', border: '#e67e22', text: '#f39c12' }, // Amber Orange
  { bg: 'rgba(46, 204, 113, 0.18)', border: '#2ecc71', text: '#58d68d' }, // Emerald
  { bg: 'rgba(231, 76, 60, 0.18)', border: '#e74c3c', text: '#ec7063' },   // Rose Red
];

const getServiceColor = (serviceName = '') => {
  let hash = 0;
  for (let i = 0; i < serviceName.length; i++) {
    hash = serviceName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SERVICE_COLORS.length;
  return SERVICE_COLORS[index];
};

// ─── TIME SLOTS GENERATOR (08:00 to 20:00) ──────────────────────────────────
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

// Helper to format date string to YYYY-MM-DD
const formatDateStr = (d) => {
  if (!d) return '';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return String(d).split('T')[0];
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper for date display
const formatDateDisplay = (date, viewType) => {
  if (viewType === 'month') {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else if (viewType === 'week') {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APPOINTMENTS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const Appointments = ({ setActivePage, setSelectedApptForCheckout }) => {
  const {
    currentUser, currentBranch, tenantFilter, db,
    addAppointment, updateAppointment, updateAppointmentStatus,
    addCustomer, addNotification, addToast, hasPermission, PERMISSIONS
  } = useApp();

  // Filtered collections
  const appointments = tenantFilter(db.appointments);
  const customers = tenantFilter(db.customers);
  const services = tenantFilter(db.services);
  const staffMembers = tenantFilter(db.staff).filter(s => {
    if (!currentBranch) return true;
    const bid = typeof s.branchId === 'object' ? s.branchId?._id : s.branchId;
    return !bid || String(bid) === String(currentBranch._id);
  });
  const invoices = tenantFilter(db.invoices);

  const customerProfile = currentUser?.role === 'CLIENT' ? db.customers.find(c => c.email === currentUser.email) : null;

  // View States
  const [viewType, setViewType] = useState('month'); // Default to month view
  const [currentDate, setCurrentDate] = useState(new Date());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');

  // Modals & Drag State
  const [showQuickBookModal, setShowQuickBookModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [draggedApptId, setDraggedApptId] = useState(null);

  // Quick Booking Form States
  const [bookingCustType, setBookingCustType] = useState('registered'); // 'registered' | 'walkin'
  const [selectedCustId, setSelectedCustId] = useState('');
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [selectedServId, setSelectedServId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [bookingDate, setBookingDate] = useState(formatDateStr(new Date()));
  const [bookingTime, setBookingTime] = useState('10:00');

  // ────────────────────────────────────────────────────────────────────────────
  // NAVIGATION HELPERS
  // ────────────────────────────────────────────────────────────────────────────
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewType === 'month') next.setMonth(next.getMonth() - 1);
    else if (viewType === 'week') next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewType === 'month') next.setMonth(next.getMonth() + 1);
    else if (viewType === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RESOLUTION HELPERS
  // ────────────────────────────────────────────────────────────────────────────
  const resolveCustomer = (appt) => {
    if (!appt) return null;
    if (appt.customerId && typeof appt.customerId === 'object') return appt.customerId;
    return db.customers.find(c => String(c._id) === String(appt.customerId));
  };

  const resolveStaff = (appt) => {
    if (!appt) return null;
    const sid = typeof appt.staffId === 'object' ? appt.staffId?._id : appt.staffId;
    return db.staff.find(s => String(s._id) === String(sid));
  };

  const getPaymentStatus = (appt) => {
    if (!appt) return 'Pending';
    if (appt.status === 'Completed') return 'Paid';
    // Check if an invoice exists for this appointment or customer checkout
    const cust = resolveCustomer(appt);
    const hasInv = invoices.some(i => {
      const invCustId = typeof i.customerId === 'object' ? i.customerId?._id : i.customerId;
      return cust && String(invCustId) === String(cust._id) && i.createdAt && i.createdAt.startsWith(formatDateStr(appt.date));
    });
    return hasInv ? 'Paid' : 'Pending';
  };

  const getServiceDuration = (appt) => {
    if (!appt || !appt.services || appt.services.length === 0) return '30 min';
    const mainServ = db.services.find(s => s._id === appt.services[0].serviceId || s.name === appt.services[0].name);
    return `${mainServ?.duration || 30} min`;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // FILTERING LOGIC
  // ────────────────────────────────────────────────────────────────────────────
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      const cust = resolveCustomer(appt);
      const staff = resolveStaff(appt);
      const servNames = appt.services ? appt.services.map(s => s.name).join(' ') : '';
      const custName = cust?.name || 'Walk-in';

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQ =
          custName.toLowerCase().includes(q) ||
          servNames.toLowerCase().includes(q) ||
          (staff && staff.name.toLowerCase().includes(q)) ||
          (appt.time && appt.time.toLowerCase().includes(q));
        if (!matchesQ) return false;
      }

      // Staff filter
      if (staffFilter !== 'ALL') {
        const sid = typeof appt.staffId === 'object' ? appt.staffId?._id : appt.staffId;
        if (String(sid) !== String(staffFilter)) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && appt.status !== statusFilter) return false;

      // Service filter
      if (serviceFilter !== 'ALL') {
        const hasServ = appt.services && appt.services.some(s => String(s.serviceId) === String(serviceFilter) || s.name === serviceFilter);
        if (!hasServ) return false;
      }

      return true;
    });
  }, [appointments, searchQuery, staffFilter, statusFilter, serviceFilter, db.customers, db.staff]);

  // ────────────────────────────────────────────────────────────────────────────
  // DRAG AND DROP RESCHEDULING
  // ────────────────────────────────────────────────────────────────────────────
  const handleDragStart = (e, appt) => {
    e.stopPropagation();
    setDraggedApptId(appt._id);
    e.dataTransfer.setData('text/plain', appt._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetDateStr, targetTime, targetStaffId) => {
    e.preventDefault();
    e.stopPropagation();

    const apptId = e.dataTransfer.getData('text/plain') || draggedApptId;
    if (!apptId) return;

    const targetAppt = db.appointments.find(a => String(a._id) === String(apptId));
    if (!targetAppt) return;

    const updatePayload = {};
    if (targetDateStr) updatePayload.date = targetDateStr;
    if (targetTime) updatePayload.time = targetTime;
    if (targetStaffId) updatePayload.staffId = targetStaffId;

    if (Object.keys(updatePayload).length > 0) {
      await updateAppointment(apptId, updatePayload);
      const cust = resolveCustomer(targetAppt);
      const custName = cust ? cust.name : 'Walk-in';
      addToast(`Rescheduled ${custName}'s appointment to ${updatePayload.date || targetAppt.date} at ${updatePayload.time || targetAppt.time}`, 'success');
    }
    setDraggedApptId(null);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // QUICK BOOKING POPUP HANDLERS
  // ────────────────────────────────────────────────────────────────────────────
  const handleOpenQuickBook = (presetDateStr, presetTime, presetStaffId) => {
    setBookingCustType('registered');
    setSelectedCustId(customers[0]?._id || '');
    setWalkinName('');
    setWalkinPhone('');
    setSelectedServId(services[0]?._id || '');
    setSelectedStaffId(presetStaffId || staffMembers[0]?._id || '');
    setBookingDate(presetDateStr || formatDateStr(currentDate));
    setBookingTime(presetTime || '10:00');
    setShowQuickBookModal(true);
  };

  const handleQuickBookSubmit = async (e) => {
    e.preventDefault();

    let custId = selectedCustId;
    let isWalkin = false;

    if (bookingCustType === 'walkin' || (!selectedCustId && walkinName)) {
      if (!walkinName.trim()) {
        addToast('Please enter walk-in customer name', 'warning');
        return;
      }
      isWalkin = true;
      if (addCustomer) {
        const newCust = await addCustomer({ name: `${walkinName.trim()} (Walk-in)`, phone: walkinPhone || 'Walk-in' });
        if (newCust && newCust._id) custId = newCust._id;
      }
    }

    const srv = services.find(s => String(s._id) === String(selectedServId)) || services[0];

    const result = await addAppointment({
      customerId: custId || null,
      services: [{
        serviceId: srv ? srv._id : selectedServId,
        name: srv ? srv.name : 'Service',
        price: srv ? srv.price : 0
      }],
      staffId: selectedStaffId,
      date: bookingDate,
      time: bookingTime,
      status: 'Scheduled',
      isWalkin
    });

    if (result && result.success !== false) {
      addToast(`Appointment booked for ${bookingDate} at ${bookingTime}`, 'success');
      setShowQuickBookModal(false);
    } else {
      addToast(result?.message || 'Failed to book appointment', 'error');
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // DETAIL MODAL HANDLERS
  // ────────────────────────────────────────────────────────────────────────────
  const handleApptClick = (e, appt) => {
    e.stopPropagation();
    setSelectedAppt(appt);
    setShowDetailModal(true);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedAppt) return;
    await updateAppointmentStatus(selectedAppt._id, newStatus);
    setSelectedAppt(prev => ({ ...prev, status: newStatus }));
    addToast(`Status updated to ${newStatus}`, 'info');
  };

  const handleProceedToCheckout = () => {
    setShowDetailModal(false);
    setSelectedApptForCheckout(selectedAppt);
    setActivePage('billing');
  };

  const handleSendWhatsApp = (type) => {
    const cust = resolveCustomer(selectedAppt);
    if (!cust) return;

    let msg = '';
    if (type === 'confirmation') {
      msg = `Confirmed: Hello ${cust.name}, your appointment at SalonSync is confirmed for ${selectedAppt.date} at ${selectedAppt.time}.`;
    } else if (type === 'reminder') {
      msg = `Reminder: Hi ${cust.name}, gentle reminder for your scheduled treatment at SalonSync on ${selectedAppt.date} at ${selectedAppt.time}.`;
    } else {
      msg = `Follow-up: Hi ${cust.name}, thank you for visiting SalonSync! Please share your feedback with us.`;
    }

    addNotification({
      customerId: cust._id || selectedAppt.customerId,
      type: 'WhatsApp',
      message: msg
    });

    addToast(`WhatsApp alert sent to ${cust.name}`, 'success');
  };

  // ────────────────────────────────────────────────────────────────────────────
  // CALENDAR GRID CALCULATIONS
  // ────────────────────────────────────────────────────────────────────────────

  // Get current week dates (Sun - Sat)
  const getWeekDates = (date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      week.push(d);
    }
    return week;
  };

  // Get current month cells (with padding)
  const getMonthCells = (date) => {
    const yr = date.getFullYear();
    const mo = date.getMonth();
    const firstDay = new Date(yr, mo, 1).getDay();
    const daysInMo = new Date(yr, mo + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMo; d++) cells.push(new Date(yr, mo, d));
    return cells;
  };

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const monthCells = useMemo(() => getMonthCells(currentDate), [currentDate]);
  const todayStr = formatDateStr(new Date());

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER APPOINTMENT CARD COMPONENT
  // ════════════════════════════════════════════════════════════════════════════
  const renderApptCard = (appt, compact = false) => {
    const cust = resolveCustomer(appt);
    const staff = resolveStaff(appt);
    const mainServName = appt.services && appt.services.length > 0 ? appt.services[0].name : 'Service';
    const color = getServiceColor(mainServName);
    const custName = cust ? cust.name : 'Walk-in Customer';
    const isWalkin = !cust || cust.phone === 'Walk-in' || appt.isWalkin;
    const duration = getServiceDuration(appt);
    const payStatus = getPaymentStatus(appt);

    const isMine = customerProfile && cust && String(cust._id) === String(customerProfile._id);

    return (
      <div
        key={appt._id}
        draggable={currentUser.role !== 'CLIENT' || isMine}
        onDragStart={(e) => handleDragStart(e, appt)}
        onClick={(e) => handleApptClick(e, appt)}
        className="gcal-appt-card"
        style={{
          background: color.bg,
          borderLeft: `3px solid ${color.border}`,
          opacity: appt.status === 'Cancelled' ? 0.55 : 1,
        }}
      >
        <div className="gcal-appt-header">
          <span className="gcal-appt-time">{appt.time}</span>
          <span className={`badge ${appt.status.toLowerCase().replace(' ', '')}`}>{appt.status}</span>
        </div>

        <div className="gcal-appt-cust">
          <strong>{custName}</strong>
          {isWalkin && <span className="gcal-walkin-badge">Walk-in</span>}
        </div>

        <div className="gcal-appt-service" style={{ color: color.text }}>
          {appt.services.map(s => s.name).join(', ')}
        </div>

        {!compact && (
          <div className="gcal-appt-footer">
            <span className="gcal-appt-staff">Stylist: {staff ? staff.name : 'Any'}</span>
            <div className="gcal-appt-tags">
              <span className="gcal-tag">{duration}</span>
              <span className={`gcal-pay-tag ${payStatus.toLowerCase()}`}>{payStatus}</span>
            </div>
          </div>
        )}
      </div>
    );
  };


  // ════════════════════════════════════════════════════════════════════════════
  // JSX RETURN
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="page-container animated-fade-in gcal-container">

      {/* ─── HEADER & CONTROLS ────────────────────────────────────────────── */}
      <div className="gcal-header">
        <div className="gcal-header-title">
          <h1>Calendar Bookings</h1>
          <p>Google Calendar-style scheduler & staff booking engine</p>
        </div>

        <div className="gcal-header-right">
          {hasPermission(PERMISSIONS.APPOINTMENTS_CREATE) && (
            <button className="gold-btn" onClick={() => handleOpenQuickBook()}>
              <Plus size={16} /> Quick Booking
            </button>
          )}
        </div>
      </div>


      {/* ─── TOOLBAR & SEARCH / FILTERS ──────────────────────────────────── */}
      <div className="gcal-toolbar-card">
        {/* Navigation & Date Display */}
        <div className="gcal-nav-group">
          <div className="gcal-nav-btns">
            <button onClick={handlePrev} className="gcal-icon-btn" title="Previous">
              <ChevronLeft size={18} />
            </button>
            <button onClick={handleToday} className="gcal-today-btn">
              Today
            </button>
            <button onClick={handleNext} className="gcal-icon-btn" title="Next">
              <ChevronRight size={18} />
            </button>
          </div>
          <h2 className="gcal-date-display">{formatDateDisplay(currentDate, viewType)}</h2>
        </div>

        {/* View Switcher */}
        <div className="gcal-view-switcher">
          {[
            { id: 'day', label: 'Day' },
            { id: 'week', label: 'Week' },
            { id: 'month', label: 'Month' },
            { id: 'staff', label: 'Staff Resource' },
          ].map(v => (
            <button
              key={v.id}
              className={`gcal-view-btn ${viewType === v.id ? 'active' : ''}`}
              onClick={() => setViewType(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>


      {/* ─── FILTERS BAR ─────────────────────────────────────────────────── */}
      <div className="gcal-filters-bar">
        {/* Search */}
        <div className="gcal-search-box">
          <Search size={15} style={{ color: 'var(--gold-primary)' }} />
          <input
            type="text"
            placeholder="Search appointment, client, service, stylist..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="gcal-search-clear" onClick={() => setSearchQuery('')}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Staff Filter */}
        <div className="gcal-filter-item">
          <label>Staff:</label>
          <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)}>
            <option value="ALL">All Staff</option>
            {staffMembers.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="gcal-filter-item">
          <label>Status:</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Service Filter */}
        <div className="gcal-filter-item">
          <label>Service:</label>
          <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}>
            <option value="ALL">All Services</option>
            {services.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>


      {/* ════════════════════════════════════════════════════════════════════
         CALENDAR VIEWS
         ════════════════════════════════════════════════════════════════════ */}

      {/* ─── 1. WEEKLY VIEW (7-Day Grid) ─────────────────────────────────── */}
      {viewType === 'week' && (
        <div className="gcal-grid-card">
          <div className="gcal-week-header">
            <div className="gcal-time-col-header">Time</div>
            {weekDates.map(d => {
              const dStr = formatDateStr(d);
              const isToday = dStr === todayStr;
              return (
                <div key={dStr} className={`gcal-week-day-header ${isToday ? 'today' : ''}`}>
                  <span className="gcal-day-name">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="gcal-day-num">{d.getDate()}</span>
                </div>
              );
            })}
          </div>

          <div className="gcal-week-body">
            {TIME_SLOTS.map(timeSlot => (
              <div key={timeSlot} className="gcal-week-row">
                <div className="gcal-time-cell">{timeSlot}</div>

                {weekDates.map(d => {
                  const dStr = formatDateStr(d);
                  const cellAppts = filteredAppointments.filter(a => {
                    const apptDateStr = formatDateStr(a.date);
                    const apptHour = a.time ? a.time.substring(0, 2) : '';
                    return apptDateStr === dStr && apptHour === timeSlot.substring(0, 2);
                  });

                  return (
                    <div
                      key={`${dStr}-${timeSlot}`}
                      className="gcal-slot-cell"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, dStr, timeSlot, null)}
                      onClick={() => handleOpenQuickBook(dStr, timeSlot)}
                    >
                      {cellAppts.map(appt => renderApptCard(appt, true))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ─── 2. DAILY VIEW (Single Day Detailed Schedule) ─────────────────── */}
      {viewType === 'day' && (
        <div className="gcal-grid-card">
          <div className="gcal-day-header">
            <div className="gcal-time-col-header">Time</div>
            <div className="gcal-day-title">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <div className="gcal-day-body">
            {TIME_SLOTS.map(timeSlot => {
              const dStr = formatDateStr(currentDate);
              const cellAppts = filteredAppointments.filter(a => {
                const apptDateStr = formatDateStr(a.date);
                const apptHour = a.time ? a.time.substring(0, 2) : '';
                return apptDateStr === dStr && apptHour === timeSlot.substring(0, 2);
              });

              return (
                <div key={timeSlot} className="gcal-day-row">
                  <div className="gcal-time-cell">{timeSlot}</div>
                  <div
                    className="gcal-day-slot-cell"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dStr, timeSlot, null)}
                    onClick={() => handleOpenQuickBook(dStr, timeSlot)}
                  >
                    {cellAppts.length === 0 ? (
                      <span className="gcal-slot-empty-label">+ Click to book slot</span>
                    ) : (
                      <div className="gcal-day-appts-grid">
                        {cellAppts.map(appt => renderApptCard(appt, false))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ─── 3. MONTHLY VIEW (Full Month Grid) ───────────────────────────── */}
      {viewType === 'month' && (
        <div className="gcal-grid-card">
          {/* Weekday Labels */}
          <div className="gcal-month-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="gcal-month-weekday-cell">{d}</div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="gcal-month-grid">
            {monthCells.map((dayObj, idx) => {
              if (!dayObj) return <div key={`empty-${idx}`} className="gcal-month-cell empty" />;

              const dStr = formatDateStr(dayObj);
              const isToday = dStr === todayStr;
              const cellAppts = filteredAppointments.filter(a => formatDateStr(a.date) === dStr);

              return (
                <div
                  key={dStr}
                  className={`gcal-month-cell ${isToday ? 'today' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, dStr, null, null)}
                  onClick={() => handleOpenQuickBook(dStr)}
                >
                  <div className="gcal-month-date-num">
                    <span className={isToday ? 'today-badge' : ''}>{dayObj.getDate()}</span>
                    {cellAppts.length > 0 && (
                      <span className="gcal-month-count">{cellAppts.length} appts</span>
                    )}
                  </div>

                  <div className="gcal-month-appts-stack">
                    {cellAppts.slice(0, 3).map(appt => {
                      const cust = resolveCustomer(appt);
                      const servName = appt.services && appt.services.length > 0 ? appt.services[0].name : 'Service';
                      const color = getServiceColor(servName);
                      return (
                        <div
                          key={appt._id}
                          draggable={currentUser.role !== 'CLIENT'}
                          onDragStart={(e) => handleDragStart(e, appt)}
                          onClick={(e) => handleApptClick(e, appt)}
                          className="gcal-month-appt-pill"
                          style={{ background: color.bg, borderLeft: `3px solid ${color.border}` }}
                        >
                          <span className="gcal-pill-time">{appt.time}</span>
                          <span className="gcal-pill-name">{cust ? cust.name : 'Walk-in'}</span>
                        </div>
                      );
                    })}
                    {cellAppts.length > 3 && (
                      <div className="gcal-month-more">+ {cellAppts.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ─── 4. STAFF-WISE RESOURCE VIEW ────────────────────────────────── */}
      {viewType === 'staff' && (
        <div className="gcal-grid-card">
          <div className="gcal-staff-header-row">
            <div className="gcal-time-col-header">Time</div>
            {staffMembers.map(staff => (
              <div key={staff._id} className="gcal-staff-col-header">
                <div className="gcal-staff-avatar">{staff.name.charAt(0)}</div>
                <div className="gcal-staff-info">
                  <strong>{staff.name}</strong>
                  <span>{staff.role}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="gcal-staff-body">
            {TIME_SLOTS.map(timeSlot => {
              const dStr = formatDateStr(currentDate);

              return (
                <div key={timeSlot} className="gcal-staff-row">
                  <div className="gcal-time-cell">{timeSlot}</div>

                  {staffMembers.map(staff => {
                    const cellAppts = filteredAppointments.filter(a => {
                      const apptDateStr = formatDateStr(a.date);
                      const sid = typeof a.staffId === 'object' ? a.staffId?._id : a.staffId;
                      const apptHour = a.time ? a.time.substring(0, 2) : '';
                      return apptDateStr === dStr && String(sid) === String(staff._id) && apptHour === timeSlot.substring(0, 2);
                    });

                    return (
                      <div
                        key={`${staff._id}-${timeSlot}`}
                        className="gcal-staff-slot-cell"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, dStr, timeSlot, staff._id)}
                        onClick={() => handleOpenQuickBook(dStr, timeSlot, staff._id)}
                      >
                        {cellAppts.map(appt => renderApptCard(appt, true))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════
         QUICK BOOKING POPUP MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {showQuickBookModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowQuickBookModal(false)}>
          <div className="modal-scrollable-content gcal-modal" onClick={e => e.stopPropagation()}>
            <div className="gcal-modal-header">
              <h3>
                <CalendarIcon size={18} style={{ color: 'var(--gold-primary)' }} /> Quick Appointment Booking
              </h3>
              <button className="gcal-modal-close" onClick={() => setShowQuickBookModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickBookSubmit} className="gcal-modal-form">
              {/* Customer Type Selector */}
              {currentUser?.role !== 'CLIENT' && (
                <div className="gcal-tab-toggle">
                  <button
                    type="button"
                    className={bookingCustType === 'registered' ? 'active' : ''}
                    onClick={() => setBookingCustType('registered')}
                  >
                    Registered Client
                  </button>
                  <button
                    type="button"
                    className={bookingCustType === 'walkin' ? 'active' : ''}
                    onClick={() => setBookingCustType('walkin')}
                  >
                    Walk-in Customer
                  </button>
                </div>
              )}

              {/* Client Selector or Walk-in Fields */}
              {currentUser?.role === 'CLIENT' ? (
                <div className="form-group">
                  <label>Client</label>
                  <input type="text" className="form-control" disabled value={`${currentUser.name} (${customerProfile?.phone || ''})`} />
                </div>
              ) : bookingCustType === 'registered' ? (
                <div className="form-group">
                  <label>Select Registered Client</label>
                  <select
                    className="form-control"
                    required
                    value={selectedCustId}
                    onChange={e => setSelectedCustId(e.target.value)}
                  >
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.phone || 'No phone'})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid-2-cols">
                  <div className="form-group">
                    <label>Walk-in Customer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Guest Client Name"
                      value={walkinName}
                      onChange={e => setWalkinName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Mobile number"
                      value={walkinPhone}
                      onChange={e => setWalkinPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Service Selection */}
              <div className="form-group">
                <label>Select Service / Treatment</label>
                <select
                  className="form-control"
                  required
                  value={selectedServId}
                  onChange={e => setSelectedServId(e.target.value)}
                >
                  {services.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} — ₹{s.price} ({s.duration || 30} mins)
                    </option>
                  ))}
                </select>
              </div>

              {/* Staff Assignment */}
              <div className="form-group">
                <label>Assign Stylist / Staff</label>
                <select
                  className="form-control"
                  required
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                >
                  {staffMembers.map(st => (
                    <option key={st._id} value={st._id}>
                      {st.name} ({st.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid-2-cols">
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
                  <label>Start Time</label>
                  <select
                    className="form-control"
                    required
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="gold-btn gcal-submit-btn">
                ✓ Confirm Appointment
              </button>
            </form>
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════
         APPOINTMENT DETAIL & ACTION POPUP MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {showDetailModal && selectedAppt && (() => {
        const cust = resolveCustomer(selectedAppt);
        const staff = resolveStaff(selectedAppt);
        const servNames = selectedAppt.services ? selectedAppt.services.map(s => s.name).join(', ') : 'Service';
        const mainServName = selectedAppt.services && selectedAppt.services.length > 0 ? selectedAppt.services[0].name : 'Service';
        const color = getServiceColor(mainServName);
        const duration = getServiceDuration(selectedAppt);
        const payStatus = getPaymentStatus(selectedAppt);
        const isWalkin = !cust || cust.phone === 'Walk-in' || selectedAppt.isWalkin;

        return (
          <div className="modal-backdrop-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="modal-scrollable-content gcal-modal" onClick={e => e.stopPropagation()}>
              <div className="gcal-modal-header" style={{ borderBottom: `3px solid ${color.border}` }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                    {cust ? cust.name : 'Walk-in Customer'}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: color.text }}>{servNames}</span>
                </div>
                <button className="gcal-modal-close" onClick={() => setShowDetailModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="gcal-detail-body">
                <div className="gcal-detail-row">
                  <span className="gcal-detail-label">Status:</span>
                  <span className={`badge ${selectedAppt.status.toLowerCase().replace(' ', '')}`}>{selectedAppt.status}</span>
                </div>

                <div className="gcal-detail-row">
                  <span className="gcal-detail-label">Payment Status:</span>
                  <span className={`gcal-pay-tag ${payStatus.toLowerCase()}`}>{payStatus}</span>
                </div>

                <div className="gcal-detail-row">
                  <span className="gcal-detail-label">Schedule:</span>
                  <strong style={{ color: 'var(--gold-primary)' }}>{selectedAppt.date} at {selectedAppt.time} ({duration})</strong>
                </div>

                <div className="gcal-detail-row">
                  <span className="gcal-detail-label">Assigned Stylist:</span>
                  <span>{staff ? staff.name : 'Unassigned'} ({staff?.role || 'Staff'})</span>
                </div>

                {cust && (
                  <div className="gcal-detail-row">
                    <span className="gcal-detail-label">Contact:</span>
                    <span>{cust.phone || cust.email || 'N/A'}</span>
                  </div>
                )}

                {/* Status Switcher */}
                {currentUser?.role !== 'CLIENT' && (
                  <div className="gcal-status-section">
                    <label>Update Appointment Status:</label>
                    <div className="gcal-status-btns">
                      {['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map(st => (
                        <button
                          key={st}
                          className={`gcal-status-btn ${selectedAppt.status === st ? 'active' : ''}`}
                          onClick={() => handleStatusChange(st)}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* WhatsApp Automation Simulator */}
                {currentUser?.role !== 'CLIENT' && (
                  <div className="gcal-whatsapp-box">
                    <label><MessageSquare size={13} /> WhatsApp Reminders</label>
                    <div className="gcal-whatsapp-btns">
                      <button onClick={() => handleSendWhatsApp('confirmation')}>Send Confirmation</button>
                      <button onClick={() => handleSendWhatsApp('reminder')}>Send Reminder</button>
                      <button onClick={() => handleSendWhatsApp('followup')}>Send Follow-up</button>
                    </div>
                  </div>
                )}

                {/* POS Checkout Hook */}
                {currentUser?.role !== 'CLIENT' && selectedAppt.status === 'Completed' && (
                  <button className="gold-btn gcal-submit-btn" onClick={handleProceedToCheckout}>
                    <CreditCard size={16} /> Proceed to POS Checkout
                  </button>
                )}

                {/* Client Cancel Booking Option */}
                {currentUser?.role === 'CLIENT' && selectedAppt.status !== 'Completed' && selectedAppt.status !== 'Cancelled' && (
                  <button
                    className="outline-btn"
                    style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
                    onClick={async () => {
                      await handleStatusChange('Cancelled');
                      setShowDetailModal(false);
                    }}
                  >
                    Cancel Booking Reservation
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default Appointments;
