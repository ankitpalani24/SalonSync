import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, Check, X, ShieldAlert, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Appointments = ({ setActivePage, setSelectedApptForCheckout }) => {
  const { currentUser, tenantFilter, db, addAppointment, updateAppointmentStatus, addNotification } = useApp();

  const appointments = tenantFilter(db.appointments);
  const customers = tenantFilter(db.customers);
  const services = tenantFilter(db.services);
  const staffMembers = tenantFilter(db.staff);
  
  const customerProfile = currentUser?.role === 'CLIENT' ? db.customers.find(c => c.email === currentUser.email) : null;

  // Calendar views: 'month', 'week', 'day'
  const [viewType, setViewType] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date('2026-06-24')); // Seeded date coordinate

  const [showBookModal, setShowBookModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Booking Form states
  const [selectedCustId, setSelectedCustId] = useState('');
  const [walkinName, setWalkinName] = useState('');
  const [selectedServId, setSelectedServId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [bookingDate, setBookingDate] = useState('2026-06-24');
  const [bookingTime, setBookingTime] = useState('11:00');

  // Month navigation helpers
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (viewType === 'month') nextDate.setMonth(nextDate.getMonth() - 1);
    else if (viewType === 'week') nextDate.setDate(nextDate.getDate() - 7);
    else nextDate.setDate(nextDate.getDate() - 1);
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (viewType === 'month') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (viewType === 'week') nextDate.setDate(nextDate.getDate() + 7);
    else nextDate.setDate(nextDate.getDate() + 1);
    setCurrentDate(nextDate);
  };

  // Build grid days for Month view
  const getDaysInMonth = (date) => {
    const yr = date.getFullYear();
    const mo = date.getMonth();
    const firstDay = new Date(yr, mo, 1).getDay();
    const daysInMo = new Date(yr, mo + 1, 0).getDate();
    
    const cells = [];
    // Padding for offset
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMo; d++) cells.push(new Date(yr, mo, d));
    
    return cells;
  };

  const handleOpenBookModal = () => {
    setSelectedCustId(currentUser?.role === 'CLIENT' ? (customerProfile?._id || '') : (customers[0]?._id || ''));
    setWalkinName('');
    setSelectedServId(services[0]?._id || '');
    setSelectedStaffId(staffMembers[0]?._id || '');
    setBookingDate(currentDate.toLocaleDateString('en-CA'));
    setBookingTime('11:00');
    setShowBookModal(true);
  };

  const handleBookSubmit = (e) => {
    e.preventDefault();
    
    let custId = selectedCustId;
    if (!selectedCustId && walkinName) {
      // Create new customer profile for walk-in
      const walk = addCustomer({ name: walkinName, phone: 'Walk-in' });
      custId = walk._id;
    }

    const srv = services.find(s => s._id === selectedServId);
    
    addAppointment({
      customerId: custId,
      services: [{ serviceId: selectedServId, name: srv ? srv.name : 'Service', price: srv ? srv.price : 0 }],
      staffId: selectedStaffId,
      date: bookingDate,
      time: bookingTime
    });

    setShowBookModal(false);
  };

  const handleApptClick = (appt) => {
    setSelectedAppt(appt);
    setShowDetailModal(true);
  };

  const handleStatusChange = (status) => {
    updateAppointmentStatus(selectedAppt._id, status);
    setSelectedAppt(prev => ({ ...prev, status }));
  };

  // Hook for instant POS switch on completion
  const handleProceedToCheckout = () => {
    setShowDetailModal(false);
    setSelectedApptForCheckout(selectedAppt);
    setActivePage('billing');
  };

  // Simulator for sending manual WhatsApp Reminders
  const handleSendReminder = (type) => {
    const cust = db.customers.find(c => c._id === selectedAppt.customerId);
    if (!cust) return;

    let msg = '';
    if (type === 'reminder') {
      msg = `Reminder: Hello ${cust.name}, this is a gentle reminder for your scheduled treatment at SalonSync on ${selectedAppt.date} at ${selectedAppt.time}.`;
    } else if (type === 'confirmation') {
      msg = `Confirmed: Hello ${cust.name}, your appointment at SalonSync is successfully confirmed for ${selectedAppt.date} at ${selectedAppt.time}.`;
    } else {
      msg = `Follow-up: Hi ${cust.name}, we hope you enjoyed your recent session at SalonSync. Please leave us a review!`;
    }

    addNotification({
      customerId: selectedAppt.customerId,
      type: 'WhatsApp',
      message: msg
    });

    alert(`Simulated WhatsApp sent: "${msg}"`);
  };

  return (
    <div className="page-container animated-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Calendar Bookings</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Schedule treatments, manage staff slots, and run notifications.</p>
        </div>
        <button onClick={handleOpenBookModal} className="gold-btn">
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      {/* Roster Calendar Grid Wrap */}
      <div className="glass-card">
        
        {/* Navigation Toolbar */}
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={handlePrev} style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: '4px', padding: '0.35rem' }}>
              <ChevronLeft size={16} />
            </button>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', minWidth: '150px', textAlign: 'center' }}>
              {viewType === 'month' && currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
              {viewType === 'week' && `Week of ${currentDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`}
              {viewType === 'day' && currentDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            <button onClick={handleNext} style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-primary)', borderRadius: '4px', padding: '0.35rem' }}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '4px', padding: '0.15rem' }}>
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                onClick={() => setViewType(v)}
                style={{
                  background: viewType === v ? 'var(--gold-primary)' : 'transparent',
                  color: viewType === v ? '#000' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* 1. MONTH VIEW */}
        {viewType === 'month' && (
          <div className="calendar-view-container">
            <div style={{ minWidth: '700px' }}>
            {/* Weekdays Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ color: 'var(--gold-primary)', fontSize: '0.8rem', fontWeight: '600', padding: '0.5rem' }}>{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {getDaysInMonth(currentDate).map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} style={{ minHeight: '90px', background: 'rgba(255,255,255,0.01)', borderRadius: '4px', opacity: 0.3 }}></div>;
                
                const dayStr = day.toLocaleDateString('en-CA');
                const dayAppts = appointments.filter(a => a.date === dayStr);
                const isToday = dayStr === '2026-06-24'; // Seeded today coordinate

                return (
                  <div key={dayStr} style={{
                    minHeight: '95px',
                    background: isToday ? 'var(--gold-bg)' : 'rgba(255,255,255,0.01)',
                    border: isToday ? '1px solid var(--gold-primary)' : '1px solid var(--border-light)',
                    borderRadius: '4px',
                    padding: '0.35rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: isToday ? 'var(--gold-primary)' : '#bbb', fontWeight: isToday ? 'bold' : 'normal' }}>
                      {day.getDate()}
                    </span>

                    {/* Bookings inside cell */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', overflow: 'hidden' }}>
                      {dayAppts.slice(0, 3).map((appt) => {
                        const cust = db.customers.find(c => c._id === appt.customerId);
                        const isMine = customerProfile && appt.customerId === customerProfile._id;
                        const labelText = isMine ? 'My Session' : 'Slot Blocked';
                        return (
                          <div 
                            key={appt._id}
                            onClick={() => {
                              if (currentUser.role === 'CLIENT' && !isMine) return;
                              handleApptClick(appt);
                            }}
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.15rem 0.35rem',
                              borderRadius: '2px',
                              background: appt.status === 'Completed' ? 'rgba(46,204,113,0.15)' : 'rgba(212,175,55,0.15)',
                              color: appt.status === 'Completed' ? 'var(--accent-green)' : 'var(--gold-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              cursor: (currentUser.role === 'CLIENT' && !isMine) ? 'default' : 'pointer',
                              borderLeft: `2px solid ${appt.status === 'Completed' ? 'var(--accent-green)' : 'var(--gold-primary)'}`
                            }}
                          >
                            {appt.time} {currentUser.role === 'CLIENT' ? labelText : (cust ? cust.name.split(' ')[0] : 'Walk-in')}
                          </div>
                        );
                      })}
                      {dayAppts.length > 3 && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                          + {dayAppts.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

        {/* 2. WEEK VIEW / 3. DAY VIEW (Hourly listing) */}
        {(viewType === 'week' || viewType === 'day') && (
          <div style={{ border: '1px solid var(--border-light)', borderRadius: '6px', background: 'rgba(255,255,255,0.01)', padding: '1rem', maxHeight: '450px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--gold-primary)' }}>Time Slot</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--gold-primary)' }}>Client Booking details</th>
                </tr>
              </thead>
              <tbody>
                {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((hrSlot) => {
                  const activeDateStr = currentDate.toLocaleDateString('en-CA');
                  // matches slot hour prefix
                  const slotAppts = appointments.filter(a => a.date === activeDateStr && a.time.startsWith(hrSlot.substring(0,2)));

                  return (
                    <tr key={hrSlot} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: 'var(--text-primary)', width: '100px' }}>{hrSlot}</td>
                      <td style={{ padding: '0.5rem' }}>
                        {slotAppts.length === 0 ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Available</span>
                        ) : (
                          slotAppts.map((appt) => {
                            const cust = db.customers.find(c => c._id === appt.customerId);
                            const staff = db.staff.find(s => s._id === appt.staffId);
                            const isMine = customerProfile && appt.customerId === customerProfile._id;
                            
                            if (currentUser.role === 'CLIENT' && !isMine) {
                              return (
                                <div
                                  key={appt._id}
                                  style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: '4px',
                                    padding: '0.5rem',
                                    display: 'inline-flex',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    maxWidth: '450px',
                                    cursor: 'default'
                                  }}
                                >
                                  <div>
                                    <strong style={{ color: 'var(--text-muted)' }}>Slot Blocked</strong>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      Unavailable for scheduling
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={appt._id}
                                onClick={() => handleApptClick(appt)}
                                style={{
                                  background: 'rgba(212,175,55,0.06)',
                                  border: '1px solid var(--gold-border)',
                                  borderRadius: '4px',
                                  padding: '0.5rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  maxWidth: '450px'
                                }}
                              >
                                <div>
                                  <strong>{cust ? cust.name : 'Walk-in'}</strong>
                                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                    {appt.services.map(s => s.name).join(', ')} • Stylist: {staff ? staff.name : 'Any'}
                                  </p>
                                </div>
                                <span className={`badge ${appt.status.toLowerCase().replace(' ', '')}`} style={{ alignSelf: 'center' }}>{appt.status}</span>
                              </div>
                            );
                          })
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card gold-border" style={{ width: '450px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>New Treatment Booking</h3>
              <button onClick={() => setShowBookModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleBookSubmit}>
              {currentUser?.role === 'CLIENT' ? (
                <div className="form-group">
                  <label>Booking Customer</label>
                  <input type="text" className="form-control" disabled value={`${currentUser.name} (${customerProfile?.phone || ''})`} />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Select Registered Client</label>
                    <select className="form-control" value={selectedCustId} onChange={(e) => setSelectedCustId(e.target.value)}>
                      {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
                      <option value="">-- Add Walk-in Customer --</option>
                    </select>
                  </div>

                  {!selectedCustId && (
                    <div className="form-group">
                      <label>Walk-in Client Name</label>
                      <input type="text" required placeholder="Guest Client" className="form-control" value={walkinName} onChange={(e) => setWalkinName(e.target.value)} />
                    </div>
                  )}
                </>
              )}

              <div className="form-group">
                <label>Select Treatment Service</label>
                <select className="form-control" value={selectedServId} onChange={(e) => setSelectedServId(e.target.value)}>
                  {services.map(s => <option key={s._id} value={s._id}>{s.name} (₹{s.price})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Assign Professional Stylist</label>
                <select className="form-control" value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)}>
                  {staffMembers.map(s => <option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}
                </select>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Booking Date</label>
                  <input type="date" required className="form-control" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" required className="form-control" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>Confirm Booking</button>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Detail & Automation Panel Modal */}
      {showDetailModal && selectedAppt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card gold-border" style={{ width: '480px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Appointment Desk</h3>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            
            {/* Core Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Client Name:</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {db.customers.find(c => c._id === selectedAppt.customerId)?.name || 'Guest walk-in'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Treatment:</span>
                <span style={{ color: 'var(--text-primary)' }}>{selectedAppt.services.map(s => s.name).join(', ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Assigned Staff:</span>
                <span style={{ color: 'var(--text-primary)' }}>{db.staff.find(s => s._id === selectedAppt.staffId)?.name || 'Unassigned'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Schedule Time:</span>
                <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{selectedAppt.date} at {selectedAppt.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status Badge:</span>
                <span className={`badge ${selectedAppt.status.toLowerCase().replace(' ', '')}`}>{selectedAppt.status}</span>
              </div>
            </div>

            {/* Status Modification Actions */}
            {currentUser?.role !== 'CLIENT' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>Set Progress Status</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      style={{
                        background: selectedAppt.status === st ? 'var(--gold-primary)' : 'rgba(255,255,255,0.03)',
                        color: selectedAppt.status === st ? '#000' : 'var(--text-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '4px',
                        padding: '0.35rem 0.5rem',
                        fontSize: '0.7rem',
                        fontWeight: '500'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Campaign Automation simulator */}
            {currentUser?.role !== 'CLIENT' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={14} style={{ color: 'var(--gold-primary)' }} /> WhatsApp Automation Triggers
                </h4>
                <div className="grid-3-cols">
                  <button onClick={() => handleSendReminder('confirmation')} style={{ background: 'transparent', border: '1px solid var(--gold-border)', color: 'var(--gold-primary)', fontSize: '0.65rem', padding: '0.4rem', borderRadius: '4px' }}>
                    Send Confirm
                  </button>
                  <button onClick={() => handleSendReminder('reminder')} style={{ background: 'transparent', border: '1px solid var(--gold-border)', color: 'var(--gold-primary)', fontSize: '0.65rem', padding: '0.4rem', borderRadius: '4px' }}>
                    Send Reminder
                  </button>
                  <button onClick={() => handleSendReminder('followup')} style={{ background: 'transparent', border: '1px solid var(--gold-border)', color: 'var(--gold-primary)', fontSize: '0.65rem', padding: '0.4rem', borderRadius: '4px' }}>
                    Send Follow-up
                  </button>
                </div>
              </div>
            )}

            {/* Transition hook to POS billing */}
            {currentUser?.role !== 'CLIENT' && selectedAppt.status === 'Completed' && (
              <button 
                onClick={handleProceedToCheckout} 
                className="gold-btn" 
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Proceed to POS Checkout (Invoice Billing)
              </button>
            )}

            {/* CLIENT Cancel Booking Option */}
            {currentUser?.role === 'CLIENT' && (selectedAppt.status !== 'Completed' && selectedAppt.status !== 'Cancelled') && (
              <button 
                onClick={() => {
                  handleStatusChange('Cancelled');
                  setShowDetailModal(false);
                  alert('Your appointment has been cancelled successfully.');
                }} 
                className="outline-btn" 
                style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
              >
                Cancel Booking Reservation
              </button>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Appointments;
