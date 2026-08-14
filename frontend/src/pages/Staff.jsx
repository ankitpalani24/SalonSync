import React, { useState, useMemo } from 'react';
import { 
  Plus, User, Clock, Award, Shield, UserCheck, Calculator, X, 
  Star, TrendingUp, Calendar, Scissors, Repeat, DollarSign, 
  BarChart2, CheckCircle2, ChevronRight, Filter, Download, 
  MessageSquare, Briefcase, Eye, EyeOff, Sparkles, Camera, Upload, Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const PRESET_STAFF_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80'
];

const Staff = () => {
  const { 
    currentUser, currentBranch, tenantFilter, db, 
    addStaff, updateStaff, deleteStaff, clockInStaff, clockOutStaff, 
    addReview, canViewStaffSalary, getStaffPerformanceMetrics,
    hasPermission, PERMISSIONS, addToast 
  } = useApp();

  // Active Pane Tab: 'roster', 'performance', 'reports', 'attendance', 'commissions'
  const [activePane, setActivePane] = useState('roster');
  
  // Timeframe filter for performance stats: 'all', 'this_month', 'last_month', 'this_year'
  const [timeframe, setTimeframe] = useState('all');
  
  // Selected Staff for Detail Drawer / Modal
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [detailDrawerTab, setDetailDrawerTab] = useState('overview'); // 'overview', 'performance', 'reviews', 'appointments', 'attendance', 'repeat'

  // Modals state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  
  // Add Review Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewStaffId, setReviewStaffId] = useState('');
  const [reviewCustomerName, setReviewCustomerName] = useState('');
  const [reviewServiceName, setReviewServiceName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Form states - Add/Edit Staff
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('password123');
  const [staffRole, setStaffRole] = useState('Hair Stylist');
  const [staffSalary, setStaffSalary] = useState(25000);
  const [staffComm, setStaffComm] = useState(15);
  const [staffExpYears, setStaffExpYears] = useState(4);
  const [staffExpLevel, setStaffExpLevel] = useState('Senior Specialist');
  const [staffSpecializations, setStaffSpecializations] = useState('');
  const [staffBio, setStaffBio] = useState('');
  const [staffStatus, setStaffStatus] = useState('Active');
  const [staffAvatar, setStaffAvatar] = useState(PRESET_STAFF_AVATARS[0]);
  const [selectedServices, setSelectedServices] = useState([]);

  // Quick Photo Change State
  const [quickPhotoStaff, setQuickPhotoStaff] = useState(null);
  const [quickPhotoUrl, setQuickPhotoUrl] = useState('');

  const handlePhotoUpload = (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast('Profile picture should be under 2MB', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result);
      addToast('Profile photo loaded!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleQuickPhotoSave = async () => {
    if (!quickPhotoStaff) return;
    await updateStaff(quickPhotoStaff._id, { avatar: quickPhotoUrl || PRESET_STAFF_AVATARS[0] });
    setQuickPhotoStaff(null);
    setQuickPhotoUrl('');
    addToast('Staff profile photo updated successfully!', 'success');
  };

  // Role Checks
  const isStaffRole = currentUser?.role === 'STAFF';
  const myStaffRecord = (db.staff || []).find(s => 
    String(s.userId) === String(currentUser?._id) ||
    (s.phone && currentUser?.phone && s.phone.replace(/[\s+-]/g, '').endsWith(currentUser?.phone.replace(/[\s+-]/g, '').slice(-10))) ||
    (s.email && currentUser?.email && s.email.toLowerCase() === currentUser?.email.toLowerCase()) ||
    (s.name && currentUser?.name && s.name.toLowerCase() === currentUser?.name.toLowerCase())
  );

  // Filtered staff list by active branch tenant
  const staffList = tenantFilter(db.staff || []).filter(s => {
    if (!currentBranch) return true;
    const bid = typeof s.branchId === 'object' ? s.branchId?._id : s.branchId;
    return !bid || String(bid) === String(currentBranch._id);
  });

  // Filtered attendance & commissions
  const attendanceList = tenantFilter(db.attendance || []).filter(a => {
    if (!currentBranch) return true;
    const bid = typeof a.branchId === 'object' ? a.branchId?._id : a.branchId;
    return !bid || String(bid) === String(currentBranch._id);
  });

  const commissionsList = tenantFilter(db.commissions || []);

  const displayAttendanceStaff = isStaffRole ? staffList.filter(member => member._id === myStaffRecord?._id) : staffList;
  const displayCommissions = isStaffRole ? commissionsList.filter(c => c.staffId === myStaffRecord?._id) : commissionsList;

  // Compute performance metrics for all staff
  const staffPerformanceData = useMemo(() => {
    return staffList.map(st => {
      const metrics = getStaffPerformanceMetrics(st._id, timeframe) || {};
      return {
        staff: st,
        ...metrics
      };
    });
  }, [staffList, timeframe, db.appointments, db.invoices, db.reviews, db.attendance, db.commissions]);

  // Aggregate overall salon stats for performance dashboard
  const overallStats = useMemo(() => {
    const totalRev = staffPerformanceData.reduce((sum, d) => sum + (d.totalRevenue || 0), 0);
    const totalSrv = staffPerformanceData.reduce((sum, d) => sum + (d.servicesCompletedCount || 0), 0);
    const totalCust = staffPerformanceData.reduce((sum, d) => sum + (d.uniqueCustomersCount || 0), 0);
    const totalComm = staffPerformanceData.reduce((sum, d) => sum + (d.totalCommission || 0), 0);
    
    const validRatings = staffPerformanceData.map(d => d.avgRating).filter(Boolean);
    const avgRatingAll = validRatings.length > 0
      ? Math.round((validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length) * 10) / 10
      : 5.0;

    const validScores = staffPerformanceData.map(d => d.performanceScore).filter(Boolean);
    const avgScoreAll = validScores.length > 0
      ? Math.round(validScores.reduce((sum, s) => sum + s, 0) / validScores.length)
      : 85;

    const validRepeatRates = staffPerformanceData.map(d => d.repeatRate).filter(r => r !== undefined);
    const avgRepeatRate = validRepeatRates.length > 0
      ? Math.round(validRepeatRates.reduce((sum, r) => sum + r, 0) / validRepeatRates.length)
      : 40;

    return {
      totalRev,
      totalSrv,
      totalCust,
      totalComm,
      avgRatingAll,
      avgScoreAll,
      avgRepeatRate
    };
  }, [staffPerformanceData]);

  // Handle Form Open for New / Edit Staff
  const openStaffModal = (staffMember = null) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setStaffName(staffMember.name || '');
      setStaffPhone(staffMember.phone || '');
      setStaffEmail(staffMember.email || '');
      setStaffRole(staffMember.role || 'Stylist');
      setStaffSalary(staffMember.salary || 25000);
      setStaffComm(staffMember.commissionPercentage || 15);
      setStaffExpYears(staffMember.experienceYears || 4);
      setStaffExpLevel(staffMember.experienceLevel || 'Senior Specialist');
      setStaffSpecializations((staffMember.specialization || []).join(', '));
      setStaffBio(staffMember.bio || '');
      setStaffStatus(staffMember.status || 'Active');
      setStaffAvatar(staffMember.avatar || PRESET_STAFF_AVATARS[0]);
      setSelectedServices(staffMember.services || []);
    } else {
      setEditingStaff(null);
      setStaffName('');
      setStaffPhone('');
      setStaffEmail('');
      setStaffPassword('password123');
      setStaffRole('Hair Stylist');
      setStaffSalary(25000);
      setStaffComm(15);
      setStaffExpYears(4);
      setStaffExpLevel('Senior Specialist');
      setStaffSpecializations('Signature Haircut, Balayage, Facials');
      setStaffBio('');
      setStaffStatus('Active');
      setStaffAvatar(PRESET_STAFF_AVATARS[Math.floor(Math.random() * PRESET_STAFF_AVATARS.length)]);
      setSelectedServices([]);
    }
    setShowStaffModal(true);
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    const specsArray = staffSpecializations
      ? staffSpecializations.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const payload = {
      name: staffName,
      phone: staffPhone,
      email: staffEmail || `${staffPhone}@salonsync.com`,
      password: staffPassword || 'password123',
      role: staffRole,
      salary: Number(staffSalary),
      commissionPercentage: Number(staffComm),
      experienceYears: Number(staffExpYears),
      experienceLevel: staffExpLevel,
      specialization: specsArray,
      bio: staffBio,
      status: staffStatus,
      avatar: staffAvatar || PRESET_STAFF_AVATARS[0],
      services: selectedServices
    };

    if (editingStaff) {
      await updateStaff(editingStaff._id, payload);
    } else {
      const res = await addStaff(payload);
      if (res && res.credentials) {
        setCreatedCredentials(res.credentials);
      }
    }

    setShowStaffModal(false);
    setEditingStaff(null);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewStaffId) return;

    await addReview({
      staffId: reviewStaffId,
      customerName: reviewCustomerName || 'Valued Client',
      serviceName: reviewServiceName || 'Styling Service',
      rating: Number(reviewRating),
      comment: reviewComment
    });

    setShowReviewModal(false);
    setReviewCustomerName('');
    setReviewServiceName('');
    setReviewComment('');
  };

  const handleClockIn = (id) => clockInStaff(id);
  const handleClockOut = (id) => clockOutStaff(id);

  const today = new Date().toLocaleDateString('en-CA');

  // Selected Staff for Detail Drawer
  const selectedStaffMetrics = selectedStaffId ? getStaffPerformanceMetrics(selectedStaffId, timeframe) : null;
  const selectedStaffMember = selectedStaffMetrics?.staffMember || null;

  // Print Monthly / Yearly Report
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="page-container animated-fade-in">
      {/* Header & Main Navigation */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Staff & HR Performance Hub</h1>
            <span style={{ 
              background: 'var(--gold-bg)', 
              color: 'var(--gold-primary)', 
              border: '1px solid var(--gold-border)', 
              fontSize: '0.65rem', 
              fontWeight: '700', 
              padding: '0.2rem 0.5rem', 
              borderRadius: '12px' 
            }}>
              PRO EDITION
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Manage staff profiles, track performance dashboards, commission payouts, and role-gated analytics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', padding: '0.25rem', borderRadius: '6px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActivePane('roster')} 
            style={{ 
              border: 'none', 
              background: activePane === 'roster' ? 'var(--gold-primary)' : 'transparent', 
              color: activePane === 'roster' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <User size={14} /> Stylists Roster
          </button>
          <button 
            onClick={() => setActivePane('performance')} 
            style={{ 
              border: 'none', 
              background: activePane === 'performance' ? 'var(--gold-primary)' : 'transparent', 
              color: activePane === 'performance' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <TrendingUp size={14} /> Performance Dashboard
          </button>
          <button 
            onClick={() => setActivePane('reports')} 
            style={{ 
              border: 'none', 
              background: activePane === 'reports' ? 'var(--gold-primary)' : 'transparent', 
              color: activePane === 'reports' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <BarChart2 size={14} /> Monthly/Yearly Reports
          </button>
          <button 
            onClick={() => setActivePane('attendance')} 
            style={{ 
              border: 'none', 
              background: activePane === 'attendance' ? 'var(--gold-primary)' : 'transparent', 
              color: activePane === 'attendance' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <Clock size={14} /> Daily Attendance
          </button>
          <button 
            onClick={() => setActivePane('commissions')} 
            style={{ 
              border: 'none', 
              background: activePane === 'commissions' ? 'var(--gold-primary)' : 'transparent', 
              color: activePane === 'commissions' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <Calculator size={14} /> Commissions Payouts
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. STYLISTS ROSTER VIEW */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activePane === 'roster' && (
        <div>
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>Active Salon Professionals</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overview of staff profiles, specializations, ratings, and role-protected details.</p>
            </div>
            {hasPermission(PERMISSIONS.STAFF_MANAGE) && (
              <button onClick={() => openStaffModal(null)} className="gold-btn" style={{ padding: '0.5rem 1.1rem' }}>
                <Plus size={16} /> Register New Employee
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {staffList.map(member => {
              const canSeeSalary = canViewStaffSalary(member._id);
              const metrics = getStaffPerformanceMetrics(member._id, 'all');

              return (
                <div key={member._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  {/* Status Indicator */}
                  <span style={{
                    position: 'absolute',
                    top: '1.25rem',
                    right: '1.25rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    background: member.status === 'Inactive' ? 'rgba(231, 76, 60, 0.15)' : member.status === 'On Leave' ? 'rgba(241, 196, 15, 0.15)' : 'rgba(46, 204, 113, 0.15)',
                    color: member.status === 'Inactive' ? 'var(--accent-red)' : member.status === 'On Leave' ? '#f1c40f' : 'var(--accent-green)',
                    border: `1px solid ${member.status === 'Inactive' ? 'rgba(231, 76, 60, 0.3)' : member.status === 'On Leave' ? 'rgba(241, 196, 15, 0.3)' : 'rgba(46, 204, 113, 0.3)'}`
                  }}>
                    {member.status || 'Active'}
                  </span>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img 
                        src={member.avatar || PRESET_STAFF_AVATARS[0]} 
                        alt={member.name}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid var(--gold-primary)'
                        }}
                      />
                      {hasPermission(PERMISSIONS.STAFF_MANAGE) && (
                        <button
                          onClick={() => {
                            setQuickPhotoStaff(member);
                            setQuickPhotoUrl(member.avatar || PRESET_STAFF_AVATARS[0]);
                          }}
                          title="Change Profile Picture"
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            background: 'var(--gold-primary)',
                            color: '#000',
                            border: '1.5px solid #000',
                            borderRadius: '50%',
                            width: '22px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <Camera size={11} />
                        </button>
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>{member.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '600' }}>{member.role}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>• {member.experienceYears || 3} yrs exp</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.3rem', fontSize: '0.75rem', color: '#f1c40f' }}>
                        <Star size={13} fill="#f1c40f" /> 
                        <strong style={{ color: '#fff' }}>{member.rating || 5.0}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({metrics?.reviewCount || 0} reviews)</span>
                      </div>
                    </div>
                  </div>

                  {/* Specializations Badges */}
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Specializations:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.35rem' }}>
                      {(member.specialization && member.specialization.length > 0 ? member.specialization : ['Haircut', 'Styling']).map((spec, idx) => (
                        <span key={idx} style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--border-light)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.68rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Financial & Contact Info (Role-Gated) */}
                  <div style={{ 
                    background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: '6px', 
                    padding: '0.75rem', 
                    fontSize: '0.75rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.4rem', 
                    marginBottom: '1rem' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Base Salary:</span>
                      <strong>
                        {canSeeSalary ? `₹${(member.salary || 0).toLocaleString()}` : '₹••••••'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Commission Ratio:</span>
                      <strong>
                        {canSeeSalary ? `${member.commissionPercentage || 15}%` : '••%'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Performance Score:</span>
                      <strong style={{ color: 'var(--gold-primary)' }}>
                        {metrics?.performanceScore || 85} / 100
                      </strong>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setSelectedStaffId(member._id);
                        setDetailDrawerTab('overview');
                      }}
                      className="outline-btn"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', justifyContent: 'center', borderColor: 'var(--gold-primary)', color: 'var(--gold-primary)' }}
                    >
                      View Profile & Stats <ChevronRight size={14} />
                    </button>

                    {hasPermission(PERMISSIONS.STAFF_MANAGE) && (
                      <button
                        onClick={() => openStaffModal(member)}
                        className="outline-btn"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', borderColor: 'var(--border-light)' }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. PERFORMANCE DASHBOARD VIEW */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activePane === 'performance' && (
        <div>
          {/* Controls Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '600' }}>Staff Performance Dashboard</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Real-time aggregated KPIs and staff member leaderboard.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Filter size={14} /> Timeframe:
              </span>
              <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value)}
                className="form-control"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', width: 'auto', background: 'var(--bg-card)' }}
              >
                <option value="all">All Time</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
              </select>
            </div>
          </div>

          {/* Top Metric KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <span>Revenue Generated</span>
                <DollarSign size={16} style={{ color: 'var(--gold-primary)' }} />
              </div>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                ₹{overallStats.totalRev.toLocaleString()}
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)' }}>Total billed service revenue</span>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <span>Services Completed</span>
                <Scissors size={16} style={{ color: 'var(--gold-primary)' }} />
              </div>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                {overallStats.totalSrv}
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Finished service sessions</span>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <span>Customers Served</span>
                <UserCheck size={16} style={{ color: 'var(--gold-primary)' }} />
              </div>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                {overallStats.totalCust}
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Unique clients attended</span>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <span>Average Rating</span>
                <Star size={16} style={{ color: '#f1c40f' }} fill="#f1c40f" />
              </div>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                {overallStats.avgRatingAll} / 5.0
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--gold-primary)' }}>Customer satisfaction index</span>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <span>Repeat Client Rate</span>
                <Repeat size={16} style={{ color: 'var(--gold-primary)' }} />
              </div>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                {overallStats.avgRepeatRate}%
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)' }}>Retention & loyalty rate</span>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <span>Overall Perf Score</span>
                <Award size={16} style={{ color: 'var(--gold-primary)' }} />
              </div>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--gold-primary)', fontWeight: '700' }}>
                {overallStats.avgScoreAll} / 100
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Weighted performance metric</span>
            </div>
          </div>

          {/* Leaderboard & Performance Table */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>Staff Performance Leaderboard</h3>
              <button 
                onClick={() => {
                  if (staffList.length > 0) {
                    setReviewStaffId(staffList[0]._id);
                    setShowReviewModal(true);
                  }
                }}
                className="outline-btn" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'var(--gold-primary)', color: 'var(--gold-primary)' }}
              >
                <Star size={14} /> Log Customer Review
              </button>
            </div>

            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Rank / Stylist</th>
                    <th>Specialization</th>
                    <th>Revenue Generated</th>
                    <th>Services Completed</th>
                    <th>Customers Served</th>
                    <th>Rating</th>
                    <th>Repeat Rate</th>
                    <th>Attendance %</th>
                    <th>Perf Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPerformanceData
                    .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
                    .map((item, idx) => {
                      const st = item.staff;
                      const canSeeSalary = canViewStaffSalary(st._id);

                      return (
                        <tr key={st._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '50%', 
                                background: idx === 0 ? '#f1c40f' : idx === 1 ? '#e0e0e0' : idx === 2 ? '#cd7f32' : 'rgba(255,255,255,0.06)',
                                color: idx < 3 ? '#000' : '#aaa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 'bold'
                              }}>
                                #{idx + 1}
                              </span>
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>{st.name}</strong>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{st.role}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {(st.specialization && st.specialization.length > 0) ? st.specialization[0] : 'Styling'}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--accent-green)' }}>
                              {canSeeSalary ? `₹${(item.totalRevenue || 0).toLocaleString()}` : '₹••••••'}
                            </strong>
                          </td>
                          <td><strong>{item.servicesCompletedCount}</strong></td>
                          <td>{item.uniqueCustomersCount}</td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#f1c40f', fontWeight: 'bold' }}>
                              <Star size={12} fill="#f1c40f" /> {item.avgRating}
                            </span>
                          </td>
                          <td>{item.repeatRate}%</td>
                          <td>{item.attendanceRate}%</td>
                          <td>
                            <span style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              background: item.performanceScore >= 85 ? 'rgba(46, 204, 113, 0.15)' : 'rgba(241, 196, 15, 0.15)',
                              color: item.performanceScore >= 85 ? 'var(--accent-green)' : '#f1c40f',
                              border: `1px solid ${item.performanceScore >= 85 ? 'rgba(46, 204, 113, 0.3)' : 'rgba(241, 196, 15, 0.3)'}`
                            }}>
                              {item.performanceScore} / 100
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                setSelectedStaffId(st._id);
                                setDetailDrawerTab('performance');
                              }}
                              className="outline-btn"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. MONTHLY & YEARLY REPORTS VIEW */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activePane === 'reports' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '600' }}>Staff Monthly & Yearly Audit Reports</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Generate compliance, salary, commission, and productivity summaries.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select 
                  value={timeframe} 
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="form-control"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', width: 'auto', background: 'var(--bg-card)' }}
                >
                  <option value="this_month">Current Month (June 2026)</option>
                  <option value="last_month">Previous Month (May 2026)</option>
                  <option value="this_year">Yearly Summary (2026)</option>
                  <option value="all">All-Time Cumulative</option>
                </select>

                <button onClick={handlePrintReport} className="gold-btn" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
                  <Download size={14} /> Export / Print Report
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Official Staff Productivity Statement</h4>
            </div>

            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Role</th>
                    <th>Experience</th>
                    <th>Base Salary</th>
                    <th>Revenue Contributed</th>
                    <th>Commission Earned</th>
                    <th>Services Done</th>
                    <th>Punctuality Rate</th>
                    <th>Performance Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPerformanceData.map(item => {
                    const st = item.staff;
                    const canSeeSalary = canViewStaffSalary(st._id);

                    return (
                      <tr key={st._id}>
                        <td>
                          <strong style={{ color: 'var(--text-primary)' }}>{st.name}</strong>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{st.email || st.phone}</p>
                        </td>
                        <td>{st.role}</td>
                        <td>{st.experienceLevel || 'Senior'} ({st.experienceYears || 3} yrs)</td>
                        <td>
                          <strong>{canSeeSalary ? `₹${(st.salary || 0).toLocaleString()}` : '₹••••••'}</strong>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--accent-green)' }}>
                            {canSeeSalary ? `₹${(item.totalRevenue || 0).toLocaleString()}` : '₹••••••'}
                          </strong>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--gold-primary)' }}>
                            {canSeeSalary ? `₹${(item.totalCommission || 0).toLocaleString()}` : '₹••••••'}
                          </strong>
                        </td>
                        <td>{item.servicesCompletedCount}</td>
                        <td>{item.attendanceRate}%</td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.68rem',
                            fontWeight: 'bold',
                            background: item.performanceScore >= 85 ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: item.performanceScore >= 85 ? 'var(--gold-primary)' : 'var(--text-secondary)',
                            border: `1px solid ${item.performanceScore >= 85 ? 'var(--gold-border)' : 'var(--border-light)'}`
                          }}>
                            {item.performanceScore >= 90 ? '🌟 Star Performer' : item.performanceScore >= 80 ? '⭐ Senior Tier' : '👍 Core Staff'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. DAILY ATTENDANCE VIEW */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activePane === 'attendance' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Check In/Out Station ({today})</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shift limits: 8 Hours standard shift</span>
          </div>

          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Stylist Professional</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Work Hours</th>
                  <th>Overtime Log</th>
                  <th>Station Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayAttendanceStaff.map(member => {
                  const log = attendanceList.find(a => {
                    const staffIdStr = typeof a.staffId === 'object' ? a.staffId._id : a.staffId;
                    return String(staffIdStr) === String(member._id) && (a.date === today || String(a.date).startsWith(today));
                  });

                  return (
                    <tr key={member._id}>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{member.name}</strong>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{member.role}</p>
                      </td>
                      <td>
                        <span style={{ color: log?.checkIn ? '#fff' : 'var(--text-muted)' }}>
                          {log?.checkIn || '--:--'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: log?.checkOut ? '#fff' : 'var(--text-muted)' }}>
                          {log?.checkOut || '--:--'}
                        </span>
                      </td>
                      <td>
                        <strong>{log?.workingHours ? `${log.workingHours} hrs` : '0.0 hrs'}</strong>
                      </td>
                      <td>
                        <span style={{ color: log?.overtime > 0 ? 'var(--gold-primary)' : 'var(--text-secondary)' }}>
                          {log?.overtime > 0 ? `+${log.overtime} hrs` : '--'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            disabled={!!log?.checkIn}
                            onClick={() => handleClockIn(member._id)}
                            style={{
                              background: log?.checkIn ? 'rgba(255,255,255,0.02)' : 'var(--gold-bg)',
                              border: log?.checkIn ? '1px solid var(--border-light)' : '1px solid var(--gold-border)',
                              color: log?.checkIn ? 'var(--text-muted)' : 'var(--gold-primary)',
                              fontSize: '0.7rem',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '4px',
                              cursor: log?.checkIn ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Clock In
                          </button>
                          <button
                            disabled={!log?.checkIn || !!log?.checkOut}
                            onClick={() => handleClockOut(member._id)}
                            style={{
                              background: !log?.checkIn || log?.checkOut ? 'rgba(255,255,255,0.02)' : 'rgba(231,76,60,0.1)',
                              border: !log?.checkIn || log?.checkOut ? '1px solid var(--border-light)' : '1px solid rgba(231,76,60,0.2)',
                              color: !log?.checkIn || log?.checkOut ? 'var(--text-muted)' : 'var(--accent-red)',
                              fontSize: '0.7rem',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '4px',
                              cursor: !log?.checkIn || log?.checkOut ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Clock Out
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. COMMISSIONS PAYOUT VIEW */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activePane === 'commissions' && (
        <div className="glass-card">
          <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Automated Commissions Statement</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Live multipliers synced with billing invoicing completions.</p>
          </div>

          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Stylist Professional</th>
                  <th>Receipt Ref</th>
                  <th>Revenue Generated</th>
                  <th>Commission Rate</th>
                  <th>Commission Earned</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {displayCommissions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No commissions transactions recorded.</td>
                  </tr>
                ) : (
                  displayCommissions.map(c => {
                    const member = staffList.find(st => String(st._id) === String(c.staffId));
                    const inv = (db.invoices || []).find(i => String(i._id) === String(c.invoiceId));
                    const canSeeSalary = member ? canViewStaffSalary(member._id) : true;

                    return (
                      <tr key={c._id}>
                        <td>
                          <strong>{member ? member.name : 'Staff Member'}</strong>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{member ? member.role : ''}</p>
                        </td>
                        <td>
                          <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                            {inv ? inv.invoiceNumber : 'INV-POS'}
                          </span>
                        </td>
                        <td>₹{c.revenueGenerated}</td>
                        <td>{c.commissionRate}%</td>
                        <td>
                          <strong style={{ color: 'var(--accent-green)' }}>
                            {canSeeSalary ? `₹${c.commissionEarned}` : '₹••••'}
                          </strong>
                        </td>
                        <td>{c.date || 'Today'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STAFF DETAIL PROFILE DRAWER / MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedStaffId && selectedStaffMember && (
        <div className="modal-backdrop-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedStaffId(null); }}>
          <div className="modal-scrollable-content" style={{ maxWidth: '850px', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.75rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <img 
                    src={selectedStaffMember.avatar || PRESET_STAFF_AVATARS[0]} 
                    alt={selectedStaffMember.name}
                    style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-primary)' }}
                  />
                  {hasPermission(PERMISSIONS.STAFF_MANAGE) && (
                    <button
                      onClick={() => {
                        setQuickPhotoStaff(selectedStaffMember);
                        setQuickPhotoUrl(selectedStaffMember.avatar || PRESET_STAFF_AVATARS[0]);
                      }}
                      title="Update Profile Photo"
                      style={{
                        position: 'absolute',
                        bottom: '0px',
                        right: '0px',
                        background: 'var(--gold-primary)',
                        color: '#000',
                        border: '2px solid var(--bg-secondary)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <Camera size={12} />
                    </button>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '700' }}>{selectedStaffMember.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ color: 'var(--gold-primary)', fontSize: '0.8rem', fontWeight: '600' }}>{selectedStaffMember.role}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>• {selectedStaffMember.experienceYears || 4} Years Exp ({selectedStaffMember.experienceLevel || 'Senior'})</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    📞 {selectedStaffMember.phone} | ✉️ {selectedStaffMember.email || 'No Email'}
                  </div>
                </div>
              </div>

              <button onClick={() => setSelectedStaffId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Sub-tabs in Drawer */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto' }}>
              {['overview', 'performance', 'reviews', 'appointments', 'attendance'].map(tabKey => (
                <button
                  key={tabKey}
                  onClick={() => setDetailDrawerTab(tabKey)}
                  style={{
                    border: 'none',
                    background: detailDrawerTab === tabKey ? 'var(--gold-primary)' : 'transparent',
                    color: detailDrawerTab === tabKey ? '#000' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '4px',
                    textTransform: 'capitalize'
                  }}
                >
                  {tabKey}
                </button>
              ))}
            </div>

            {/* Drawer Tab Content */}
            {detailDrawerTab === 'overview' && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', fontStyle: selectedStaffMember.bio ? 'normal' : 'italic' }}>
                  {selectedStaffMember.bio || 'No bio profile added yet.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <h5 style={{ color: 'var(--gold-primary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Specializations</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {(selectedStaffMember.specialization || ['Haircut', 'Colorist']).map((spec, i) => (
                        <span key={i} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <h5 style={{ color: 'var(--gold-primary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Compensation & Terms</h5>
                    <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div>Base Salary: <strong>{canViewStaffSalary(selectedStaffMember._id) ? `₹${(selectedStaffMember.salary || 0).toLocaleString()}` : '₹••••••'}</strong></div>
                      <div>Commission Rate: <strong>{canViewStaffSalary(selectedStaffMember._id) ? `${selectedStaffMember.commissionPercentage || 15}%` : '••%'}</strong></div>
                      <div>Status: <strong style={{ color: 'var(--accent-green)' }}>{selectedStaffMember.status || 'Active'}</strong></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Offered Salon Services</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    {(db.services || []).map(srv => (
                      <div key={srv._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{srv.name}</div>
                        <div style={{ color: 'var(--gold-primary)', marginTop: '0.1rem' }}>₹{srv.price} • {srv.duration} mins</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {detailDrawerTab === 'performance' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Revenue Generated</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--accent-green)', marginTop: '0.2rem' }}>
                    {canViewStaffSalary(selectedStaffMember._id) ? `₹${(selectedStaffMetrics.totalRevenue || 0).toLocaleString()}` : '₹••••••'}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Services Completed</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fff', marginTop: '0.2rem' }}>
                    {selectedStaffMetrics.servicesCompletedCount}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Customers Served</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fff', marginTop: '0.2rem' }}>
                    {selectedStaffMetrics.uniqueCustomersCount}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Repeat Retention Rate</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--gold-primary)', marginTop: '0.2rem' }}>
                    {selectedStaffMetrics.repeatRate}%
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Average Rating</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#f1c40f', marginTop: '0.2rem' }}>
                    ⭐ {selectedStaffMetrics.avgRating}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Performance Score</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--gold-primary)', marginTop: '0.2rem' }}>
                    {selectedStaffMetrics.performanceScore} / 100
                  </div>
                </div>
              </div>
            )}

            {detailDrawerTab === 'reviews' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h5 style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Customer Ratings & Feedback</h5>
                  <button 
                    onClick={() => {
                      setReviewStaffId(selectedStaffMember._id);
                      setShowReviewModal(true);
                    }}
                    className="gold-btn" 
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }}
                  >
                    + Add Feedback Review
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedStaffMetrics.reviews.length === 0 ? (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No client reviews recorded for this staff member yet.</p>
                  ) : (
                    selectedStaffMetrics.reviews.map(rev => (
                      <div key={rev._id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', padding: '0.85rem', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{rev.customerName}</strong>
                          <div style={{ color: '#f1c40f', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Star size={12} fill="#f1c40f" /> {rev.rating} / 5
                          </div>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>"{rev.comment}"</p>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          Service: {rev.serviceName || 'Salon Service'} • Date: {rev.date}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {detailDrawerTab === 'appointments' && (
              <div className="table-responsive">
                <table className="premium-table" style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th>Date / Time</th>
                      <th>Service</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStaffMetrics.appointments.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No appointments found.</td></tr>
                    ) : (
                      selectedStaffMetrics.appointments.map(appt => (
                        <tr key={appt._id}>
                          <td>{appt.date} ({appt.time})</td>
                          <td>{(appt.services || []).map(s => s.name).join(', ')}</td>
                          <td>
                            <span style={{
                              color: appt.status === 'Completed' ? 'var(--accent-green)' : 'var(--gold-primary)'
                            }}>
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {detailDrawerTab === 'attendance' && (
              <div style={{ fontSize: '0.78rem' }}>
                <p>Present Days Tracked: <strong>{selectedStaffMetrics.presentDays} / {selectedStaffMetrics.totalDaysTracked}</strong></p>
                <p>Calculated Punctuality Rate: <strong style={{ color: 'var(--accent-green)' }}>{selectedStaffMetrics.attendanceRate}%</strong></p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ADD / EDIT STAFF MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showStaffModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowStaffModal(false); setEditingStaff(null); } }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>{editingStaff ? 'Edit Staff Member Profile' : 'Register Professional Stylist'}</h3>
              <button onClick={() => { setShowStaffModal(false); setEditingStaff(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleStaffSubmit}>
              {/* Profile Photo Uploader */}
              <div style={{ marginBottom: '1.25rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--gold-primary)', display: 'block', marginBottom: '0.5rem' }}>
                  Staff Profile Picture
                </label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <img 
                    src={staffAvatar || PRESET_STAFF_AVATARS[0]} 
                    alt="Staff Avatar Preview" 
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-primary)' }}
                  />
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <label className="outline-btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Upload size={13} /> Upload Photo File
                        <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setStaffAvatar)} style={{ display: 'none' }} />
                      </label>
                    </div>
                    <input 
                      type="url" 
                      placeholder="Or enter Image URL..." 
                      className="form-control" 
                      style={{ fontSize: '0.75rem' }}
                      value={staffAvatar} 
                      onChange={(e) => setStaffAvatar(e.target.value)} 
                    />
                  </div>
                </div>

                {/* Preset Avatars */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Presets:</span>
                  {PRESET_STAFF_AVATARS.map((pUrl, idx) => (
                    <img 
                      key={idx} 
                      src={pUrl} 
                      alt={`Preset ${idx + 1}`}
                      onClick={() => setStaffAvatar(pUrl)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: staffAvatar === pUrl ? '2px solid var(--gold-primary)' : '1px solid var(--border-light)'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Stylist Name *</label>
                <input type="text" required placeholder="Emma Watson" className="form-control" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input type="text" required placeholder="9876500001" className="form-control" value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Login Email (Optional)</label>
                  <input type="email" placeholder="emma@salonsync.com" className="form-control" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} />
                </div>
              </div>

              {!editingStaff && (
                <div className="form-group">
                  <label>Staff Password (Default: password123)</label>
                  <input type="text" className="form-control" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} />
                </div>
              )}

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Professional Role / Title</label>
                  <input type="text" placeholder="Senior Hair Stylist" className="form-control" value={staffRole} onChange={(e) => setStaffRole(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Experience Level</label>
                  <select value={staffExpLevel} onChange={(e) => setStaffExpLevel(e.target.value)} className="form-control">
                    <option value="Junior Artist">Junior Artist</option>
                    <option value="Senior Specialist">Senior Specialist</option>
                    <option value="Lead Specialist">Lead Specialist</option>
                    <option value="Master Artist">Master Artist</option>
                    <option value="Celebrity Master">Celebrity Master</option>
                  </select>
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Years of Experience</label>
                  <input type="number" placeholder="4" className="form-control" value={staffExpYears} onChange={(e) => setStaffExpYears(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={staffStatus} onChange={(e) => setStaffStatus(e.target.value)} className="form-control">
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Specializations (Comma separated)</label>
                <input type="text" placeholder="Signature Haircut, Global Balayage, Keratin" className="form-control" value={staffSpecializations} onChange={(e) => setStaffSpecializations(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Staff Bio Profile</label>
                <textarea rows="2" placeholder="Brief background & expertise summary..." className="form-control" value={staffBio} onChange={(e) => setStaffBio(e.target.value)} />
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Base Monthly Salary (₹) *</label>
                  <input type="number" required placeholder="25000" className="form-control" value={staffSalary} onChange={(e) => setStaffSalary(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Commission Rate (%)</label>
                  <input type="number" placeholder="15" className="form-control" value={staffComm} onChange={(e) => setStaffComm(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                {editingStaff ? 'Update Employee Profile' : 'Save Employee Profile & Create Login'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* LOG CUSTOMER REVIEW MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showReviewModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowReviewModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Log Customer Feedback & Review</h3>
              <button onClick={() => setShowReviewModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label>Select Staff Professional *</label>
                <select 
                  value={reviewStaffId} 
                  onChange={(e) => setReviewStaffId(e.target.value)} 
                  className="form-control" 
                  required
                >
                  <option value="">-- Choose Staff --</option>
                  {staffList.map(st => (
                    <option key={st._id} value={st._id}>{st.name} ({st.role})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Customer Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Priyanka Chopra" 
                  className="form-control" 
                  value={reviewCustomerName} 
                  onChange={(e) => setReviewCustomerName(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Service Rendered</label>
                <input 
                  type="text" 
                  placeholder="e.g. Signature Haircut & Styling" 
                  className="form-control" 
                  value={reviewServiceName} 
                  onChange={(e) => setReviewServiceName(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Star Rating (1 - 5)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: star <= reviewRating ? '#f1c40f' : 'var(--text-muted)'
                      }}
                    >
                      <Star size={24} fill={star <= reviewRating ? '#f1c40f' : 'none'} />
                    </button>
                  ))}
                  <strong style={{ color: 'var(--gold-primary)', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                    {reviewRating} / 5
                  </strong>
                </div>
              </div>

              <div className="form-group">
                <label>Review Comment / Feedback</label>
                <textarea 
                  rows="3" 
                  placeholder="Enter detailed feedback from customer..." 
                  className="form-control" 
                  value={reviewComment} 
                  onChange={(e) => setReviewComment(e.target.value)} 
                />
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
                Submit Review & Update Rating
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CREATED CREDENTIALS MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {createdCredentials && (
        <div className="modal-backdrop-overlay" onClick={() => setCreatedCredentials(null)}>
          <div className="modal-scrollable-content" style={{ maxWidth: '420px', background: 'var(--bg-secondary)', border: '1px solid var(--gold-primary)', borderRadius: '12px', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gold-bg)', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <UserCheck size={24} />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', marginBottom: '0.5rem' }}>Staff Login Account Created!</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Provide these credentials to your staff member to log in:</p>

            <div style={{ background: '#0b141a', border: '1px solid var(--gold-border)', borderRadius: '8px', padding: '1rem', textAlign: 'left', fontSize: '0.82rem', fontFamily: 'monospace', color: '#fff', marginBottom: '1.25rem' }}>
              <div style={{ marginBottom: '0.4rem' }}>📱 <strong>Login Phone:</strong> {createdCredentials.phone}</div>
              <div style={{ marginBottom: '0.4rem' }}>✉️ <strong>Login Email:</strong> {createdCredentials.email}</div>
              <div>🔑 <strong>Password:</strong> <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>{createdCredentials.password}</span></div>
            </div>

            <button onClick={() => setCreatedCredentials(null)} className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
              Got It
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* QUICK STAFF PROFILE PHOTO CHANGE MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {quickPhotoStaff && (
        <div className="modal-backdrop-overlay" onClick={(e) => { if (e.target === e.currentTarget) setQuickPhotoStaff(null); }}>
          <div className="modal-scrollable-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={18} style={{ color: 'var(--gold-primary)' }} />
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '700' }}>Update Photo for {quickPhotoStaff.name}</h3>
              </div>
              <button onClick={() => setQuickPhotoStaff(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img 
                src={quickPhotoUrl || PRESET_STAFF_AVATARS[0]} 
                alt={quickPhotoStaff.name} 
                style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--gold-primary)', margin: '0 auto', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'center' }}>
              <label className="gold-btn" style={{ padding: '0.5rem 1.2rem', fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Upload size={14} /> Upload From Device
                <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setQuickPhotoUrl)} style={{ display: 'none' }} />
              </label>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.78rem' }}>Or Paste Image URL</label>
              <input 
                type="url" 
                placeholder="https://..." 
                className="form-control" 
                value={quickPhotoUrl} 
                onChange={(e) => setQuickPhotoUrl(e.target.value)} 
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Select From Luxury Presets:</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {PRESET_STAFF_AVATARS.map((pUrl, idx) => (
                  <img 
                    key={idx} 
                    src={pUrl} 
                    alt={`Preset ${idx + 1}`}
                    onClick={() => setQuickPhotoUrl(pUrl)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: quickPhotoUrl === pUrl ? '2px solid var(--gold-primary)' : '1px solid var(--border-light)',
                      transition: 'transform 0.15s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            <button onClick={handleQuickPhotoSave} className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
              Save Profile Picture
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Staff;
