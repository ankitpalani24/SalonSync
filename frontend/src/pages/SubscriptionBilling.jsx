import React, { useState, useMemo } from 'react';
import { 
  Sparkles, CheckCircle2, Lock, ArrowUpRight, ShieldCheck, Zap, 
  Building2, Users, Calendar, Crown, Clock, AlertTriangle, X, Check, FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PLANS, PLAN_LIMITS, FEATURE_CATALOG, hasPlanFeature } from '../config/subscriptions';

const SubscriptionBilling = () => {
  const { db, updateSalonSubscription, addToast, currentUser } = useApp();

  const sub = db.subscription || {
    plan: 'PROFESSIONAL',
    status: 'Active',
    billingCycle: 'Monthly',
    renewalDate: '2026-12-31',
    gracePeriodDays: 7
  };

  const currentPlan = sub.plan || 'PROFESSIONAL';
  const currentPlanInfo = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.PROFESSIONAL;

  // Usage Counts
  const branchesCount = (db.branches || []).length;
  const staffCount = (db.staff || []).length;
  const appointmentsCount = (db.appointments || []).length;

  // Selected Plan for Upgrade Modal
  const [targetUpgradePlan, setTargetUpgradePlan] = useState(null);

  // Group Features by Category
  const featureCategories = useMemo(() => {
    const groups = {};
    FEATURE_CATALOG.forEach(f => {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    });
    return Object.entries(groups).map(([category, items]) => ({ category, items }));
  }, []);

  const handleSimulateUpgrade = async (planKey) => {
    await updateSalonSubscription(planKey);
    setTargetUpgradePlan(null);
  };

  return (
    <div className="page-container animated-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>SaaS Subscription & Feature Access</h1>
            <span style={{ 
              background: sub.status === 'Active' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(241, 196, 15, 0.15)', 
              color: sub.status === 'Active' ? 'var(--accent-green)' : '#f1c40f', 
              border: `1px solid ${sub.status === 'Active' ? 'rgba(46, 204, 113, 0.3)' : 'rgba(241, 196, 15, 0.3)'}`, 
              fontSize: '0.65rem', 
              fontWeight: '700', 
              padding: '0.2rem 0.55rem', 
              borderRadius: '12px' 
            }}>
              ● STATUS: {sub.status.toUpperCase()}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Centralized SaaS plan tier management, feature access matrix, plan limits, and grace period licensing.
          </p>
        </div>
      </div>

      {/* ── CURRENT SUBSCRIPTION BANNER CARD ── */}
      <div className="glass-card" style={{ 
        marginBottom: '1.75rem', 
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(10, 15, 20, 0.95) 100%)', 
        border: '1px solid var(--gold-border)',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ACTIVE SAAS LICENSING TIER
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0.2rem 0' }}>
              {currentPlanInfo.name} Plan
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '540px' }}>
              {currentPlanInfo.description}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>RENEWAL DATE</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{new Date(sub.renewalDate).toLocaleDateString([], { dateStyle: 'medium' })}</strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)', display: 'block', marginTop: '0.2rem' }}>
              ✓ 7-Day Grace Period Protection Active
            </span>
          </div>
        </div>
      </div>

      {/* ── 3 PLAN USAGE LIMIT METERS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        
        {/* Branch Limit */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Branch Locations</span>
            <strong style={{ fontSize: '0.85rem', color: 'var(--gold-primary)' }}>{branchesCount} / {currentPlanInfo.maxBranches}</strong>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((branchesCount / currentPlanInfo.maxBranches) * 100, 100)}%`, height: '100%', background: 'var(--gold-primary)' }} />
          </div>
        </div>

        {/* Staff Limit */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Staff Workforce Accounts</span>
            <strong style={{ fontSize: '0.85rem', color: '#3498db' }}>{staffCount} / {currentPlanInfo.maxStaff}</strong>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((staffCount / currentPlanInfo.maxStaff) * 100, 100)}%`, height: '100%', background: '#3498db' }} />
          </div>
        </div>

        {/* Appointments Limit */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Monthly Appointment Capacity</span>
            <strong style={{ fontSize: '0.85rem', color: 'var(--accent-green)' }}>{appointmentsCount} / {currentPlanInfo.maxAppointmentsPerMonth.toLocaleString()}</strong>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((appointmentsCount / currentPlanInfo.maxAppointmentsPerMonth) * 100, 100)}%`, height: '100%', background: 'var(--accent-green)' }} />
          </div>
        </div>

      </div>

      {/* ── CENTRAL FEATURE MATRIX COMPARISON GRID ── */}
      <div className="glass-card">
        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '700' }}>SaaS Plan Feature Matrix</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Centralized feature access matrix across STARTER, PROFESSIONAL, and ENTERPRISE tiers.</p>
        </div>

        <div className="table-responsive">
          <table className="premium-table" style={{ fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Feature Capability</th>
                <th style={{ textAlign: 'center', width: '20%' }}>
                  STARTER
                  <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>₹1,999 / mo</span>
                </th>
                <th style={{ textAlign: 'center', width: '20%' }}>
                  PROFESSIONAL
                  <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--gold-primary)', fontWeight: 'normal' }}>₹4,999 / mo</span>
                </th>
                <th style={{ textAlign: 'center', width: '20%' }}>
                  ENTERPRISE
                  <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--accent-green)', fontWeight: 'normal' }}>₹9,999 / mo</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {featureCategories.map(({ category, items }) => (
                <React.Fragment key={category}>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <td colSpan="4" style={{ fontWeight: '800', color: 'var(--gold-primary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {category}
                    </td>
                  </tr>

                  {items.map(f => (
                    <tr key={f.key}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                        {f.name}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {f.starter ? (
                          <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>✓</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>🔒</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {f.pro ? (
                          <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>✓</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>🔒</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {f.enterprise ? (
                          <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>✓</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>🔒</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* Action Buttons Row */}
              <tr>
                <td style={{ fontWeight: 'bold' }}>Select / Upgrade Plan</td>
                {['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map(planKey => (
                  <td key={planKey} style={{ textAlign: 'center' }}>
                    {currentPlan === planKey ? (
                      <button disabled className="outline-btn" style={{ opacity: 0.6, fontSize: '0.72rem', padding: '0.3rem 0.6rem', width: '100%', justifyContent: 'center' }}>
                        Current Plan
                      </button>
                    ) : (
                      <button onClick={() => setTargetUpgradePlan(planKey)} className="gold-btn" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', width: '100%', justifyContent: 'center' }}>
                        Upgrade Plan
                      </button>
                    )}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* ── INTERACTIVE UPGRADE CONFIRMATION MODAL ── */}
      {targetUpgradePlan && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setTargetUpgradePlan(null); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.15rem' }}>Upgrade to {targetUpgradePlan} Plan</h3>
              <button onClick={() => setTargetUpgradePlan(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Upgrading your salon to the <strong>{targetUpgradePlan} Plan</strong> will instantly unlock all higher-tier SaaS capabilities and expand your branch and staff capacity limits.
            </p>

            <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid var(--gold-border)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--gold-primary)', fontWeight: '700', marginBottom: '0.5rem' }}>
                Included Capabilities in {targetUpgradePlan}:
              </h4>
              <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                {FEATURE_CATALOG.filter(f => f[targetUpgradePlan.toLowerCase()]).map(f => (
                  <li key={f.key}>{f.name}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setTargetUpgradePlan(null)} className="outline-btn" style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
              <button onClick={() => handleSimulateUpgrade(targetUpgradePlan)} className="gold-btn" style={{ flex: 1, justifyContent: 'center' }}>
                Confirm Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SubscriptionBilling;
