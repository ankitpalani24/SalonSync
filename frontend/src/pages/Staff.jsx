import React, { useState } from 'react';
import { Plus, User, Clock, Award, Shield, UserCheck, Calculator, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Staff = () => {
  const { tenantFilter, db, addStaff, clockInStaff, clockOutStaff } = useApp();

  const staff = tenantFilter(db.staff);
  const attendance = tenantFilter(db.attendance);
  const commissions = tenantFilter(db.commissions);

  const [activePane, setActivePane] = useState('roster'); // 'roster', 'attendance', 'commissions'
  const [showStaffModal, setShowStaffModal] = useState(false);

  // Form states - Staff
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState('Hair Stylist');
  const [staffSalary, setStaffSalary] = useState(20000);
  const [staffComm, setStaffComm] = useState(10); // 10% default

  const handleStaffSubmit = (e) => {
    e.preventDefault();
    addStaff({
      name: staffName,
      phone: staffPhone,
      role: staffRole,
      salary: Number(staffSalary),
      commissionPercentage: Number(staffComm)
    });
    setShowStaffModal(false);

    // reset
    setStaffName('');
    setStaffPhone('');
  };

  const handleClockIn = (id) => {
    clockInStaff(id);
  };

  const handleClockOut = (id) => {
    clockOutStaff(id);
  };

  const today = new Date().toLocaleDateString('en-CA');

  return (
    <div className="page-container animated-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Staff & HR Desk</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Log staff rosters, track hours, and generate commission reports.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.2rem', borderRadius: '4px' }}>
          <button onClick={() => setActivePane('roster')} style={{ border: 'none', background: activePane === 'roster' ? 'var(--gold-primary)' : 'transparent', color: activePane === 'roster' ? '#000' : '#aaa', fontSize: '0.75rem', fontWeight: '600', padding: '0.35rem 0.75rem', borderRadius: '3px' }}>
            Stylists Roster
          </button>
          <button onClick={() => setActivePane('attendance')} style={{ border: 'none', background: activePane === 'attendance' ? 'var(--gold-primary)' : 'transparent', color: activePane === 'attendance' ? '#000' : '#aaa', fontSize: '0.75rem', fontWeight: '600', padding: '0.35rem 0.75rem', borderRadius: '3px' }}>
            Daily Attendance
          </button>
          <button onClick={() => setActivePane('commissions')} style={{ border: 'none', background: activePane === 'commissions' ? 'var(--gold-primary)' : 'transparent', color: activePane === 'commissions' ? '#000' : '#aaa', fontSize: '0.75rem', fontWeight: '600', padding: '0.35rem 0.75rem', borderRadius: '3px' }}>
            Commissions Payouts
          </button>
        </div>
      </div>

      {/* 1. ROSTER VIEW */}
      {activePane === 'roster' && (
        <div>
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Active Salon Professionals</h3>
            <button onClick={() => setShowStaffModal(true)} className="gold-btn" style={{ padding: '0.5rem 1rem' }}>
              <Plus size={16} /> Add Employee
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {staff.map(member => {
              const staffCommLogs = commissions.filter(c => c.staffId === member._id);
              const totalCommEarned = staffCommLogs.reduce((sum, c) => sum + c.commissionEarned, 0);

              return (
                <div key={member._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'var(--gold-bg)',
                      border: '1px solid var(--gold-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--gold-primary)',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}>
                      {member.name[0]}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '600' }}>{member.name}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', fontWeight: '500' }}>{member.role}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    <p><strong>Mobile:</strong> {member.phone}</p>
                    <p><strong>Base Monthly Salary:</strong> ₹{member.salary.toLocaleString()}</p>
                    <p><strong>Commission Ratio:</strong> {member.commissionPercentage}% on services</p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <strong>Performance:</strong> <Award size={14} style={{ color: 'var(--gold-primary)' }} /> {member.rating || 5.0} / 5
                    </p>
                  </div>

                  {/* Summary Footer */}
                  <div style={{
                    marginTop: 'auto',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '4px',
                    padding: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem'
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Month Commissions:</span>
                    <strong style={{ color: 'var(--accent-green)' }}>₹{totalCommEarned.toLocaleString()}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. ATTENDANCE VIEW */}
      {activePane === 'attendance' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Check In/Out Station ({today})</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shift limits: 8 Hours standard</span>
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
                {staff.map(member => {
                  const log = attendance.find(a => a.staffId === member._id && a.date === today);
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
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px'
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
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px'
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

      {/* 3. COMMISSIONS STATEMENT VIEW */}
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
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No commissions transactions recorded.</td>
                  </tr>
                ) : (
                  commissions.map(c => {
                    const member = db.staff.find(st => st._id === c.staffId);
                    const inv = db.invoices.find(i => i._id === c.invoiceId);
                    return (
                      <tr key={c._id}>
                        <td>
                          <strong>{member ? member.name : 'Unknown Employee'}</strong>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{member ? member.role : ''}</p>
                        </td>
                        <td>
                          <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                            {inv ? inv.invoiceNumber : 'INV-REF'}
                          </span>
                        </td>
                        <td>₹{c.revenueGenerated}</td>
                        <td>{c.commissionRate}%</td>
                        <td>
                          <strong style={{ color: 'var(--accent-green)' }}>₹{c.commissionEarned}</strong>
                        </td>
                        <td>{c.date}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showStaffModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card gold-border" style={{ width: '400px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Register Professional Stylist</h3>
              <button onClick={() => setShowStaffModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleStaffSubmit}>
              <div className="form-group">
                <label>Stylist Name *</label>
                <input type="text" required placeholder="Emma Watson" className="form-control" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Mobile Number *</label>
                <input type="text" required placeholder="9876500001" className="form-control" value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Professional Role / Title</label>
                <input type="text" placeholder="Senior Hair Stylist" className="form-control" value={staffRole} onChange={(e) => setStaffRole(e.target.value)} />
              </div>
              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Base Monthly Salary (₹) *</label>
                  <input type="number" required placeholder="25000" className="form-control" value={staffSalary} onChange={(e) => setStaffSalary(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Commission Rate (%)</label>
                  <input type="number" placeholder="10" className="form-control" value={staffComm} onChange={(e) => setStaffComm(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>Save Employee File</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Staff;
