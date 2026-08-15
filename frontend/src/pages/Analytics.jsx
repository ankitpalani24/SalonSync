import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Award,
  Shield, Scissors, Clock, Download, FileSpreadsheet, FileText,
  Building2, Package, Sparkles, RefreshCw, Calendar, ArrowUpRight,
  ArrowDownRight, PieChart, Activity, ShoppingBag, CheckCircle2, ChevronRight, Calculator,
  Filter, Layers, Bookmark, AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';

// Helper for live material & commission calculation
const calculateServiceProfitability = (price, cost, commissionPct = 10, taxPct = 18, discountAmt = 0, allocatedCostPct = 5) => {
  const p = Number(price) || 0;
  const c = Number(cost) || 0;
  const commPct = Number(commissionPct) || 0;
  const taxP = Number(taxPct) || 0;
  const disc = Number(discountAmt) || 0;
  const allocPct = Number(allocatedCostPct) || 0;

  const taxAmount = (p * taxP) / 100;
  const customerPayment = Math.max(0, p - disc + taxAmount);
  const staffCommission = (p * commPct) / 100;
  const productCost = c;
  const allocatedCosts = (p * allocPct) / 100;

  const actualProfit = customerPayment - staffCommission - productCost - allocatedCosts;
  const profitMargin = customerPayment > 0 ? (actualProfit / customerPayment) * 100 : 0;

  return {
    customerPayment: Math.round(customerPayment),
    staffCommission: Math.round(staffCommission),
    productCost: Math.round(productCost),
    allocatedCosts: Math.round(allocatedCosts),
    actualProfit: Math.round(actualProfit),
    profitMargin: Math.round(profitMargin * 10) / 10
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// PEAK HOURS BAR CHART COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const PeakHoursChart = ({ hourlyData }) => {
  const hours = ['10 AM', '11 AM', '12 PM', '01 PM', '02 PM', '03 PM', '04 PM', '05 PM', '06 PM', '07 PM', '08 PM'];
  const maxVal = Math.max(...hours.map(h => hourlyData[h] || 0), 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '140px', paddingTop: '1rem' }}>
        {hours.map((h) => {
          const val = hourlyData[h] || 0;
          const heightPct = Math.max((val / maxVal) * 100, 6);
          const isPeak = val === maxVal && val > 0;

          return (
            <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.65rem', color: isPeak ? 'var(--gold-primary)' : 'var(--text-muted)', fontWeight: '700', marginBottom: '0.25rem' }}>
                {val}
              </span>
              <div style={{
                width: '100%',
                height: `${heightPct}%`,
                background: isPeak
                  ? 'linear-gradient(180deg, var(--gold-primary) 0%, #b38f20 100%)'
                  : 'rgba(255,255,255,0.08)',
                borderRadius: '4px 4px 0 0',
                transition: 'var(--transition-smooth)',
                boxShadow: isPeak ? '0 0 12px var(--gold-glow)' : 'none'
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.4rem' }}>
        {hours.map(h => (
          <span key={h} style={{ flex: 1, textAlign: 'center', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            {h.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FINANCIAL ANALYTICS & BUSINESS INTELLIGENCE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const Analytics = () => {
  const { tenantFilter, db, fetchFinancialAnalytics, addToast } = useApp();
  const reportRef = useRef(null);

  // Time Horizon: 'TODAY' (Daily), 'WEEK' (Weekly), 'MONTH' (Monthly), 'LAST_MONTH', 'YEAR' (Yearly), 'CUSTOM', 'ALL'
  const [dateHorizon, setDateHorizon] = useState('MONTH');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('ALL');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [backendAnalyticsData, setBackendAnalyticsData] = useState(null);
  const [loadingBackend, setLoadingBackend] = useState(false);

  const rawInvoices = tenantFilter(db.invoices || []);
  const rawExpenses = tenantFilter(db.expenses || []);
  const rawCustomers = tenantFilter(db.customers || []);
  const services = tenantFilter(db.services || []);
  const staff = tenantFilter(db.staff || []);
  const branches = tenantFilter(db.branches || []);
  const products = tenantFilter(db.products || []);

  // Fetch backend-calculated financial analytics whenever horizon or branch changes
  useEffect(() => {
    let isMounted = true;
    const loadAnalytics = async () => {
      setLoadingBackend(true);
      const bId = selectedBranchId !== 'ALL' ? selectedBranchId : null;
      const res = await fetchFinancialAnalytics(dateHorizon.toLowerCase(), bId, customStartDate, customEndDate);
      if (isMounted && res) {
        setBackendAnalyticsData(res);
      }
      if (isMounted) setLoadingBackend(false);
    };
    loadAnalytics();
    return () => { isMounted = false; };
  }, [dateHorizon, selectedBranchId, customStartDate, customEndDate, fetchFinancialAnalytics]);

  // ────────────────────────────────────────────────────────────────────────────
  // CLIENT-SIDE BUSINESS LOGIC ENGINE (FALLBACK / PARALLEL CALCULATION)
  // ────────────────────────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (dateHorizon === 'TODAY') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateHorizon === 'WEEK') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date();
    } else if (dateHorizon === 'MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date();
    } else if (dateHorizon === 'LAST_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (dateHorizon === 'YEAR') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date();
    } else if (dateHorizon === 'CUSTOM' && customStartDate) {
      startDate = new Date(customStartDate + 'T00:00:00.000Z');
      endDate = customEndDate ? new Date(customEndDate + 'T23:59:59.999Z') : new Date();
    }

    const matchesDate = (dateStr) => {
      if (!startDate || !dateStr) return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    };

    const matchesBranch = (bId) => {
      if (selectedBranchId === 'ALL') return true;
      const bid = typeof bId === 'object' ? bId?._id : bId;
      return String(bid) === String(selectedBranchId);
    };

    const invoices = rawInvoices.filter(i => matchesDate(i.createdAt || i.date) && matchesBranch(i.branchId));
    const expenses = rawExpenses.filter(e => matchesDate(e.date || e.createdAt) && matchesBranch(e.branchId));
    const customers = rawCustomers.filter(c => matchesDate(c.createdAt));

    return { invoices, expenses, customers };
  }, [dateHorizon, customStartDate, customEndDate, selectedBranchId, rawInvoices, rawExpenses, rawCustomers]);

  const { invoices, expenses, customers } = filteredData;

  // 1. Core Financial Calculations: Revenue - Discounts - Refunds - Product Costs - Staff Commissions - Operating Expenses = Net Profit
  const financialMetrics = useMemo(() => {
    if (backendAnalyticsData && backendAnalyticsData.metrics) {
      return backendAnalyticsData.metrics;
    }

    let grossRevenue = 0;
    let discounts = 0;
    let refunds = 0;

    invoices.forEach(inv => {
      if (inv.paymentStatus === 'Refunded' || inv.status === 'Cancelled') {
        refunds += Number(inv.finalAmount) || 0;
        return;
      }
      let invGross = 0;
      (inv.services || []).forEach(s => { invGross += (Number(s.price) || 0) * (Number(s.quantity) || 1); });
      (inv.products || []).forEach(p => { invGross += (Number(p.price) || 0) * (Number(p.quantity) || 1); });

      grossRevenue += (invGross || Number(inv.finalAmount) || 0);
      discounts += (Number(inv.discount) || 0);
    });

    const netRevenue = Math.max(0, grossRevenue - discounts - refunds);

    let productCosts = 0;
    invoices.forEach(inv => {
      if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled') {
        (inv.services || []).forEach(item => {
          const srv = services.find(s => String(s._id) === String(item.serviceId) || s.name === item.name);
          if (srv) productCosts += (Number(srv.materialCost) || 0) * (Number(item.quantity) || 1);
        });
        (inv.products || []).forEach(item => {
          const prod = products.find(p => String(p._id) === String(item.productId) || p.name === item.name);
          if (prod) productCosts += (Number(prod.purchasePrice) || 0) * (Number(item.quantity) || 1);
        });
      }
    });

    let staffCommissions = 0;
    invoices.forEach(inv => {
      if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled') {
        const sid = typeof inv.staffId === 'object' ? inv.staffId?._id : inv.staffId;
        const stMember = staff.find(s => String(s._id) === String(sid));
        const commPct = stMember ? (Number(stMember.commissionPercentage) || 10) : 10;
        staffCommissions += ((Number(inv.finalAmount) || 0) * commPct) / 100;
      }
    });
    staffCommissions = Math.round(staffCommissions);

    const operatingExpenses = Math.round(expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));
    const grossProfit = Math.round(netRevenue - productCosts - staffCommissions);
    const netProfit = Math.round(grossProfit - operatingExpenses);
    const profitMargin = netRevenue > 0 ? Math.round((netProfit / netRevenue) * 1000) / 10 : 0;

    return {
      grossRevenue: Math.round(grossRevenue),
      discounts: Math.round(discounts),
      refunds: Math.round(refunds),
      netRevenue: Math.round(netRevenue),
      productCosts: Math.round(productCosts),
      staffCommissions,
      grossProfit,
      operatingExpenses,
      netProfit,
      profitMargin
    };
  }, [backendAnalyticsData, invoices, expenses, services, products, staff]);

  // 2. Expense Category Breakdown
  const expenseBreakdown = useMemo(() => {
    if (backendAnalyticsData && backendAnalyticsData.expenseBreakdown) {
      return backendAnalyticsData.expenseBreakdown;
    }
    const map = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });
    return map;
  }, [backendAnalyticsData, expenses]);

  // 3. Service Profitability Report
  const serviceProfitability = useMemo(() => {
    if (backendAnalyticsData && backendAnalyticsData.serviceProfitability) {
      return backendAnalyticsData.serviceProfitability;
    }

    const reportMap = {};
    services.forEach(srv => {
      reportMap[String(srv._id)] = {
        id: srv._id,
        name: srv.name,
        category: srv.category,
        volume: 0,
        revenue: 0,
        productCost: 0,
        staffCommission: 0,
        netProfit: 0
      };
    });

    invoices.forEach(inv => {
      if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled') {
        const sid = typeof inv.staffId === 'object' ? inv.staffId?._id : inv.staffId;
        const stMember = staff.find(s => String(s._id) === String(sid));
        const commPct = stMember ? (Number(stMember.commissionPercentage) || 10) : 10;

        (inv.services || []).forEach(item => {
          const sId = String(item.serviceId);
          if (reportMap[sId]) {
            const qty = Number(item.quantity) || 1;
            const rev = (Number(item.price) || 0) * qty;
            const srv = services.find(s => String(s._id) === sId);
            const cost = (Number(srv?.materialCost) || 0) * qty;
            const comm = (rev * commPct) / 100;

            reportMap[sId].volume += qty;
            reportMap[sId].revenue += rev;
            reportMap[sId].productCost += cost;
            reportMap[sId].staffCommission += comm;
            reportMap[sId].netProfit += (rev - cost - comm);
          }
        });
      }
    });

    return Object.values(reportMap).sort((a, b) => b.revenue - a.revenue);
  }, [backendAnalyticsData, services, invoices, staff]);

  // 4. Staff Revenue & Performance Matrix
  const staffRevenue = useMemo(() => {
    if (backendAnalyticsData && backendAnalyticsData.staffRevenue) {
      return backendAnalyticsData.staffRevenue;
    }

    const map = {};
    staff.forEach(s => {
      map[String(s._id)] = {
        id: s._id,
        name: s.name,
        role: s.role,
        revenue: 0,
        commission: 0,
        count: 0
      };
    });

    invoices.forEach(inv => {
      if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled') {
        const sid = String(typeof inv.staffId === 'object' ? inv.staffId?._id : inv.staffId);
        if (map[sid]) {
          map[sid].count += 1;
          map[sid].revenue += Number(inv.finalAmount) || 0;
          const commPct = staff.find(s => String(s._id) === sid)?.commissionPercentage || 10;
          map[sid].commission += ((Number(inv.finalAmount) || 0) * commPct) / 100;
        }
      }
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [backendAnalyticsData, staff, invoices]);

  // 5. Branch Profitability Comparison Matrix
  const branchProfitability = useMemo(() => {
    if (backendAnalyticsData && backendAnalyticsData.branchProfitability) {
      return backendAnalyticsData.branchProfitability;
    }

    return branches.map(br => {
      const bInvoices = rawInvoices.filter(i => String(typeof i.branchId === 'object' ? i.branchId?._id : i.branchId) === String(br._id));
      const bExpenses = rawExpenses.filter(e => String(typeof e.branchId === 'object' ? e.branchId?._id : e.branchId) === String(br._id));

      const bRev = bInvoices.reduce((sum, i) => sum + (Number(i.finalAmount) || 0), 0);
      const bExp = bExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const bProfit = Math.max(0, bRev - bExp);
      const bAov = bInvoices.length > 0 ? Math.round(bRev / bInvoices.length) : 0;

      return {
        id: br._id,
        name: br.name,
        city: br.city || 'Branch',
        revenue: bRev,
        expenses: bExp,
        profit: bProfit,
        checkoutCount: bInvoices.length,
        averageBill: bAov
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [backendAnalyticsData, branches, rawInvoices, rawExpenses]);

  // Peak Hours calculation
  const hourlyData = useMemo(() => {
    const data = {
      '10 AM': 0, '11 AM': 0, '12 PM': 0, '01 PM': 0, '02 PM': 0, '03 PM': 0,
      '04 PM': 0, '05 PM': 0, '06 PM': 0, '07 PM': 0, '08 PM': 0
    };
    invoices.forEach(inv => {
      if (inv.createdAt) {
        const date = new Date(inv.createdAt);
        const hr = date.getHours();
        let slot = '12 PM';
        if (hr === 10) slot = '10 AM';
        else if (hr === 11) slot = '11 AM';
        else if (hr === 12) slot = '12 PM';
        else if (hr === 13) slot = '01 PM';
        else if (hr === 14) slot = '02 PM';
        else if (hr === 15) slot = '03 PM';
        else if (hr === 16) slot = '04 PM';
        else if (hr === 17) slot = '05 PM';
        else if (hr === 18) slot = '06 PM';
        else if (hr === 19) slot = '07 PM';
        else if (hr >= 20) slot = '08 PM';

        data[slot] = (data[slot] || 0) + 1;
      }
    });
    return data;
  }, [invoices]);

  // Export HTML2PDF Report
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    addToast('Generating Financial Analytics PDF Report...', 'info');

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;
      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `SalonSync_Financial_Report_${dateHorizon}_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0f141d' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
      };

      await html2pdf().set(opt).from(element).save();
      addToast('Financial Analytics PDF report downloaded!', 'success');
    } catch (err) {
      console.error('PDF Export Error:', err);
      addToast('Failed to generate PDF. Use print option instead.', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "SALONSYNC RELIABLE FINANCIAL ANALYTICS REPORT\n";
    csv += `Report Generated Date,${new Date().toLocaleString()}\n`;
    csv += `Time Horizon,${dateHorizon}\n\n`;

    csv += "1. CORE FINANCIAL METRICS SUMMARY\n";
    csv += `Gross Revenue,${formatCurrency(financialMetrics.grossRevenue)}\n`;
    csv += `Discounts,${formatCurrency(financialMetrics.discounts)}\n`;
    csv += `Refunds,${formatCurrency(financialMetrics.refunds)}\n`;
    csv += `Net Revenue,${formatCurrency(financialMetrics.netRevenue)}\n`;
    csv += `Material/Product Costs,${formatCurrency(financialMetrics.productCosts)}\n`;
    csv += `Staff Commissions,${formatCurrency(financialMetrics.staffCommissions)}\n`;
    csv += `Gross Profit,${formatCurrency(financialMetrics.grossProfit)}\n`;
    csv += `Operating Expenses,${formatCurrency(financialMetrics.operatingExpenses)}\n`;
    csv += `Net Actual Profit,${formatCurrency(financialMetrics.netProfit)}\n`;
    csv += `Profit Margin %,${formatPercent(financialMetrics.profitMargin)}\n\n`;

    csv += "2. SERVICE PROFITABILITY BREAKDOWN\n";
    csv += "Service Name,Category,Volume,Revenue (INR),Product Cost (INR),Staff Comm (INR),Net Profit (INR)\n";
    serviceProfitability.forEach(s => {
      csv += `"${s.name}","${s.category}","${s.volume}","${formatCurrency(s.revenue)}","${formatCurrency(s.productCost)}","${formatCurrency(s.staffCommission)}","${formatCurrency(s.netProfit)}"\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SalonSync_Financial_Analytics_${dateHorizon}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Financial Report CSV downloaded successfully!', 'success');
  };

  return (
    <div className="page-container animated-fade-in" ref={reportRef}>
      
      {/* ─── PAGE HEADER & HORIZON CONTROLS ───────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart3 size={24} style={{ color: 'var(--gold-primary)' }} /> Financial Analytics & Business Intelligence
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Authoritative financial calculation engine: Revenue − Discounts − Refunds − Product Costs − Commissions − Expenses = Net Profit.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Branch Filter */}
          {branches.length > 0 && (
            <select
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Salon Branches</option>
              {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          )}

          <button onClick={handleExportCSV} className="outline-btn" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}>
            <FileSpreadsheet size={14} style={{ color: 'var(--accent-green)' }} /> Export CSV
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="gold-btn"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
          >
            {isExportingPDF ? <RefreshCw size={14} className="spin-icon" /> : <Download size={14} />} Download PDF Report
          </button>
        </div>
      </div>


      {/* ─── TIME HORIZON SELECTION TABS ───────────────────────────────────── */}
      <div className="crm-workspace-tabs" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'TODAY', label: 'Daily Report (Today)', icon: Calendar },
          { id: 'WEEK', label: 'Weekly Report (7 Days)', icon: Clock },
          { id: 'MONTH', label: 'Monthly Report (This Month)', icon: BarChart3 },
          { id: 'LAST_MONTH', label: 'Last Month', icon: Calendar },
          { id: 'YEAR', label: 'Yearly Report (This Year)', icon: Activity },
          { id: 'CUSTOM', label: 'Custom Date Range', icon: Filter },
          { id: 'ALL', label: 'All-Time Horizon', icon: Layers }
        ].map(horizon => {
          const Icon = horizon.icon;
          return (
            <button
              key={horizon.id}
              className={`crm-tab-btn ${dateHorizon === horizon.id ? 'active' : ''}`}
              onClick={() => setDateHorizon(horizon.id)}
            >
              <Icon size={15} />
              <span>{horizon.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Date Range Inputs */}
      {dateHorizon === 'CUSTOM' && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Start Date:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>End Date:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
            />
          </div>
          {loadingBackend && <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)' }}>Recalculating...</span>}
        </div>
      )}


      {/* ─── 8 CORE FINANCIAL INDICATOR CARDS ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Metric 1: Gross Revenue */}
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gross Revenue (Pre-Discount)</span>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--gold-primary)', marginTop: '0.25rem', fontWeight: '800' }}>
            {formatCurrency(financialMetrics.grossRevenue)}
          </h3>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>From billed invoices & services</span>
        </div>

        {/* Metric 2: Net Revenue */}
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Net Revenue (After Discounts & Refunds)</span>
          <h3 style={{ fontSize: '1.5rem', color: '#3498db', marginTop: '0.25rem', fontWeight: '800' }}>
            {formatCurrency(financialMetrics.netRevenue)}
          </h3>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>−{formatCurrency(financialMetrics.discounts)} disc & −{formatCurrency(financialMetrics.refunds)} refunds</span>
        </div>

        {/* Metric 3: Operating Expenses */}
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Operating Expenses</span>
          <h3 style={{ fontSize: '1.5rem', color: '#e74c3c', marginTop: '0.25rem', fontWeight: '800' }}>
            {formatCurrency(financialMetrics.operatingExpenses)}
          </h3>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Rent, Salary, Utilities, Vendor bills</span>
        </div>

        {/* Metric 4: Product Costs */}
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Product & Consumable Material Cost</span>
          <h3 style={{ fontSize: '1.5rem', color: '#9b59b6', marginTop: '0.25rem', fontWeight: '800' }}>
            {formatCurrency(financialMetrics.productCosts)}
          </h3>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Service recipes + retail stock cost</span>
        </div>

        {/* Metric 5: Staff Commissions */}
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Staff Commissions</span>
          <h3 style={{ fontSize: '1.5rem', color: '#e67e22', marginTop: '0.25rem', fontWeight: '800' }}>
            {formatCurrency(financialMetrics.staffCommissions)}
          </h3>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Earned stylist commissions</span>
        </div>

        {/* Metric 6: Gross Profit */}
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gross Profit</span>
          <h3 style={{ fontSize: '1.5rem', color: '#1abc9c', marginTop: '0.25rem', fontWeight: '800' }}>
            {formatCurrency(financialMetrics.grossProfit)}
          </h3>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Net Revenue − Materials − Comm.</span>
        </div>

        {/* Metric 7: Net Profit */}
        <div className="glass-card" style={{ borderLeft: financialMetrics.netProfit >= 0 ? '4px solid #2ecc71' : '4px solid var(--accent-red)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Net Actual Profit</span>
          <h3 style={{ fontSize: '1.6rem', color: financialMetrics.netProfit >= 0 ? '#2ecc71' : 'var(--accent-red)', marginTop: '0.25rem', fontWeight: '800' }}>
            {formatCurrency(financialMetrics.netProfit)}
          </h3>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Gross Profit − Operating Expenses</span>
        </div>

        {/* Metric 8: Profit Margin */}
        <div className="glass-card">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Profit Margin %</span>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--gold-primary)', marginTop: '0.25rem', fontWeight: '800' }}>
            {formatPercent(financialMetrics.profitMargin)}
          </h3>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>(Net Profit / Net Revenue) * 100</span>
        </div>

      </div>


      {/* ─── 6 FINANCIAL CHARTS & BREAKDOWN PANELS ─────────────────────────── */}

      {/* CHART 1 & CHART 2: REVENUE VS EXPENSES & PROFIT TREND */}
      <div className="grid-2-cols" style={{ marginBottom: '1.5rem' }}>
        
        {/* CHART 1: REVENUE VS EXPENSES */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>1. Net Revenue vs Operating Expenses</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Direct comparison of gross income against operating expenses</p>
            </div>
            <span className="gcal-tag">{dateHorizon}</span>
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--gold-primary)', fontWeight: '700' }}>📈 Net Revenue</span>
                <strong>{formatCurrency(financialMetrics.netRevenue)}</strong>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '7px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, var(--gold-primary), #b38f20)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#e74c3c', fontWeight: '700' }}>📉 Operating Expenses</span>
                <strong>{formatCurrency(financialMetrics.operatingExpenses)}</strong>
              </div>
              <div style={{ width: '100%', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '7px', overflow: 'hidden' }}>
                <div style={{
                  width: financialMetrics.netRevenue > 0 ? `${Math.min(100, Math.round((financialMetrics.operatingExpenses / financialMetrics.netRevenue) * 100))}%` : '0%',
                  height: '100%',
                  background: '#e74c3c'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* CHART 2: PROFIT TREND & MARGIN */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>2. Net Profit Evolution & Margin %</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Net actual bottom-line profit retention after all deductions</p>
            </div>
            <span className="gcal-tag" style={{ background: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71' }}>{formatPercent(financialMetrics.profitMargin)} Margin</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross Profit (Pre-Expense)</span>
                <div style={{ fontSize: '1.15rem', color: '#1abc9c', fontWeight: '700' }}>{formatCurrency(financialMetrics.grossProfit)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Bottom-Line Profit</span>
                <div style={{ fontSize: '1.25rem', color: financialMetrics.netProfit >= 0 ? '#2ecc71' : 'var(--accent-red)', fontWeight: '800' }}>
                  {formatCurrency(financialMetrics.netProfit)}
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(0, Math.min(100, financialMetrics.profitMargin))}%`, height: '100%', background: '#2ecc71' }} />
            </div>
          </div>
        </div>

      </div>


      {/* CHART 3: EXPENSE BREAKDOWN CATEGORIES */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>3. Operating Expense Breakdown (11 Categories)</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(expenseBreakdown).length === 0 ? (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No operating expense entries recorded yet.</span>
          ) : (
            Object.entries(expenseBreakdown).map(([cat, amt]) => {
              const pct = financialMetrics.operatingExpenses > 0 ? Math.round((amt / financialMetrics.operatingExpenses) * 100) : 0;
              return (
                <div key={cat} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.85rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>{cat}</div>
                  <div style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: '700', marginTop: '0.2rem' }}>{formatCurrency(amt)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', marginTop: '0.15rem' }}>{pct}% of operating budget</div>
                </div>
              );
            })
          )}
        </div>
      </div>


      {/* CHART 4: SERVICE PROFITABILITY BREAKDOWN */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>4. Service Profitability & Unit Economics Report</h3>

        <div className="table-responsive">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Category</th>
                <th>Volume</th>
                <th>Gross Revenue</th>
                <th>Product Cost</th>
                <th>Staff Comm.</th>
                <th>Net Service Profit</th>
              </tr>
            </thead>
            <tbody>
              {serviceProfitability.map(srv => (
                <tr key={srv.id}>
                  <td><strong style={{ color: 'var(--text-primary)' }}>{srv.name}</strong></td>
                  <td><span className="gcal-tag">{srv.category}</span></td>
                  <td><strong>{srv.volume} x</strong></td>
                  <td><strong style={{ color: 'var(--gold-primary)' }}>{formatCurrency(srv.revenue)}</strong></td>
                  <td>{formatCurrency(srv.productCost)}</td>
                  <td>{formatCurrency(srv.staffCommission)}</td>
                  <td>
                    <strong style={{ color: srv.netProfit >= 0 ? '#2ecc71' : 'var(--accent-red)' }}>
                      {formatCurrency(srv.netProfit)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* CHART 5 & CHART 6: STAFF REVENUE & BRANCH PROFITABILITY */}
      <div className="grid-2-cols">
        
        {/* CHART 5: STAFF REVENUE LEADERBOARD */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>5. Staff Revenue & Commission Leaderboard</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {staffRevenue.map(st => (
              <div key={st.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{st.name}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{st.role} • {st.count} checkouts</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: 'var(--gold-primary)', fontSize: '0.95rem' }}>{formatCurrency(st.revenue)}</strong>
                  <div style={{ fontSize: '0.7rem', color: '#e67e22' }}>{formatCurrency(st.commission)} comm.</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 6: BRANCH PROFITABILITY COMPARISON MATRIX */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>6. Multi-Branch Profitability Comparison Matrix</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {branchProfitability.map(br => (
              <div key={br.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <strong style={{ color: 'var(--gold-primary)', fontSize: '0.95rem' }}>{br.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({br.city})</span>
                  </div>
                  <strong style={{ color: '#2ecc71', fontSize: '1rem' }}>{formatCurrency(br.profit)} Net Profit</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Revenue: {formatCurrency(br.revenue)}</span>
                  <span>Expenses: {formatCurrency(br.expenses)}</span>
                  <span>Avg Bill: {formatCurrency(br.averageBill)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
