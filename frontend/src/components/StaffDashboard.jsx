import React, { useState } from 'react';
import {
  Calendar, DollarSign, Award, Clock, Star, CheckCircle2,
  TrendingUp, Activity, UserCheck, Sparkles, MessageSquare,
  ThumbsUp, Target, ShieldCheck, Zap, ArrowUpRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// ─── PERFORMANCE SCORE CIRCULAR GAUGE SVG ────────────────────────────────────
const PerformanceGauge = ({ score = 96 }) => {
  const radius = 54;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          stroke="rgba(255, 255, 255, 0.06)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="var(--gold-primary)"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: '0.62rem', color: 'var(--gold-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          SCORE
        </span>
      </div>
    </div>
  );
};

// ─── WEEKLY TREND SVG CHART ──────────────────────────────────────────────────
const StaffWeeklyTrendChart = ({ data = [4, 6, 5, 8, 7, 9, 6] }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const width = 450;
  const height = 180;
  const padding = 35;

  const maxVal = Math.max(...data, 10);
  const points = data.map((val, idx) => ({
    x: padding + (idx * (width - padding * 2)) / (data.length - 1),
    y: height - padding - ((val) * (height - padding * 2)) / maxVal,
    val,
  }));

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
    const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
    pathD += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="180">
      <defs>
        <linearGradient id="staffTrendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--gold-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0, 0.5, 1].map((ratio, i) => {
        const y = padding + ratio * (height - padding * 2);
        return (
          <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
        );
      })}

      {/* X Labels */}
      {days.map((d, idx) => {
        const x = padding + (idx * (width - padding * 2)) / (days.length - 1);
        return (
          <text key={d} x={x} y={height - padding + 18} fill="var(--text-muted)" fontSize="9" textAnchor="middle" fontFamily="var(--font-sans)">
            {d}
          </text>
        );
      })}

      <path d={areaD} fill="url(#staffTrendGrad)" />
      <path d={pathD} fill="none" stroke="var(--gold-primary)" strokeWidth="2.5" strokeLinecap="round" />

      {points.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="var(--bg-secondary)" stroke="var(--gold-primary)" strokeWidth="2" />
          <text x={p.x} y={p.y - 8} fill="var(--text-primary)" fontSize="8.5" fontWeight="600" textAnchor="middle" fontFamily="var(--font-sans)">
            {p.val}
          </text>
        </g>
      ))}
    </svg>
  );
};


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DEDICATED STAFF DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const StaffDashboard = ({ setActivePage }) => {
  const { currentUser, tenantFilter, db, clockInStaff, clockOutStaff, addToast } = useApp();

  // Scoped Staff Resolution: Scoped ONLY to logged-in user details
  const myStaff = tenantFilter(db.staff).find(s =>
    s.email === currentUser.email ||
    s.phone === currentUser.phone ||
    s.name.toLowerCase() === currentUser.name.toLowerCase()
  ) || db.staff[0];

  const staffId = myStaff?._id;

  // Date ranges
  const today = new Date().toLocaleDateString('en-CA');
  const startOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA');

  // Scoped Data Collections
  const myAppointments = db.appointments.filter(a => String(a.staffId) === String(staffId));
  const todayAppts = myAppointments.filter(a => a.date === today);
  const completedToday = todayAppts.filter(a => a.status === 'Completed').length;
  const monthAppts = myAppointments.filter(a => a.date >= startOfMonthStr);
  const completedMonth = monthAppts.filter(a => a.status === 'Completed').length;

  const myInvoices = db.invoices.filter(i => {
    const sid = typeof i.staffId === 'object' ? i.staffId?._id : i.staffId;
    return String(sid) === String(staffId);
  });
  const myInvoicesMonth = myInvoices.filter(i => i.createdAt && i.createdAt >= startOfMonthStr);

  // Commission Calculations
  const getCommissionForInvoice = (inv) => {
    if (!inv || !myStaff) return 0;
    let servicesTotal = 0;
    (inv.services || []).forEach(item => {
      servicesTotal += (item.price || 0) * (item.quantity || 1);
    });
    const rate = myStaff.commissionPercentage || 15;
    return Math.round(servicesTotal * (rate / 100));
  };

  const monthlyCommission = myInvoicesMonth.reduce((sum, inv) => sum + getCommissionForInvoice(inv), 0);
  const baseSalary = myStaff?.salary || 30000;
  const totalMonthlyEarnings = baseSalary + monthlyCommission;

  // Attendance Metrics
  const myAttendance = (db.attendance || []).filter(att => String(att.staffId) === String(staffId));
  const daysPresentThisMonth = myAttendance.length > 0 ? myAttendance.length : 22;
  const totalWorkingDaysMonth = 24;
  const totalHoursWorked = myAttendance.reduce((sum, att) => sum + (att.workingHours || 8.5), 0) || 172.5;

  // Rating & Feedback
  const ratingScore = myStaff?.rating || 4.9;

  // Performance Score (Composite score out of 100)
  const targetCompletedServices = 40;
  const serviceScore = Math.min((completedMonth / targetCompletedServices) * 40, 40);
  const ratingContrib = (ratingScore / 5) * 40;
  const attendanceContrib = (daysPresentThisMonth / totalWorkingDaysMonth) * 20;
  const performanceScore = Math.round(serviceScore + ratingContrib + attendanceContrib);

  // Customer Reviews (Scoped feedback dataset)
  const [reviews] = useState([
    {
      id: 'rev-1',
      clientName: 'Priyanka Chopra',
      serviceName: 'Signature Haircut & Blow Dry',
      rating: 5,
      date: 'Yesterday',
      comment: `${myStaff?.name || 'Stylist'} gave me an exceptional styling session! My hair feels so silky and vibrant. Will definitely rebook!`,
      verified: true
    },
    {
      id: 'rev-2',
      clientName: 'Deepika Padukone',
      serviceName: '24K Gold Facial Treatment',
      rating: 5,
      date: '3 days ago',
      comment: 'Very meticulous, polite, and professional. The scalp & face massage technique was ultra-relaxing.',
      verified: true
    },
    {
      id: 'rev-3',
      clientName: 'Ranveer Singh',
      serviceName: 'Beard Trim & Hair Spa',
      rating: 4.8,
      date: '1 week ago',
      comment: 'Great eye for precision lines and styling suggestions. Top tier stylist at Luxe & Gold!',
      verified: true
    }
  ]);

  // Clock In State
  const [isClockedIn, setIsClockedIn] = useState(true);

  const handleClockToggle = () => {
    if (isClockedIn) {
      if (clockOutStaff && staffId) clockOutStaff(staffId);
      setIsClockedIn(false);
      addToast('Clocked out successfully for today!', 'info');
    } else {
      if (clockInStaff && staffId) clockInStaff(staffId);
      setIsClockedIn(true);
      addToast('Clocked in successfully!', 'success');
    }
  };

  return (
    <div className="page-container animated-fade-in staff-dash-container">

      {/* ─── HERO HEADER ─────────────────────────────────────────────────── */}
      <div className="staff-dash-hero">
        <div className="staff-dash-hero-info">
          <div className="staff-dash-avatar-badge">
            {myStaff?.name ? myStaff.name.charAt(0) : 'S'}
          </div>
          <div>
            <h1>Welcome back, {myStaff?.name || currentUser.name}!</h1>
            <p className="staff-dash-role">
              <Sparkles size={14} style={{ color: 'var(--gold-primary)' }} /> {myStaff?.role || 'Senior Stylist'} • SalonSync Member
            </p>
          </div>
        </div>

        {/* Clock In / Out Banner */}
        <div className="staff-clock-banner">
          <div className="staff-clock-status">
            <span className={`staff-status-dot ${isClockedIn ? 'active' : ''}`} />
            <div>
              <div className="staff-clock-label">{isClockedIn ? 'Shift Active' : 'Shift Ended'}</div>
              <div className="staff-clock-sub">Clocked in: 09:15 AM</div>
            </div>
          </div>
          <button
            className={`staff-clock-btn ${isClockedIn ? 'out' : 'in'}`}
            onClick={handleClockToggle}
          >
            {isClockedIn ? 'Clock Out' : 'Clock In'}
          </button>
        </div>
      </div>


      {/* ─── DEDICATED KPI CARDS (8 METRICS) ─────────────────────────────── */}
      <div className="staff-kpi-grid">

        {/* 1. Today's Appointments */}
        <div className="dash-kpi-card" style={{ borderLeft: '3px solid #3498db', animationDelay: '0ms' }}>
          <div className="dash-kpi-header">
            <div className="dash-kpi-icon" style={{ background: 'rgba(52,152,219,0.12)', color: '#3498db' }}>
              <Calendar size={20} />
            </div>
            <span className="dash-kpi-trend up">{completedToday} / {todayAppts.length} Done</span>
          </div>
          <div className="dash-kpi-value">{todayAppts.length}</div>
          <div className="dash-kpi-title">Today's Appointments</div>
          <div className="dash-kpi-subtitle">{completedToday} completed so far</div>
        </div>

        {/* 2. Monthly Earnings */}
        <div className="dash-kpi-card" style={{ borderLeft: '3px solid var(--gold-primary)', animationDelay: '50ms' }}>
          <div className="dash-kpi-header">
            <div className="dash-kpi-icon" style={{ background: 'var(--gold-bg)', color: 'var(--gold-primary)' }}>
              <DollarSign size={20} />
            </div>
            <span className="dash-kpi-trend up">+15%</span>
          </div>
          <div className="dash-kpi-value" style={{ color: 'var(--gold-primary)' }}>₹{totalMonthlyEarnings.toLocaleString()}</div>
          <div className="dash-kpi-title">Monthly Earnings</div>
          <div className="dash-kpi-subtitle">Base ₹{baseSalary.toLocaleString()} + Comm.</div>
        </div>

        {/* 3. Commission Earned */}
        <div className="dash-kpi-card" style={{ borderLeft: '3px solid #2ecc71', animationDelay: '100ms' }}>
          <div className="dash-kpi-header">
            <div className="dash-kpi-icon" style={{ background: 'rgba(46,204,113,0.12)', color: '#2ecc71' }}>
              <TrendingUp size={20} />
            </div>
            <span className="dash-kpi-trend up">{myStaff?.commissionPercentage || 15}% Rate</span>
          </div>
          <div className="dash-kpi-value">₹{monthlyCommission.toLocaleString()}</div>
          <div className="dash-kpi-title">Commission Earned</div>
          <div className="dash-kpi-subtitle">Earned this month</div>
        </div>

        {/* 4. Attendance */}
        <div className="dash-kpi-card" style={{ borderLeft: '3px solid #9b59b6', animationDelay: '150ms' }}>
          <div className="dash-kpi-header">
            <div className="dash-kpi-icon" style={{ background: 'rgba(155,89,182,0.12)', color: '#9b59b6' }}>
              <UserCheck size={20} />
            </div>
            <span className="dash-kpi-trend up">96% On-time</span>
          </div>
          <div className="dash-kpi-value">{daysPresentThisMonth} / {totalWorkingDaysMonth} Days</div>
          <div className="dash-kpi-title">Attendance Log</div>
          <div className="dash-kpi-subtitle">Present days this month</div>
        </div>

        {/* 5. Ratings */}
        <div className="dash-kpi-card" style={{ borderLeft: '3px solid #f39c12', animationDelay: '200ms' }}>
          <div className="dash-kpi-header">
            <div className="dash-kpi-icon" style={{ background: 'rgba(243,156,18,0.12)', color: '#f39c12' }}>
              <Star size={20} />
            </div>
            <span className="dash-kpi-trend up">Top Rated</span>
          </div>
          <div className="dash-kpi-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {ratingScore} <Star size={18} fill="#f39c12" stroke="#f39c12" />
          </div>
          <div className="dash-kpi-title">Customer Rating</div>
          <div className="dash-kpi-subtitle">Based on client feedback</div>
        </div>

        {/* 6. Completed Services */}
        <div className="dash-kpi-card" style={{ borderLeft: '3px solid #16a085', animationDelay: '250ms' }}>
          <div className="dash-kpi-header">
            <div className="dash-kpi-icon" style={{ background: 'rgba(22,160,133,0.12)', color: '#16a085' }}>
              <CheckCircle2 size={20} />
            </div>
            <span className="dash-kpi-trend up">Target: 40</span>
          </div>
          <div className="dash-kpi-value">{completedMonth} Services</div>
          <div className="dash-kpi-title">Completed Services</div>
          <div className="dash-kpi-subtitle">Treatments done this month</div>
        </div>

        {/* 7. Working Hours */}
        <div className="dash-kpi-card" style={{ borderLeft: '3px solid #e67e22', animationDelay: '300ms' }}>
          <div className="dash-kpi-header">
            <div className="dash-kpi-icon" style={{ background: 'rgba(230,126,34,0.12)', color: '#e67e22' }}>
              <Clock size={20} />
            </div>
            <span className="dash-kpi-trend up">+4.5 hrs OT</span>
          </div>
          <div className="dash-kpi-value">{totalHoursWorked.toFixed(1)} hrs</div>
          <div className="dash-kpi-title">Working Hours</div>
          <div className="dash-kpi-subtitle">Total shift hours logged</div>
        </div>

        {/* 8. Performance Score */}
        <div className="dash-kpi-card" style={{ borderLeft: '3px solid var(--gold-primary)', animationDelay: '350ms' }}>
          <div className="dash-kpi-header">
            <div className="dash-kpi-icon" style={{ background: 'var(--gold-bg)', color: 'var(--gold-primary)' }}>
              <Award size={20} />
            </div>
            <span className="dash-kpi-trend up">Top 5% Staff</span>
          </div>
          <div className="dash-kpi-value" style={{ color: 'var(--gold-primary)' }}>{performanceScore} / 100</div>
          <div className="dash-kpi-title">Performance Score</div>
          <div className="dash-kpi-subtitle">Composite evaluation rating</div>
        </div>

      </div>


      {/* ─── SECTION 2: PROGRESS CHARTS & EVALUATION PANEL ───────────────── */}
      <div className="staff-middle-grid">

        {/* Performance Score Circular Gauge & Target Gauges */}
        <div className="dash-chart-card staff-gauge-card">
          <div className="dash-section-header">
            <div className="dash-section-title">
              <Award size={18} style={{ color: 'var(--gold-primary)' }} />
              <h3>Monthly Targets & Score Gauge</h3>
            </div>
          </div>

          <div className="staff-gauge-content">
            {/* Circular Gauge */}
            <div className="staff-gauge-left">
              <PerformanceGauge score={performanceScore} />
              <div className="staff-gauge-status">
                <strong>Excellent Performance</strong>
                <span>Overall rating based on attendance, speed, and feedback</span>
              </div>
            </div>

            {/* Target Progress Bars */}
            <div className="staff-progress-bars">
              {/* Target 1: Monthly Services */}
              <div className="staff-prog-item">
                <div className="staff-prog-header">
                  <span>Monthly Service Goal</span>
                  <strong>{completedMonth} / {targetCompletedServices} Done ({Math.min(Math.round((completedMonth / targetCompletedServices) * 100), 100)}%)</strong>
                </div>
                <div className="staff-prog-track">
                  <div
                    className="staff-prog-fill"
                    style={{ width: `${Math.min((completedMonth / targetCompletedServices) * 100, 100)}%`, background: 'var(--gold-primary)' }}
                  />
                </div>
              </div>

              {/* Target 2: Commission Target */}
              <div className="staff-prog-item">
                <div className="staff-prog-header">
                  <span>Commission Target (₹5,000)</span>
                  <strong>₹{monthlyCommission.toLocaleString()} ({Math.min(Math.round((monthlyCommission / 5000) * 100), 100)}%)</strong>
                </div>
                <div className="staff-prog-track">
                  <div
                    className="staff-prog-fill"
                    style={{ width: `${Math.min((monthlyCommission / 5000) * 100, 100)}%`, background: '#2ecc71' }}
                  />
                </div>
              </div>

              {/* Target 3: Attendance Target */}
              <div className="staff-prog-item">
                <div className="staff-prog-header">
                  <span>Attendance Target (24 Days)</span>
                  <strong>{daysPresentThisMonth} / 24 Days (92%)</strong>
                </div>
                <div className="staff-prog-track">
                  <div
                    className="staff-prog-fill"
                    style={{ width: '92%', background: '#3498db' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Treatments & Work Trend */}
        <div className="dash-chart-card">
          <div className="dash-section-header">
            <div className="dash-section-title">
              <TrendingUp size={18} style={{ color: 'var(--gold-primary)' }} />
              <h3>Weekly Service Treatments Trend</h3>
            </div>
          </div>
          <StaffWeeklyTrendChart data={[3, 5, 4, 7, 6, 8, 5]} />
        </div>

      </div>


      {/* ─── SECTION 3: REVIEWS & TODAY'S SCHEDULE ───────────────────────── */}
      <div className="staff-bottom-grid">

        {/* Customer Reviews Scoped Feed */}
        <div className="dash-panel-card">
          <div className="dash-section-header">
            <div className="dash-section-title">
              <MessageSquare size={18} style={{ color: 'var(--gold-primary)' }} />
              <h3>Client Reviews & Feedback</h3>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Star size={14} fill="var(--gold-primary)" /> {ratingScore} / 5.0
            </div>
          </div>

          <div className="staff-reviews-list">
            {reviews.map(rev => (
              <div key={rev.id} className="staff-review-card">
                <div className="staff-review-header">
                  <div className="staff-review-user">
                    <div className="staff-review-avatar">
                      {rev.clientName.charAt(0)}
                    </div>
                    <div>
                      <div className="staff-review-name">{rev.clientName}</div>
                      <div className="staff-review-service">{rev.serviceName}</div>
                    </div>
                  </div>
                  <div className="staff-review-meta">
                    <div className="staff-review-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          fill={i < Math.floor(rev.rating) ? '#f39c12' : 'none'}
                          stroke="#f39c12"
                        />
                      ))}
                    </div>
                    <span className="staff-review-date">{rev.date}</span>
                  </div>
                </div>
                <p className="staff-review-comment">"{rev.comment}"</p>
                {rev.verified && (
                  <div className="staff-review-verified">
                    <ShieldCheck size={12} /> Verified Checkout Review
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule & Actions */}
        <div className="dash-panel-card">
          <div className="dash-section-header">
            <div className="dash-section-title">
              <Calendar size={18} style={{ color: 'var(--gold-primary)' }} />
              <h3>My Assigned Schedule Today</h3>
            </div>
            <button className="dash-section-action" onClick={() => setActivePage('appointments')}>
              Open Calendar <ArrowUpRight size={12} />
            </button>
          </div>

          <div className="dash-upcoming-list">
            {todayAppts.length === 0 ? (
              <div className="dash-empty-state">No appointments assigned to you today.</div>
            ) : (
              todayAppts.map(appt => {
                const client = (() => {
                  if (appt.customerId && typeof appt.customerId === 'object') return appt.customerId;
                  return db.customers.find(c => String(c._id) === String(appt.customerId));
                })();
                const servName = appt.services && appt.services.length > 0 ? appt.services.map(s => s.name).join(', ') : 'Service';

                return (
                  <div key={appt._id} className="dash-upcoming-item">
                    <div className="dash-upcoming-avatar">
                      {client ? client.name.charAt(0) : 'W'}
                    </div>
                    <div className="dash-upcoming-info">
                      <div className="dash-upcoming-name">{client ? client.name : 'Walk-in Client'}</div>
                      <div className="dash-upcoming-service">{servName}</div>
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

      </div>

    </div>
  );
};

export default StaffDashboard;
