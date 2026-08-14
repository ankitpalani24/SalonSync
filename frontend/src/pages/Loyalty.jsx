import React, { useState, useMemo } from 'react';
import { 
  Gift, Award, Shield, Star, Plus, Edit, Trash2, CheckCircle2, 
  Clock, ArrowUpRight, TrendingUp, Filter, AlertCircle, Sparkles, 
  Zap, Lock, History, DollarSign, UserCheck, ChevronRight, X, 
  HelpCircle, Settings, RefreshCw, Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Loyalty = () => {
  const { 
    currentUser, tenantFilter, db, 
    updateLoyaltyRules, addLoyaltyReward, updateLoyaltyReward, deleteLoyaltyReward, 
    redeemLoyaltyReward, getLoyaltySummary, addToast, hasPermission, PERMISSIONS 
  } = useApp();

  const customersList = tenantFilter(db.customers || []);
  const rewardsList = (db.loyaltyRewards || []).filter(r => r.active !== false);
  const rulesConfig = db.loyaltyRules || {
    pointsEarnedPer100Spent: 10,
    pointValueInRupees: 1,
    expiryMonths: 12,
    maxPointsPerInvoice: 5000,
    maxRedemptionsPerMonth: 10
  };

  // Main Active Tab: 'customer_portal', 'catalogue', 'rules'
  const [activeTab, setActiveTab] = useState('customer_portal');

  // Customer Portal Selection
  const [selectedCustomerId, setSelectedCustomerId] = useState(customersList[0]?._id || '');

  // Modals
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);

  // Form State - Add / Edit Reward
  const [rewardName, setRewardName] = useState('');
  const [rewardType, setRewardType] = useState('Discount');
  const [rewardPointsCost, setRewardPointsCost] = useState(200);
  const [rewardDiscountValue, setRewardDiscountValue] = useState(200);
  const [rewardDescription, setRewardDescription] = useState('');
  const [rewardExpiryDays, setRewardExpiryDays] = useState(30);

  // Form State - Loyalty Rules Config
  const [ptsPer100, setPtsPer100] = useState(rulesConfig.pointsEarnedPer100Spent || 10);
  const [ptValue, setPtValue] = useState(rulesConfig.pointValueInRupees || 1);
  const [expiryMonths, setExpiryMonths] = useState(rulesConfig.expiryMonths || 12);
  const [maxPtsPerInv, setMaxPtsPerInv] = useState(rulesConfig.maxPointsPerInvoice || 5000);

  // Calculate Loyalty Summary for selected customer
  const loyaltySummary = useMemo(() => {
    if (!selectedCustomerId) return null;
    return getLoyaltySummary(selectedCustomerId);
  }, [selectedCustomerId, db.customers, db.loyaltyTransactions, db.loyaltyRewards]);

  // Handle Reward Modal Submit
  const handleRewardSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: rewardName,
      type: rewardType,
      pointsCost: Number(rewardPointsCost),
      discountValue: Number(rewardDiscountValue),
      description: rewardDescription,
      expiryDays: Number(rewardExpiryDays),
      active: true
    };

    if (editingReward) {
      await updateLoyaltyReward(editingReward._id, payload);
    } else {
      await addLoyaltyReward(payload);
    }

    setShowRewardModal(false);
    setEditingReward(null);
    setRewardName('');
    setRewardDescription('');
  };

  const openRewardModal = (reward = null) => {
    if (reward) {
      setEditingReward(reward);
      setRewardName(reward.name || '');
      setRewardType(reward.type || 'Discount');
      setRewardPointsCost(reward.pointsCost || 200);
      setRewardDiscountValue(reward.discountValue || 200);
      setRewardDescription(reward.description || '');
      setRewardExpiryDays(reward.expiryDays || 30);
    } else {
      setEditingReward(null);
      setRewardName('');
      setRewardType('Discount');
      setRewardPointsCost(200);
      setRewardDiscountValue(200);
      setRewardDescription('');
      setRewardExpiryDays(30);
    }
    setShowRewardModal(true);
  };

  // Handle Rules Config Submit
  const handleRulesSubmit = async (e) => {
    e.preventDefault();
    await updateLoyaltyRules({
      pointsEarnedPer100Spent: Number(ptsPer100),
      pointValueInRupees: Number(ptValue),
      expiryMonths: Number(expiryMonths),
      maxPointsPerInvoice: Number(maxPtsPerInv)
    });
  };

  // One-click redemption handler
  const handleRedeem = async (rewardId) => {
    if (!selectedCustomerId) {
      addToast('Please select a customer to redeem points.', 'warning');
      return;
    }
    await redeemLoyaltyReward({
      customerId: selectedCustomerId,
      rewardId
    });
  };

  return (
    <div className="page-container animated-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Loyalty & Rewards Hub</h1>
            <span style={{ 
              background: 'var(--gold-bg)', 
              color: 'var(--gold-primary)', 
              border: '1px solid var(--gold-border)', 
              fontSize: '0.65rem', 
              fontWeight: '700', 
              padding: '0.2rem 0.5rem', 
              borderRadius: '12px' 
            }}>
              ANTI-FRAUD PROTECTED
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Track loyalty point balances, redeem rewards, configure earning rates, and enforce fraud prevention.
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
            <Gift size={14} /> Customer Rewards Portal
          </button>
          <button 
            onClick={() => setActiveTab('catalogue')} 
            style={{ 
              border: 'none', 
              background: activeTab === 'catalogue' ? 'var(--gold-primary)' : 'transparent', 
              color: activeTab === 'catalogue' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <Sparkles size={14} /> Rewards Catalogue
          </button>
          <button 
            onClick={() => setActiveTab('rules')} 
            style={{ 
              border: 'none', 
              background: activeTab === 'rules' ? 'var(--gold-primary)' : 'transparent', 
              color: activeTab === 'rules' ? '#000' : 'var(--text-secondary)', 
              fontSize: '0.78rem', 
              fontWeight: '600', 
              padding: '0.4rem 0.85rem', 
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
            <Settings size={14} /> Earning Rules & Anti-Fraud
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. CUSTOMER REWARDS PORTAL */}
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
                    {c.name} ({c.membershipLevel || 'Standard'} Member) • {c.loyaltyPoints || 0} pts
                  </option>
                ))}
              </select>
            </div>

            {loyaltySummary?.customer && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Phone: <strong>{loyaltySummary.customer.phone}</strong></span>
                <span>•</span>
                <span style={{ color: 'var(--gold-primary)', fontWeight: 'bold' }}>
                  {loyaltySummary.customer.membershipLevel || 'None'} Tier
                </span>
              </div>
            )}
          </div>

          {loyaltySummary ? (
            <div>
              {/* Balance Summary Header & Progress Bar */}
              <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(10, 15, 20, 0.95) 100%)', border: '1px solid var(--gold-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Loyalty Balance</span>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--gold-primary)', lineHeight: 1.1, marginTop: '0.2rem' }}>
                      {loyaltySummary.balance} <span style={{ fontSize: '1rem', fontWeight: '600' }}>PTS</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-green)' }}>≈ ₹{loyaltySummary.balance * (rulesConfig.pointValueInRupees || 1)} Wallet Value</span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Points Earned</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', marginTop: '0.2rem' }}>
                      +{loyaltySummary.totalEarned}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Cumulative Lifetime Earned</span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Points Redeemed</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gold-primary)', marginTop: '0.2rem' }}>
                      -{loyaltySummary.totalRedeemed}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Redeemed Rewards Value</span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Points Expired</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {loyaltySummary.totalExpired}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Expired out-of-date points</span>
                  </div>
                </div>

                {/* Progress Bar to Next Reward */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Award size={16} style={{ color: 'var(--gold-primary)' }} /> Progress to Next Reward Target: <strong>{loyaltySummary.nextReward?.name || 'VIP Voucher'}</strong>
                    </span>
                    <strong style={{ color: 'var(--gold-primary)' }}>
                      {loyaltySummary.balance} / {loyaltySummary.targetPoints} PTS ({loyaltySummary.progressPercent}%)
                    </strong>
                  </div>

                  <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${loyaltySummary.progressPercent}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, var(--gold-primary) 0%, #f1c40f 100%)',
                        borderRadius: '5px',
                        transition: 'var(--transition-smooth)'
                      }} 
                    />
                  </div>

                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                    {loyaltySummary.balance >= loyaltySummary.targetPoints 
                      ? '🎉 Target Reached! You have enough points to unlock this reward now!'
                      : `Earn ${loyaltySummary.targetPoints - loyaltySummary.balance} more points to unlock "${loyaltySummary.nextReward?.name}".`
                    }
                  </p>
                </div>
              </div>

              {/* Available Rewards Catalogue for Redemption */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>Available Rewards Catalogue</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click "Redeem Reward" to claim instantly</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                  {rewardsList.map(rwd => {
                    const canAfford = loyaltySummary.balance >= rwd.pointsCost;

                    return (
                      <div key={rwd._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', position: 'relative', border: canAfford ? '1px solid var(--gold-border)' : '1px solid var(--border-light)' }}>
                        <span style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          background: rwd.type === 'Discount' ? 'rgba(46, 204, 113, 0.15)' : rwd.type === 'Free Service' ? 'rgba(54, 162, 235, 0.15)' : 'rgba(241, 196, 15, 0.15)',
                          color: rwd.type === 'Discount' ? 'var(--accent-green)' : rwd.type === 'Free Service' ? '#3498db' : 'var(--gold-primary)',
                          border: '1px solid var(--border-light)'
                        }}>
                          {rwd.type}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <Gift size={20} style={{ color: 'var(--gold-primary)' }} />
                          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '600' }}>{rwd.name}</h4>
                        </div>

                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', minHeight: '36px' }}>
                          {rwd.description}
                        </p>

                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                          <div>
                            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--gold-primary)' }}>{rwd.pointsCost}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}> PTS</span>
                          </div>

                          <button
                            disabled={!canAfford}
                            onClick={() => handleRedeem(rwd._id)}
                            className={canAfford ? "gold-btn" : "outline-btn"}
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.72rem',
                              opacity: canAfford ? 1 : 0.4,
                              cursor: canAfford ? 'pointer' : 'not-allowed'
                            }}
                          >
                            {canAfford ? 'Redeem Reward' : 'Insufficient Pts'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Loyalty History Ledger */}
              <div className="glass-card">
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '600' }}>Loyalty Transaction Audit Ledger</h4>
                </div>

                <div className="table-responsive">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Date / Time</th>
                        <th>Type</th>
                        <th>Points +/-</th>
                        <th>Balance After</th>
                        <th>Description / Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loyaltySummary.transactions.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                            No loyalty point transactions recorded for this customer yet.
                          </td>
                        </tr>
                      ) : (
                        loyaltySummary.transactions.map(tx => (
                          <tr key={tx._id}>
                            <td>{new Date(tx.date || tx.createdAt).toLocaleDateString()}</td>
                            <td>
                              <span style={{
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 'bold',
                                background: tx.type === 'Earned' ? 'rgba(46, 204, 113, 0.15)' : tx.type === 'Redeemed' ? 'rgba(241, 196, 15, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                                color: tx.type === 'Earned' ? 'var(--accent-green)' : tx.type === 'Redeemed' ? 'var(--gold-primary)' : 'var(--accent-red)'
                              }}>
                                {tx.type}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: tx.points > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                {tx.points > 0 ? `+${tx.points}` : tx.points} PTS
                              </strong>
                            </td>
                            <td><strong>{tx.balanceAfter} PTS</strong></td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {tx.description}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Please select a customer to view their loyalty rewards portal.</p>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. REWARDS CATALOGUE MANAGEMENT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'catalogue' && (
        <div>
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>Loyalty Rewards Catalogue</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure available reward options (Discounts, Free Services, Products, Upgrades, Special Offers).</p>
            </div>
            {hasPermission(PERMISSIONS.STAFF_MANAGE) && (
              <button onClick={() => openRewardModal(null)} className="gold-btn" style={{ padding: '0.5rem 1.1rem' }}>
                <Plus size={16} /> Add New Reward Option
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {rewardsList.map(rwd => (
              <div key={rwd._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>{rwd.name}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', fontWeight: '600' }}>{rwd.type} Reward</span>
                  </div>
                  {hasPermission(PERMISSIONS.STAFF_MANAGE) && (
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button onClick={() => openRewardModal(rwd)} className="outline-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}>
                        Edit
                      </button>
                      <button onClick={() => deleteLoyaltyReward(rwd._id)} className="outline-btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {rwd.description}
                </p>

                <div style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <div>Points Cost: <strong style={{ color: 'var(--gold-primary)' }}>{rwd.pointsCost} PTS</strong></div>
                  <div>Value: <strong>₹{rwd.discountValue || 0}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. EARNING RULES & ANTI-FRAUD SETTINGS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'rules' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Rules Configuration Form */}
          <div className="glass-card">
            <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>Points Earning & Redemption Rules</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure loyalty points accumulation multipliers and limits.</p>
            </div>

            <form onSubmit={handleRulesSubmit}>
              <div className="form-group">
                <label>Points Earned per ₹100 Spent *</label>
                <input 
                  type="number" 
                  required 
                  className="form-control" 
                  value={ptsPer100} 
                  onChange={(e) => setPtsPer100(e.target.value)} 
                />
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Example: 10 points = Customer receives 10 pts for every ₹100 billed on invoices.
                </p>
              </div>

              <div className="form-group">
                <label>Point Monetary Value (1 Point = ₹ Value) *</label>
                <input 
                  type="number" 
                  step="0.1" 
                  required 
                  className="form-control" 
                  value={ptValue} 
                  onChange={(e) => setPtValue(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Points Expiry Period (Months) *</label>
                <input 
                  type="number" 
                  required 
                  className="form-control" 
                  value={expiryMonths} 
                  onChange={(e) => setExpiryMonths(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Max Loyalty Points Allowed per Invoice *</label>
                <input 
                  type="number" 
                  required 
                  className="form-control" 
                  value={maxPtsPerInv} 
                  onChange={(e) => setMaxPtsPerInv(e.target.value)} 
                />
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
                Save Loyalty Rules
              </button>
            </form>
          </div>

          {/* Anti-Fraud & Security Audit Banner */}
          <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(20,30,40,0.9) 0%, rgba(10,15,20,0.95) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Shield size={22} style={{ color: 'var(--gold-primary)' }} />
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>Anti-Fraud & Duplicate Prevention</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.85rem', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--gold-primary)', display: 'block', marginBottom: '0.2rem' }}>🔒 Idempotency Key Lock</strong>
                Every invoice transaction generates a unique hash key (e.g. `invoice_inv_123_earn`). Duplicate server calls or double clicks will never credit points twice.
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.85rem', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--gold-primary)', display: 'block', marginBottom: '0.2rem' }}>🛡️ Strict Non-Negative Balance Verification</strong>
                Server-side balance validation ensures a customer can never redeem more points than their actual balance.
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.85rem', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--gold-primary)', display: 'block', marginBottom: '0.2rem' }}>📜 Full Audit Ledger History</strong>
                Every point transaction (Earned, Redeemed, Expired, Manual) is timestamped and immutably logged with invoice references.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ADD / EDIT REWARD MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showRewardModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowRewardModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>{editingReward ? 'Edit Reward Option' : 'Create Loyalty Reward Option'}</h3>
              <button onClick={() => setShowRewardModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleRewardSubmit}>
              <div className="form-group">
                <label>Reward Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. ₹200 Instant Bill Voucher" 
                  className="form-control" 
                  value={rewardName} 
                  onChange={(e) => setRewardName(e.target.value)} 
                />
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Reward Category *</label>
                  <select value={rewardType} onChange={(e) => setRewardType(e.target.value)} className="form-control">
                    <option value="Discount">Discount</option>
                    <option value="Free Service">Free Service</option>
                    <option value="Product">Product</option>
                    <option value="Upgrade">Upgrade</option>
                    <option value="Special Offer">Special Offer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Points Cost *</label>
                  <input type="number" required placeholder="200" className="form-control" value={rewardPointsCost} onChange={(e) => setRewardPointsCost(e.target.value)} />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Discount Value (₹)</label>
                  <input type="number" placeholder="200" className="form-control" value={rewardDiscountValue} onChange={(e) => setRewardDiscountValue(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Valid Days After Redemption</label>
                  <input type="number" placeholder="30" className="form-control" value={rewardExpiryDays} onChange={(e) => setRewardExpiryDays(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label>Reward Description</label>
                <textarea rows="3" placeholder="Explain details & redemption instructions..." className="form-control" value={rewardDescription} onChange={(e) => setRewardDescription(e.target.value)} />
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
                {editingReward ? 'Update Reward Option' : 'Save Reward Option'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Loyalty;
