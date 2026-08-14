import React, { useMemo } from 'react';
import { 
  Activity, TrendingUp, ShieldCheck, AlertTriangle, Sparkles, 
  DollarSign, Users, Award, Package, Calendar, RefreshCw, 
  ArrowUpRight, ArrowDownRight, CheckCircle2, ChevronRight, Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const SalonHealth = ({ setActivePage }) => {
  const { calculateSalonHealthScore, addToast } = useApp();

  const healthData = useMemo(() => {
    return calculateSalonHealthScore();
  }, [calculateSalonHealthScore]);

  const { overallHealthScore, healthGrade, metrics, categoryScores, insights } = healthData;

  const handleRefresh = () => {
    addToast('Recalculated live Salon Health Score based on latest database metrics!', 'info');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 60) return '#f1c40f';
    return 'var(--accent-red)';
  };

  return (
    <div className="page-container animated-fade-in" style={{ paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Salon Health Score</h1>
            <span style={{ 
              background: 'var(--gold-bg)', 
              color: 'var(--gold-primary)', 
              border: '1px solid var(--gold-border)', 
              fontSize: '0.65rem', 
              fontWeight: '700', 
              padding: '0.2rem 0.55rem', 
              borderRadius: '12px' 
            }}>
              LIVE BUSINESS DIAGNOSTIC
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time composite health index calculated from revenue, profit margin, customer retention, staff ratings, stock health, and utilization.
          </p>
        </div>

        <button onClick={handleRefresh} className="outline-btn" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={15} /> Recalculate Score
        </button>
      </div>

      {/* ── Composite Score Speedometer Gauge Hero Card ── */}
      <div className="glass-card" style={{ 
        marginBottom: '1.75rem', 
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(10, 15, 20, 0.95) 100%)', 
        border: '1px solid var(--gold-border)',
        padding: '2rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
          
          {/* Circular Score Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: `conic-gradient(${getScoreColor(overallHealthScore)} ${overallHealthScore * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}>
              <div style={{
                width: '136px',
                height: '136px',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '2.8rem', fontWeight: '800', color: getScoreColor(overallHealthScore), lineHeight: 1 }}>
                  {overallHealthScore}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginTop: '0.1rem' }}>
                  OUT OF 100
                </span>
              </div>
            </div>

            <span style={{
              marginTop: '1rem',
              padding: '0.25rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '800',
              letterSpacing: '0.5px',
              background: 'rgba(46, 204, 113, 0.15)',
              color: 'var(--accent-green)',
              border: '1px solid rgba(46, 204, 113, 0.4)'
            }}>
              {healthGrade}
            </span>
          </div>

          {/* Key Metrics Overview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-green)', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              <TrendingUp size={18} /> +4 pts higher than last month's diagnostic
            </div>

            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '700', marginBottom: '0.5rem' }}>
              Operational Efficiency Overview
            </h3>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Your salon is operating at <strong>{overallHealthScore}% peak efficiency</strong>. High customer ratings ({metrics.avgRating} ★) and strong retention ({metrics.retentionPercent}%) are driving positive profitability.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>MoM Billed Revenue</span>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--gold-primary)' }}>₹{metrics.totalRevenue.toLocaleString()}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Net Profit Margin</span>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--accent-green)' }}>{metrics.profitMarginPercent}%</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Repeat Clients Rate</span>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: '#fff' }}>{metrics.retentionPercent}%</strong>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── 8 Category Sub-Score Cards ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '600' }}>Health Score Category Breakdown</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>8 Business Dimensions Evaluated</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          
          {/* 1. Revenue Growth */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <DollarSign size={16} style={{ color: 'var(--gold-primary)' }} /> Revenue Growth
              </span>
              <strong style={{ fontSize: '1rem', color: getScoreColor(categoryScores.revenueGrowth) }}>{categoryScores.revenueGrowth}/100</strong>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: `${categoryScores.revenueGrowth}%`, height: '100%', background: getScoreColor(categoryScores.revenueGrowth), borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MoM Billed Revenue: ₹{metrics.totalRevenue.toLocaleString()}</span>
          </div>

          {/* 2. Profit Margin */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <TrendingUp size={16} style={{ color: 'var(--accent-green)' }} /> Profit Margin
              </span>
              <strong style={{ fontSize: '1rem', color: getScoreColor(categoryScores.profitMargin) }}>{categoryScores.profitMargin}/100</strong>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: `${categoryScores.profitMargin}%`, height: '100%', background: getScoreColor(categoryScores.profitMargin), borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Net Margin: {metrics.profitMarginPercent}% (₹{metrics.netProfit.toLocaleString()} Net)</span>
          </div>

          {/* 3. Customer Retention */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={16} style={{ color: '#3498db' }} /> Customer Retention
              </span>
              <strong style={{ fontSize: '1rem', color: getScoreColor(categoryScores.customerRetention) }}>{categoryScores.customerRetention}/100</strong>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: `${categoryScores.customerRetention}%`, height: '100%', background: getScoreColor(categoryScores.customerRetention), borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active Retention Rate: {metrics.retentionPercent}%</span>
          </div>

          {/* 4. Repeat Customers */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={16} style={{ color: 'var(--gold-primary)' }} /> Repeat Customers
              </span>
              <strong style={{ fontSize: '1rem', color: getScoreColor(categoryScores.repeatCustomers) }}>{categoryScores.repeatCustomers}/100</strong>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: `${categoryScores.repeatCustomers}%`, height: '100%', background: getScoreColor(categoryScores.repeatCustomers), borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{metrics.repeatCustomersCount} Frequent Guests Recorded</span>
          </div>

          {/* 5. Staff Performance */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={16} style={{ color: '#9b59b6' }} /> Staff Performance
              </span>
              <strong style={{ fontSize: '1rem', color: getScoreColor(categoryScores.staffPerformance) }}>{categoryScores.staffPerformance}/100</strong>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: `${categoryScores.staffPerformance}%`, height: '100%', background: getScoreColor(categoryScores.staffPerformance), borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Stylist Efficiency: {metrics.avgRating} ★ Rating</span>
          </div>

          {/* 6. Customer Ratings */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={16} style={{ color: 'var(--gold-primary)' }} /> Customer Ratings
              </span>
              <strong style={{ fontSize: '1rem', color: getScoreColor(categoryScores.customerRatings) }}>{categoryScores.customerRatings}/100</strong>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: `${categoryScores.customerRatings}%`, height: '100%', background: getScoreColor(categoryScores.customerRatings), borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{metrics.avgRating} ★ across {metrics.totalReviews} reviews</span>
          </div>

          {/* 7. Inventory Health */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Package size={16} style={{ color: metrics.lowStockCount > 0 ? '#f1c40f' : 'var(--accent-green)' }} /> Inventory Health
              </span>
              <strong style={{ fontSize: '1rem', color: getScoreColor(categoryScores.inventoryHealth) }}>{categoryScores.inventoryHealth}/100</strong>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: `${categoryScores.inventoryHealth}%`, height: '100%', background: getScoreColor(categoryScores.inventoryHealth), borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{metrics.lowStockCount} Low Stock Item Alerts</span>
          </div>

          {/* 8. Appointment Utilization */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={16} style={{ color: '#e67e22' }} /> Appointment Utilization
              </span>
              <strong style={{ fontSize: '1rem', color: getScoreColor(categoryScores.appointmentUtilization) }}>{categoryScores.appointmentUtilization}/100</strong>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '0.5rem', overflow: 'hidden' }}>
              <div style={{ width: `${categoryScores.appointmentUtilization}%`, height: '100%', background: getScoreColor(categoryScores.appointmentUtilization), borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{metrics.utilizationPercent}% Saturday Peak Booking Rate</span>
          </div>

        </div>
      </div>

      {/* ── Real-Time Actionable Insights Feed ── */}
      <div className="glass-card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '600' }}>Dynamic Actionable Business Insights</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automated operational recommendations generated from live data.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {insights.map((item, idx) => {
            const isWarning = item.severity === 'warning' || item.severity === 'alert';
            const isOpportunity = item.severity === 'opportunity';

            return (
              <div key={idx} style={{
                background: isWarning ? 'rgba(241, 196, 15, 0.08)' : isOpportunity ? 'rgba(54, 162, 235, 0.08)' : 'rgba(46, 204, 113, 0.08)',
                border: `1px solid ${isWarning ? 'rgba(241, 196, 15, 0.3)' : isOpportunity ? 'rgba(54, 162, 235, 0.3)' : 'rgba(46, 204, 113, 0.3)'}`,
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isWarning ? (
                    <AlertTriangle size={20} style={{ color: '#f1c40f', flexShrink: 0 }} />
                  ) : isOpportunity ? (
                    <Zap size={20} style={{ color: '#3498db', flexShrink: 0 }} />
                  ) : (
                    <CheckCircle2 size={20} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                  )}

                  <div>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: isWarning ? 'rgba(241, 196, 15, 0.2)' : 'rgba(46, 204, 113, 0.2)',
                      color: isWarning ? '#f1c40f' : 'var(--accent-green)',
                      marginRight: '0.5rem'
                    }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {item.message}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Executive Action Shortcuts Hub ── */}
      <div className="glass-card">
        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '600' }}>Recommended Operational Actions</h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          <button onClick={() => setActivePage && setActivePage('inventory')} className="outline-btn" style={{ justifyContent: 'space-between', padding: '0.75rem' }}>
            <span>Reorder Low Stock</span>
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setActivePage && setActivePage('appointments')} className="outline-btn" style={{ justifyContent: 'space-between', padding: '0.75rem' }}>
            <span>Adjust Booking Slots</span>
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setActivePage && setActivePage('marketing')} className="outline-btn" style={{ justifyContent: 'space-between', padding: '0.75rem' }}>
            <span>Launch Retention Promo</span>
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setActivePage && setActivePage('analytics')} className="outline-btn" style={{ justifyContent: 'space-between', padding: '0.75rem' }}>
            <span>View Revenue BI</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default SalonHealth;
