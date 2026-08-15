import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock,
  User, Check, X, Search, Filter, RefreshCw, AlertCircle,
  CheckCircle2, XCircle, CreditCard, Sparkles, Phone, UserCheck, MessageSquare,
  Repeat, Layers, Award, UserPlus, CheckSquare, Square, Info, ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

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

// ─── SALON SCHEDULING CONSTANTS ──────────────────────────────────────────────
const SALON_OPEN_HOUR = 8;  // 08:00
const SALON_CLOSE_HOUR = 20; // 20:00
const DEFAULT_STAFF_START = 9;  // 09:00
const DEFAULT_STAFF_END = 19;   // 19:00
const BUFFER_MINUTES = 15;      // 15 mins setup/cleanup buffer time

// Scheduled Breaks
const BREAK_TIMES = [
  { name: 'Lunch Break', start: 13 * 60, end: 14 * 60 },      // 13:00 - 14:00
  { name: 'Tea Break', start: 16 * 60 + 30, end: 17 * 60 }    // 16:30 - 17:00
];

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
};

const minutesToTimeStr = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatDateStr = (d) => {
  if (!d) return '';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return String(d).split('T')[0];
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

  // Collections
  const appointments = tenantFilter(db.appointments || []);
  const customers = tenantFilter(db.customers || []);
  const services = tenantFilter(db.services || []);
  const staffMembers = tenantFilter(db.staff || []).filter(s => {
    if (!currentBranch) return true;
    const bid = typeof s.branchId === 'object' ? s.branchId?._id : s.branchId;
    return !bid || String(bid) === String(currentBranch._id);
  });
  const invoices = tenantFilter(db.invoices || []);
  const attendanceList = tenantFilter(db.attendance || []);

  const customerProfile = currentUser?.role === 'CLIENT' ? (db.customers || []).find(c => c.email === currentUser.email) : null;

  // View States
  const [viewType, setViewType] = useState('week'); // Default to week view
  const [currentDate, setCurrentDate] = useState(new Date());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');

  // Modals & Drag State
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [draggedApptId, setDraggedApptId] = useState(null);

  // ─── 6-STEP BOOKING WIZARD STATE ───────────────────────────────────────────
  const [wizardStep, setWizardStep] = useState(1); // Steps 1 to 6
  const [bookingCustType, setBookingCustType] = useState('registered'); // 'registered' | 'walkin'
  const [selectedCustId, setSelectedCustId] = useState('');
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState([]); // Array of service IDs
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [bookingDate, setBookingDate] = useState(formatDateStr(new Date()));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [recurringFrequency, setRecurringFrequency] = useState('NONE'); // NONE, WEEKLY, BIWEEKLY, MONTHLY

  // ────────────────────────────────────────────────────────────────────────────
  // REAL AVAILABILITY CALCULATION ENGINE
  // ────────────────────────────────────────────────────────────────────────────
  const availableTimeSlots = useMemo(() => {
    if (!bookingDate || selectedServices.length === 0 || !selectedStaffId) {
      return [];
    }

    const staffId = selectedStaffId;
    const dateStr = bookingDate;

    // Check Staff Leave / Attendance
    const staffAtt = attendanceList.find(a => {
      const sid = typeof a.staffId === 'object' ? a.staffId?._id : a.staffId;
      const aDate = a.date ? new Date(a.date).toISOString().split('T')[0] : '';
      return String(sid) === String(staffId) && aDate === dateStr;
    });

    if (staffAtt && (staffAtt.workingHours === 0 || staffAtt.status === 'Absent' || staffAtt.status === 'Leave')) {
      return [];
    }

    // Sum selected services duration
    const totalDurationMins = selectedServices.reduce((sum, id) => {
      const srv = services.find(s => String(s._id) === String(id));
      return sum + (srv?.duration || 30);
    }, 0);

    const totalNeededMins = totalDurationMins + BUFFER_MINUTES;

    // Get active appointments for staff on date
    const staffAppts = appointments.filter(appt => {
      const sid = typeof appt.staffId === 'object' ? appt.staffId?._id : appt.staffId;
      const aDate = appt.date ? String(appt.date).split('T')[0] : '';
      return String(sid) === String(staffId) &&
        aDate === dateStr &&
        ['Scheduled', 'Confirmed', 'In Progress'].includes(appt.status);
    });

    // Busy ranges in minutes
    const busyRanges = staffAppts.map(appt => {
      const startMins = timeToMinutes(appt.time);
      let apptDuration = 30;
      if (appt.services && appt.services.length > 0) {
        apptDuration = appt.services.reduce((sum, s) => {
          const servObj = services.find(serv => String(serv._id) === String(s.serviceId) || serv.name === s.name);
          return sum + (servObj?.duration || 30);
        }, 0);
      }
      return {
        start: startMins,
        end: startMins + apptDuration + BUFFER_MINUTES
      };
    });

    // Add breaks
    BREAK_TIMES.forEach(b => busyRanges.push({ start: b.start, end: b.end }));

    const shiftStartMins = DEFAULT_STAFF_START * 60;
    const salonCloseMins = SALON_CLOSE_HOUR * 60;

    const slots = [];
    for (let mins = SALON_OPEN_HOUR * 60; mins <= salonCloseMins - totalDurationMins; mins += 30) {
      const slotStart = mins;
      const slotEnd = mins + totalNeededMins;

      if (slotStart < shiftStartMins || slotEnd > salonCloseMins) {
        continue;
      }

      const hasOverlap = busyRanges.some(b => (slotStart < b.end && slotEnd > b.start));
      if (!hasOverlap) {
        slots.push(minutesToTimeStr(slotStart));
      }
    }

    return slots;
  }, [bookingDate, selectedServices, selectedStaffId, appointments, attendanceList, services]);

  // Aggregate selected services totals
  const selectedServicesTotals = useMemo(() => {
    let price = 0;
    let duration = 0;
    const names = [];
    selectedServices.forEach(id => {
      const srv = services.find(s => String(s._id) === String(id));
      if (srv) {
        price += srv.price || 0;
        duration += srv.duration || 30;
        names.push(srv.name);
      }
    });
    return { price, duration, names };
  }, [selectedServices, services]);

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
    return (db.customers || []).find(c => String(c._id) === String(appt.customerId));
  };

  const resolveStaff = (appt) => {
    if (!appt) return null;
    const sid = typeof appt.staffId === 'object' ? appt.staffId?._id : appt.staffId;
    return (db.staff || []).find(s => String(s._id) === String(sid));
  };

  const getPaymentStatus = (appt) => {
    if (!appt) return 'Pending';
    if (appt.status === 'Completed') return 'Paid';
    const cust = resolveCustomer(appt);
    const hasInv = invoices.some(i => {
      const invCustId = typeof i.customerId === 'object' ? i.customerId?._id : i.customerId;
      return cust && String(invCustId) === String(cust._id) && i.createdAt && i.createdAt.startsWith(formatDateStr(appt.date));
    });
    return hasInv ? 'Paid' : 'Pending';
  };

  const getServiceDuration = (appt) => {
    if (!appt || !appt.services || appt.services.length === 0) return '30 min';
    const totalMins = appt.services.reduce((sum, s) => {
      const servObj = services.find(serv => String(serv._id) === String(s.serviceId) || serv.name === s.name);
      return sum + (servObj?.duration || 30);
    }, 0);
    return `${totalMins} min`;
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
  // WIZARD BOOKING HANDLERS
  // ────────────────────────────────────────────────────────────────────────────
  const handleOpenWizard = (presetDateStr, presetTime, presetStaffId) => {
    setWizardStep(1);
    setBookingCustType('registered');
    setSelectedCustId(customers[0]?._id || '');
    setWalkinName('');
    setWalkinPhone('');
    setSelectedServices(services[0]?._id ? [services[0]._id] : []);
    setSelectedStaffId(presetStaffId || staffMembers[0]?._id || '');
    setBookingDate(presetDateStr || formatDateStr(currentDate));
    setSelectedTimeSlot(presetTime || '10:00');
    setRecurringFrequency('NONE');
    setShowWizardModal(true);
  };

  const toggleServiceSelection = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleConfirmWizardBooking = async () => {
    let custId = selectedCustId;
    let isWalkin = false;
    let custName = '';

    if (bookingCustType === 'walkin' || (!selectedCustId && walkinName)) {
      if (!walkinName.trim()) {
        addToast('Please enter walk-in customer name', 'warning');
        return;
      }
      isWalkin = true;
      custName = walkinName.trim();
      if (addCustomer) {
        const newCust = await addCustomer({ name: `${walkinName.trim()} (Walk-in)`, phone: walkinPhone || 'Walk-in' });
        if (newCust && newCust._id) custId = newCust._id;
      }
    } else if (selectedCustId) {
      const existingCust = customers.find(c => String(c._id) === String(selectedCustId));
      if (existingCust) custName = existingCust.name;
    }

    const staffIdToUse = selectedStaffId || (staffMembers[0] ? staffMembers[0]._id : null);
    const staffMemberObj = staffMembers.find(s => String(s._id) === String(staffIdToUse));

    const selectedServiceIds = selectedServices.length > 0 ? selectedServices : (services[0]?._id ? [services[0]._id] : []);
    const selectedServiceObjs = selectedServiceIds.map(id => {
      const srv = services.find(s => String(s._id) === String(id));
      return {
        serviceId: srv ? srv._id : id,
        name: srv ? srv.name : 'Treatment',
        price: srv ? srv.price : 0
      };
    });

    const branchIdToUse = currentBranch ? currentBranch._id : (currentUser?.branchId || null);

    // Primary Appointment
    const result = await addAppointment({
      customerId: custId || null,
      customerName: custName || 'Walk-in Client',
      services: selectedServiceObjs,
      staffId: staffIdToUse,
      staffName: staffMemberObj ? staffMemberObj.name : 'Senior Stylist',
      branchId: branchIdToUse,
      date: bookingDate,
      time: selectedTimeSlot,
      status: 'Scheduled',
      isWalkin
    });

    if (result && result.success === false && result.message) {
      addToast(result.message, 'error');
      return;
    }

    // Handle Recurring Bookings (Weekly, Bi-weekly, Monthly)
    if (recurringFrequency !== 'NONE') {
      const recurringCount = 3; // Schedule 3 upcoming recurring visits
      let baseDate = new Date(bookingDate);

      for (let i = 1; i <= recurringCount; i++) {
        const nextDate = new Date(baseDate);
        if (recurringFrequency === 'WEEKLY') {
          nextDate.setDate(baseDate.getDate() + 7 * i);
        } else if (recurringFrequency === 'BIWEEKLY') {
          nextDate.setDate(baseDate.getDate() + 14 * i);
        } else if (recurringFrequency === 'MONTHLY') {
          nextDate.setMonth(baseDate.getMonth() + i);
        }

        const nextDateStr = formatDateStr(nextDate);
        await addAppointment({
          customerId: custId || null,
          customerName: custName || 'Walk-in Client',
          services: selectedServiceObjs,
          staffId: staffIdToUse,
          staffName: staffMemberObj ? staffMemberObj.name : 'Senior Stylist',
          branchId: branchIdToUse,
          date: nextDateStr,
          time: selectedTimeSlot,
          status: 'Scheduled',
          isWalkin,
          isRecurring: true
        });
      }
      addToast(`Booked primary appointment + ${recurringCount} recurring ${recurringFrequency.toLowerCase()} sessions`, 'success');
    } else {
      addToast(`Appointment confirmed for ${bookingDate} at ${selectedTimeSlot}`, 'success');
    }

    setShowWizardModal(false);
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
          {appt.isRecurring && <span className="gcal-walkin-badge" style={{ background: 'rgba(155, 89, 182, 0.2)', color: '#9b59b6' }}>Recurring</span>}
        </div>

        <div className="gcal-appt-service" style={{ color: color.text }}>
          {appt.services ? appt.services.map(s => s.name).join(', ') : 'Treatment'}
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
          <h1>Professional Scheduling System</h1>
          <p>Real-time staff availability, working hours, breaks & multi-service scheduling engine</p>
        </div>

        <div className="gcal-header-right">
          {hasPermission(PERMISSIONS.APPOINTMENTS_CREATE) && (
            <button className="gold-btn" onClick={() => handleOpenWizard()}>
              <Plus size={16} /> Book Appointment
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

        {/* 4 Calendar View Switchers */}
        <div className="gcal-view-switcher">
          {[
            { id: 'day', label: 'Daily View' },
            { id: 'week', label: 'Weekly View' },
            { id: 'month', label: 'Monthly View' },
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
                      onClick={() => handleOpenWizard(dStr, timeSlot)}
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
                    onClick={() => handleOpenWizard(dStr, timeSlot)}
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
                  onClick={() => handleOpenWizard(dStr)}
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


      {/* ─── 4. STAFF-WISE RESOURCE SCHEDULE VIEW ───────────────────────── */}
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
                        onClick={() => handleOpenWizard(dStr, timeSlot, staff._id)}
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
         INTERACTIVE 6-STEP BOOKING WIZARD MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {showWizardModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowWizardModal(false)}>
          <div className="modal-scrollable-content gcal-modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="gcal-modal-header">
              <h3>
                <CalendarIcon size={18} style={{ color: 'var(--gold-primary)' }} /> Professional Appointment Wizard
              </h3>
              <button className="gcal-modal-close" onClick={() => setShowWizardModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* 6-Step Wizard Navigation Indicator */}
            <div className="wizard-steps-nav">
              {[
                { step: 1, label: 'Customer' },
                { step: 2, label: 'Service(s)' },
                { step: 3, label: 'Stylist' },
                { step: 4, label: 'Date' },
                { step: 5, label: 'Time Slot' },
                { step: 6, label: 'Confirm' },
              ].map(s => (
                <div
                  key={s.step}
                  className={`wizard-step-item ${wizardStep === s.step ? 'active' : ''} ${wizardStep > s.step ? 'completed' : ''}`}
                  onClick={() => wizardStep > s.step && setWizardStep(s.step)}
                >
                  <div className="wizard-step-num">{wizardStep > s.step ? '✓' : s.step}</div>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>


            {/* STEP 1: CUSTOMER SELECTION / WALK-IN */}
            {wizardStep === 1 && (
              <div className="wizard-step-content">
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Step 1: Choose Client or Walk-in Guest
                </h4>

                {currentUser?.role !== 'CLIENT' && (
                  <div className="gcal-tab-toggle" style={{ marginBottom: '1.25rem' }}>
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
                      Walk-in Guest
                    </button>
                  </div>
                )}

                {currentUser?.role === 'CLIENT' ? (
                  <div className="form-group">
                    <label>Client Profile</label>
                    <input type="text" className="form-control" disabled value={`${currentUser.name} (${customerProfile?.phone || ''})`} />
                  </div>
                ) : bookingCustType === 'registered' ? (
                  <div className="form-group">
                    <label>Select Registered Customer</label>
                    <select
                      className="form-control"
                      value={selectedCustId}
                      onChange={e => setSelectedCustId(e.target.value)}
                    >
                      {customers.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.phone || 'No phone'}) — {c.membershipLevel || 'None'} Tier</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid-2-cols">
                    <div className="form-group">
                      <label>Walk-in Guest Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="Guest full name"
                        value={walkinName}
                        onChange={e => setWalkinName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Phone number"
                        value={walkinPhone}
                        onChange={e => setWalkinPhone(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button className="gold-btn" onClick={() => setWizardStep(2)}>
                    Next: Choose Service(s) →
                  </button>
                </div>
              </div>
            )}


            {/* STEP 2: MULTI-SERVICE SELECTION */}
            {wizardStep === 2 && (
              <div className="wizard-step-content">
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Step 2: Select Treatments / Services
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Select one or multiple services. Duration & costs calculate automatically.
                </p>

                <div className="wizard-service-grid">
                  {services.map(srv => {
                    const isSelected = selectedServices.includes(srv._id);
                    return (
                      <div
                        key={srv._id}
                        className={`wizard-service-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleServiceSelection(srv._id)}
                      >
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{srv.name}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>⏱ {srv.duration || 30} mins • {srv.category}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ color: 'var(--gold-primary)', fontSize: '0.95rem' }}>₹{srv.price}</strong>
                          <div style={{ marginTop: '0.2rem' }}>
                            {isSelected ? <CheckSquare size={16} color="var(--gold-primary)" /> : <Square size={16} color="var(--text-muted)" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="crm-summary-box" style={{ background: 'var(--gold-bg)', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Selected Services: <strong>{selectedServicesTotals.names.join(', ') || 'None'}</strong></span>
                    <strong style={{ color: 'var(--gold-primary)' }}>₹{selectedServicesTotals.price} ({selectedServicesTotals.duration} mins total)</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button className="outline-btn" onClick={() => setWizardStep(1)}>← Back</button>
                  <button className="gold-btn" disabled={selectedServices.length === 0} onClick={() => setWizardStep(3)}>
                    Next: Choose Stylist →
                  </button>
                </div>
              </div>
            )}


            {/* STEP 3: STAFF SELECTION */}
            {wizardStep === 3 && (
              <div className="wizard-step-content">
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Step 3: Choose Stylist / Staff Specialist
                </h4>

                <div className="form-group">
                  <label>Assign Specialist</label>
                  <select
                    className="form-control"
                    value={selectedStaffId}
                    onChange={e => setSelectedStaffId(e.target.value)}
                  >
                    {staffMembers.map(st => (
                      <option key={st._id} value={st._id}>
                        {st.name} ({st.role}) — ⭐ {st.rating || 5.0} Rating
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                  <button className="outline-btn" onClick={() => setWizardStep(2)}>← Back</button>
                  <button className="gold-btn" disabled={!selectedStaffId} onClick={() => setWizardStep(4)}>
                    Next: Choose Date →
                  </button>
                </div>
              </div>
            )}


            {/* STEP 4: DATE SELECTION */}
            {wizardStep === 4 && (
              <div className="wizard-step-content">
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Step 4: Select Appointment Date
                </h4>

                <div className="form-group">
                  <label>Booking Date</label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                  <button className="outline-btn" onClick={() => setWizardStep(3)}>← Back</button>
                  <button className="gold-btn" disabled={!bookingDate} onClick={() => setWizardStep(5)}>
                    Next: View Real Available Slots →
                  </button>
                </div>
              </div>
            )}


            {/* STEP 5: DYNAMIC REAL AVAILABILITY SLOT PICKER */}
            {wizardStep === 5 && (
              <div className="wizard-step-content">
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Step 5: Select Real Available Time Slot
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Slots are calculated dynamically considering salon hours, staff shift, breaks, leaves, total treatment duration ({selectedServicesTotals.duration} mins), and 15 min buffer time.
                </p>

                {availableTimeSlots.length === 0 ? (
                  <div className="crm-empty-state" style={{ background: 'rgba(231, 76, 60, 0.1)', borderColor: 'rgba(231, 76, 60, 0.3)', color: '#ec7063' }}>
                    <AlertCircle size={24} style={{ marginBottom: '0.5rem' }} />
                    <br />
                    No open time slots available on <strong>{bookingDate}</strong> for the selected stylist/duration. Staff may be on break, off duty, or fully booked. Please select another date or stylist.
                  </div>
                ) : (
                  <div className="wizard-slots-grid">
                    {availableTimeSlots.map(slotTime => {
                      const isSelected = selectedTimeSlot === slotTime;
                      return (
                        <button
                          key={slotTime}
                          type="button"
                          className={`wizard-slot-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedTimeSlot(slotTime)}
                        >
                          ⏰ {slotTime}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                  <button className="outline-btn" onClick={() => setWizardStep(4)}>← Back</button>
                  <button className="gold-btn" disabled={!selectedTimeSlot} onClick={() => setWizardStep(6)}>
                    Next: Review & Confirm →
                  </button>
                </div>
              </div>
            )}


            {/* STEP 6: CONFIRMATION & RECURRING OPTIONS */}
            {wizardStep === 6 && (
              <div className="wizard-step-content">
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Step 6: Review & Confirm Booking
                </h4>

                <div className="crm-summary-box" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--gold-border)', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div><strong>Client:</strong> {bookingCustType === 'walkin' ? `${walkinName} (Walk-in)` : (customers.find(c => String(c._id) === String(selectedCustId))?.name || 'Client')}</div>
                    <div><strong>Treatments:</strong> {selectedServicesTotals.names.join(', ')}</div>
                    <div><strong>Total Duration:</strong> {selectedServicesTotals.duration} mins (+15 min cleanup buffer)</div>
                    <div><strong>Assigned Stylist:</strong> {staffMembers.find(s => String(s._id) === String(selectedStaffId))?.name || 'Stylist'}</div>
                    <div><strong>Scheduled Date & Time:</strong> <span style={{ color: 'var(--gold-primary)', fontWeight: '700' }}>{bookingDate} at {selectedTimeSlot}</span></div>
                    <div><strong>Total Payable Amount:</strong> <span style={{ color: 'var(--gold-primary)', fontWeight: '800', fontSize: '1.1rem' }}>₹{selectedServicesTotals.price}</span></div>
                  </div>
                </div>

                {/* Recurring Options */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label><Repeat size={14} style={{ color: 'var(--gold-primary)' }} /> Schedule Recurring Visits?</label>
                  <select
                    className="form-control"
                    value={recurringFrequency}
                    onChange={e => setRecurringFrequency(e.target.value)}
                  >
                    <option value="NONE">One-time Appointment (No recurrence)</option>
                    <option value="WEEKLY">Repeat Weekly (Next 3 weeks)</option>
                    <option value="BIWEEKLY">Repeat Bi-weekly (Every 2 weeks)</option>
                    <option value="MONTHLY">Repeat Monthly (Next 3 months)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button className="outline-btn" onClick={() => setWizardStep(5)}>← Back</button>
                  <button className="gold-btn" onClick={handleConfirmWizardBooking}>
                    ✓ Confirm Booking
                  </button>
                </div>
              </div>
            )}

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
