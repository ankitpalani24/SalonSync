import React, { useState, useMemo } from 'react';
import { 
  Crown, Award, ShieldCheck, Zap, Plus, Edit, Trash2, CheckCircle2, 
  Clock, Calendar, Sparkles, Filter, AlertCircle, RefreshCw, Send, 
  Check, X, ChevronRight, Gift, Scissors, Star, User, Users, CreditCard
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Memberships = () => {
  const { 
    currentUser, tenantFilter, db, 
    addMembershipPlan, updateMembershipPlan, deleteMembershipPlan, 
    subscribeCustomerMembership, redeemMembershipBenefit, triggerMembershipExpiryNotifications, 
    getCustomerMembershipSummary, addToast, hasPermission, PERMISSIONS 
  } = useApp();

  const customersList = tenantFilter(db.customers || []);
  const plansList = (db.memberships || []).filter(p => p.active !== false);
  const subscriptionsList = tenantFilter(db.customerMemberships || []);
  const servicesList = tenantFilter(db.services || []);

  // Main Active Tab: 'customer_portal', 'subscriptions_list', 'plans_configurator'
  const [activeTab, setActiveTab] = useState('customer_portal');

  // Customer Portal Selection
  const [selectedCustomerId, setSelectedCustomerId] = useState(customersList[0]?._id || '');

  // Subscriptions List Filter
  const [subStatusFilter, setSubStatusFilter] = useState('ALL');

  // Modals state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subCustomerId, setSubCustomerId] = useState('');
  const [subPlanId, setSubPlanId] = useState('');

  // Form State - Add / Edit Plan
  const [planName, setPlanName] = useState('');
  const [planTier, setPlanTier] = useState('Gold');
  const [planPrice, setPlanPrice] = useState(10000);
  const [planDiscount, setPlanDiscount] = useState(15);
  const [planValidityMonths, setPlanValidityMonths] = useState(12);
  const [planPriorityBooking, setPlanPriorityBooking] = useState(true);
  const [planLoyaltyMultiplier, setPlanLoyaltyMultiplier] = useState(1.5);
  const [planSpecialOffers, setPlanSpecialOffers] = useState('');
  const [planDescription, setPlanDescription] = useState('');

  // Service session allocations in plan form
  const [includedServicesMap, setIncludedServicesMap] = useState({});

  // Calculate Membership Summary for selected customer
  const membershipSummary = useMemo(() => {
    if (!selectedCustomerId) return null;
    return getCustomerMembershipSummary(selectedCustomerId);
  }, [selectedCustomerId, db.customers, db.customerMemberships, db.memberships]);

  // Open Plan Modal
  const openPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanName(plan.name || '');
      setPlanTier(plan.tier || 'Gold');
      setPlanPrice(plan.price || 10000);
      setPlanDiscount(plan.discountPercentage || 15);
      setPlanValidityMonths(plan.validityMonths || 12);
      setPlanPriorityBooking(plan.priorityBooking !== false);
      setPlanLoyaltyMultiplier(plan.loyaltyMultiplier || 1.5);
      setPlanSpecialOffers((plan.specialOffers || []).join(', '));
      setPlanDescription(plan.description || '');

      const srvMap = {};
      (plan.includedServices || []).forEach(srv => {
        srvMap[srv.serviceId] = srv.sessionsCount;
      });
      setIncludedServicesMap(srvMap);
    } else {
      setEditingPlan(null);
      setPlanName('');
      setPlanTier('Gold');
      setPlanPrice(10000);
      setPlanDiscount(15);
      setPlanValidityMonths(12);
      setPlanPriorityBooking(true);
      setPlanLoyaltyMultiplier(1.5);
      setPlanSpecialOffers('15% off all retail products, VIP Lounge Access, Birthday Spa');
      setPlanDescription('');
      setIncludedServicesMap({});
    }
    setShowPlanModal(true);
  };

  // Submit Plan Form
  const handlePlanSubmit = async (e) => {
    e.preventDefault();

    const incServices = Object.keys(includedServicesMap)
      .filter(srvId => Number(includedServicesMap[srvId]) > 0)
      .map(srvId => {
        const srv = servicesList.find(s => String(s._id) === String(srvId));
        return {
          serviceId: srvId,
          name: srv ? srv.name : 'Service',
          sessionsCount: Number(includedServicesMap[srvId])
        };
      });

    const offersArr = planSpecialOffers
      ? planSpecialOffers.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const payload = {
      name: planName,
      tier: planTier,
      price: Number(planPrice),
      discountPercentage: Number(planDiscount),
      validityMonths: Number(planValidityMonths),
      includedServices: incServices,
      priorityBooking: planPriorityBooking,
      loyaltyMultiplier: Number(planLoyaltyMultiplier),
      specialOffers: offersArr,
      description: planDescription,
      active: true
    };

    if (editingPlan) {
      await updateMembershipPlan(editingPlan._id, payload);
    } else {
      await addMembershipPlan(payload);
    }

    setShowPlanModal(false);
    setEditingPlan(null);
  };

  // Handle Subscribe Customer Submit
  const handleSubscribeSubmit = async (e) => {
    e.preventDefault();
    if (!subCustomerId || !subPlanId) return;

    await subscribeCustomerMembership({
      customerId: subCustomerId,
      membershipPlanId: subPlanId
    });

    setShowSubscribeModal(false);
  };

  // Redeem Included Benefit Session
  const handleRedeemBenefit = async (subscriptionId, serviceId) => {
    await redeemMembershipBenefit({
      subscriptionId,
      serviceId
    });
  };

  // Trigger Expiry Notifications
  const handleSendExpiryReminders = async () => {
    await triggerMembershipExpiryNotifications();
  };

  // Get Card Background Styling based on Tier
  const getTierCardStyle = (tier = 'Gold') => {
    switch (String(tier).toLowerCase()) {
      case 'platinum':
        return {
          background: 'linear-gradient(135deg, #2c3e50 0%, #000000 50%, #34495e 100%)',
          border: '1px solid #7f8c8d',
          badgeBg: 'rgba(236, 240, 241, 0.2)',
          badgeColor: '#ecf0f1',
          iconColor: '#e0e0e0'
        };
      case 'silver':
        return {
          background: 'linear-gradient(135deg, #4a5568 0%, #1a202c 100%)',
          border: '1px solid #a0aec0',
          badgeBg: 'rgba(226, 232, 240, 0.2)',
          badgeColor: '#e2e8f0',
          iconColor: '#cbd5e0'
        };
      case 'gold':
      default:
        return {
          background: 'linear-gradient(135deg, #4a3b10 0%, #0f0c03 70%, #856404 100%)',
          border: '1px solid var(--gold-border)',
          badgeBg: 'var(--gold-bg)',
          badgeColor: 'var(--gold-primary)',
          iconColor: 'var(--gold-primary)'
        };
    }
  };

  const filteredSubscriptions = subscriptionsList.filter(sub => {
    if (subStatusFilter === 'ALL') return true;
    return sub.status === subStatusFilter;
  });

  return (
    <div className="page-container animated-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Salon Membership System</h1>
            <span style={{ 
              background: 'var(--gold-bg)', 
              color: 'var(--gold-primary)', 
              border: '1px solid var(--gold-border)', 
              fontSize: '0.65rem', 
              fontWeight: '700', 
              padding: '0.2rem 0.5rem', 
              borderRadius: '12px' 
            }}>
              TIER PASS EDITION
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Manage Silver, Gold, & Platinum membership passes, benefits usage, and automated expiry notifications.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', padding: '0.25rem', borderRadius: '6px' }}>
          <button 
            onClick={() => setActiveTab('customer_portal')} 
            style={{ 
              border: 'none', 
              background: activeTab === 'customer_portal' ? 'var(--gold-primary)' : 'transparent', 
              color: activeTab === 'customer_portal' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <Crown size={14} /> Digital Pass Portal
          </button>
          <button 
            onClick={() => setActiveTab('subscriptions_list')} 
            style={{ 
              border: 'none', 
              background: activeTab === 'subscriptions_list' ? 'var(--gold-primary)' : 'transparent', 
              color: activeTab === 'subscriptions_list' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <Users size={14} /> Customer Subscriptions
          </button>
          <button 
            onClick={() => setActiveTab('plans_configurator')} 
            style={{ 
              border: 'none', 
              background: activeTab === 'plans_configurator' ? 'var(--gold-primary)' : 'transparent', 
              color: activeTab === 'plans_configurator' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <Sparkles size={14} /> Tier Plans Configurator
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. CUSTOMER DIGITAL MEMBERSHIP PASS PORTAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'customer_portal' && (
        <div>
          {/* Customer Picker */}
          <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                Select Active Customer:
              </span>
              <select 
                value={selectedCustomerId} 
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="form-control"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', background: 'var(--bg-card)', minWidth: '240px' }}
              >
                {customersList.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} • {c.membershipLevel || 'No'} Membership
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => {
                setSubCustomerId(selectedCustomerId);
                setShowSubscribeModal(true);
              }} 
              className="gold-btn" 
              style={{ padding: '0.45rem 1rem', fontSize: '0.78rem' }}
            >
              <Plus size={15} /> Subscribe / Renew Pass
            </button>
          </div>

          {membershipSummary?.subscription ? (
            <div>
              {/* Glossy Digital Membership Pass Card */}
              {(() => {
                const cardStyle = getTierCardStyle(membershipSummary.subscription.tier);
                const sub = membershipSummary.subscription;

                return (
                  <div className="glass-card" style={{ 
                    marginBottom: '1.5rem', 
                    background: cardStyle.background, 
                    border: cardStyle.border,
                    borderRadius: '16px',
                    padding: '1.75rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Background Metallic Accent */}
                    <div style={{
                      position: 'absolute',
                      top: '-30px',
                      right: '-30px',
                      width: '180px',
                      height: '180px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.03)',
                      pointerEvents: 'none'
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: cardStyle.badgeBg,
                          border: `1px solid ${cardStyle.badgeColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: cardStyle.badgeColor
                        }}>
                          <Crown size={26} />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: cardStyle.badgeColor, fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            SALONSYNC {sub.tier} PASS
                          </span>
                          <h2 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: '700', margin: '0.1rem 0 0 0' }}>
                            {membershipSummary.customer.name}
                          </h2>
                        </div>
                      </div>

                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        background: sub.status === 'Active' ? 'rgba(46, 204, 113, 0.2)' : sub.status === 'Expiring Soon' ? 'rgba(241, 196, 15, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                        color: sub.status === 'Active' ? 'var(--accent-green)' : sub.status === 'Expiring Soon' ? '#f1c40f' : 'var(--accent-red)',
                        border: `1px solid ${sub.status === 'Active' ? 'rgba(46, 204, 113, 0.4)' : sub.status === 'Expiring Soon' ? 'rgba(241, 196, 15, 0.4)' : 'rgba(231, 76, 60, 0.4)'}`
                      }}>
                        {sub.status || 'Active'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.25rem', pt: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Tier Discount Rate</span>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: cardStyle.badgeColor, marginTop: '0.1rem' }}>
                          {sub.discountPercentage}% OFF
                        </div>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>On all services & products</span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Valid From</span>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', marginTop: '0.2rem' }}>
                          {sub.startDate}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Expiry Date</span>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', marginTop: '0.2rem' }}>
                          {sub.expiryDate}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Price Paid</span>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', marginTop: '0.2rem' }}>
                          ₹{sub.pricePaid ? sub.pricePaid.toLocaleString() : '0'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Tier Benefits & Special Offers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="glass-card">
                  <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={18} style={{ color: 'var(--gold-primary)' }} />
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '600' }}>Included Service Sessions</h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {membershipSummary.benefitsUsed.length === 0 ? (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No free service sessions included in this tier.</p>
                    ) : (
                      membershipSummary.benefitsUsed.map((benefit, i) => {
                        const remaining = benefit.totalSessions - benefit.sessionsUsed;

                        return (
                          <div key={i} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', padding: '0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{benefit.serviceName}</strong>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                {benefit.sessionsUsed} of {benefit.totalSessions} sessions used ({remaining} remaining)
                              </div>
                            </div>

                            <button
                              disabled={remaining <= 0}
                              onClick={() => handleRedeemBenefit(membershipSummary.subscription._id, benefit.serviceId)}
                              className={remaining > 0 ? "gold-btn" : "outline-btn"}
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.7rem', opacity: remaining > 0 ? 1 : 0.4 }}
                            >
                              {remaining > 0 ? 'Redeem 1 Session' : 'All Used'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="glass-card">
                  <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={18} style={{ color: 'var(--gold-primary)' }} />
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '600' }}>Tier Perks & Special Offers</h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-green)' }}>
                      <Check size={16} /> <strong>{membershipSummary.subscription.discountPercentage}% Discount</strong> on all salon billings.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold-primary)' }}>
                      <Check size={16} /> <strong>Priority Booking Access</strong> for peak weekend slots.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
                      <Check size={16} /> <strong>Loyalty Point Multiplier</strong> (1.5x - 2.0x points earned per visit).
                    </div>

                    {(membershipSummary.activePlan?.specialOffers || []).map((offer, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        <Gift size={14} style={{ color: 'var(--gold-primary)' }} /> {offer}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Membership Audit History Ledger */}
              <div className="glass-card">
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '600' }}>Membership Action Ledger</h4>
                </div>

                <div className="table-responsive">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membershipSummary.history.length === 0 ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No history records found.</td></tr>
                      ) : (
                        membershipSummary.history.map((h, i) => (
                          <tr key={i}>
                            <td>{h.date ? new Date(h.date).toLocaleDateString() : 'Today'}</td>
                            <td>
                              <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-primary)' }}>
                                {h.action}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{h.details}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Crown size={40} style={{ color: 'var(--gold-primary)', margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>No Active Membership Subscription</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Selected customer currently does not have an active Silver, Gold, or Platinum pass.</p>
              <button 
                onClick={() => {
                  setSubCustomerId(selectedCustomerId);
                  setShowSubscribeModal(true);
                }} 
                className="gold-btn" 
                style={{ margin: '0 auto' }}
              >
                Subscribe Customer to Membership Plan
              </button>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. CUSTOMER SUBSCRIPTIONS LIST (STAFF / OWNER VIEW) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'subscriptions_list' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>Active Customer Subscriptions</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monitor customer memberships, expiration dates, and send automated reminders.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select 
                  value={subStatusFilter} 
                  onChange={(e) => setSubStatusFilter(e.target.value)}
                  className="form-control"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', width: 'auto', background: 'var(--bg-card)' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                </select>

                <button onClick={handleSendExpiryReminders} className="gold-btn" style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}>
                  <Send size={14} /> Send Expiry Reminders
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Membership Tier</th>
                    <th>Discount Rate</th>
                    <th>Start Date</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No customer subscriptions found.</td></tr>
                  ) : (
                    filteredSubscriptions.map(sub => {
                      const cust = customersList.find(c => String(c._id) === String(sub.customerId));

                      return (
                        <tr key={sub._id}>
                          <td>
                            <strong style={{ color: 'var(--text-primary)' }}>{cust ? cust.name : 'Valued Customer'}</strong>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cust ? cust.phone : ''}</p>
                          </td>
                          <td>
                            <span style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              background: sub.tier === 'Platinum' ? 'rgba(236, 240, 241, 0.15)' : sub.tier === 'Gold' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(160, 174, 192, 0.15)',
                              color: sub.tier === 'Platinum' ? '#ecf0f1' : sub.tier === 'Gold' ? 'var(--gold-primary)' : '#a0aec0'
                            }}>
                              {sub.tier} Pass
                            </span>
                          </td>
                          <td><strong>{sub.discountPercentage}% OFF</strong></td>
                          <td>{sub.startDate}</td>
                          <td>{sub.expiryDate}</td>
                          <td>
                            <span style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '12px',
                              fontSize: '0.68rem',
                              fontWeight: 'bold',
                              background: sub.status === 'Active' ? 'rgba(46, 204, 113, 0.15)' : sub.status === 'Expiring Soon' ? 'rgba(241, 196, 15, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                              color: sub.status === 'Active' ? 'var(--accent-green)' : sub.status === 'Expiring Soon' ? '#f1c40f' : 'var(--accent-red)'
                            }}>
                              {sub.status || 'Active'}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => {
                                setSelectedCustomerId(cust ? cust._id : sub.customerId);
                                setActiveTab('customer_portal');
                              }}
                              className="outline-btn"
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.7rem' }}
                            >
                              View Pass
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. MEMBERSHIP PLANS CONFIGURATOR */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'plans_configurator' && (
        <div>
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>Membership Tier Plans Catalogue</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure Silver, Gold, Platinum, and Custom membership packages.</p>
            </div>
            {hasPermission(PERMISSIONS.INVENTORY_EDIT) && (
              <button onClick={() => openPlanModal(null)} className="gold-btn" style={{ padding: '0.5rem 1.1rem' }}>
                <Plus size={16} /> Create Membership Plan
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {plansList.map(plan => {
              const cardStyle = getTierCardStyle(plan.tier || plan.name);

              return (
                <div key={plan._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--gold-primary)', fontWeight: '700', textTransform: 'uppercase' }}>{plan.tier || 'TIER'} PLAN</span>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: '700', margin: '0.1rem 0' }}>{plan.name}</h3>
                    </div>
                    {hasPermission(PERMISSIONS.INVENTORY_EDIT) && (
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button onClick={() => openPlanModal(plan)} className="outline-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}>
                          Edit
                        </button>
                        <button onClick={() => deleteMembershipPlan(plan._id)} className="outline-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
                    ₹{(plan.price || 0).toLocaleString()} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {plan.validityMonths} months</span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {plan.description || 'Comprehensive salon privileges package.'}
                  </p>

                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                    <div>Discount Rate: <strong>{plan.discountPercentage}% OFF</strong></div>
                    <div>Loyalty Multiplier: <strong>{plan.loyaltyMultiplier || 1.5}x Points</strong></div>
                    <div>Priority Booking: <strong>{plan.priorityBooking ? 'Yes' : 'No'}</strong></div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>Included Free Services:</span>
                    <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', marginTop: '0.3rem' }}>
                      {(plan.includedServices || []).map((srv, idx) => (
                        <li key={idx}>{srv.sessionsCount}x {srv.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SUBSCRIBE CUSTOMER MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showSubscribeModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowSubscribeModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Subscribe Customer to Membership Plan</h3>
              <button onClick={() => setShowSubscribeModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubscribeSubmit}>
              <div className="form-group">
                <label>Select Customer *</label>
                <select 
                  value={subCustomerId} 
                  onChange={(e) => setSubCustomerId(e.target.value)} 
                  className="form-control" 
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {customersList.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Membership Tier Plan *</label>
                <select 
                  value={subPlanId} 
                  onChange={(e) => setSubPlanId(e.target.value)} 
                  className="form-control" 
                  required
                >
                  <option value="">-- Choose Tier Plan --</option>
                  {plansList.map(p => (
                    <option key={p._id} value={p._id}>{p.name} (₹{p.price} • {p.discountPercentage}% Off)</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
                Confirm Subscription Pass
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ADD / EDIT PLAN MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showPlanModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowPlanModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>{editingPlan ? 'Edit Membership Plan' : 'Create Membership Plan'}</h3>
              <button onClick={() => setShowPlanModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handlePlanSubmit}>
              <div className="form-group">
                <label>Plan Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Gold Royalty Pass" 
                  className="form-control" 
                  value={planName} 
                  onChange={(e) => setPlanName(e.target.value)} 
                />
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Tier Category *</label>
                  <select value={planTier} onChange={(e) => setPlanTier(e.target.value)} className="form-control">
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" required placeholder="10000" className="form-control" value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Discount Rate (%) *</label>
                  <input type="number" required placeholder="15" className="form-control" value={planDiscount} onChange={(e) => setPlanDiscount(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Validity (Months) *</label>
                  <input type="number" required placeholder="12" className="form-control" value={planValidityMonths} onChange={(e) => setPlanValidityMonths(e.target.value)} />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Loyalty Points Multiplier</label>
                  <input type="number" step="0.1" placeholder="1.5" className="form-control" value={planLoyaltyMultiplier} onChange={(e) => setPlanLoyaltyMultiplier(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Priority Booking</label>
                  <select value={planPriorityBooking ? 'true' : 'false'} onChange={(e) => setPlanPriorityBooking(e.target.value === 'true')} className="form-control">
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Included Free Service Sessions (Session Count per Service)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                  {servicesList.map(srv => (
                    <div key={srv._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{srv.name}</span>
                      <input 
                        type="number" 
                        min="0" 
                        placeholder="0" 
                        style={{ width: '60px', padding: '0.2rem 0.4rem', fontSize: '0.75rem', background: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-light)', borderRadius: '4px' }} 
                        value={includedServicesMap[srv._id] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setIncludedServicesMap(prev => ({
                            ...prev,
                            [srv._id]: val
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Special Offers (Comma separated)</label>
                <input type="text" placeholder="VIP Lounge Access, 15% off products, Birthday Spa" className="form-control" value={planSpecialOffers} onChange={(e) => setPlanSpecialOffers(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Plan Description</label>
                <textarea rows="2" placeholder="Brief summary of membership benefits..." className="form-control" value={planDescription} onChange={(e) => setPlanDescription(e.target.value)} />
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
                {editingPlan ? 'Update Membership Plan' : 'Save Membership Plan'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Memberships;
