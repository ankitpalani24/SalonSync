import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Award,
  Shield, Scissors, Clock, Download, FileSpreadsheet, FileText,
  Building2, Package, Sparkles, RefreshCw, Calendar, ArrowUpRight,
  ArrowDownRight, PieChart, Activity, ShoppingBag, CheckCircle2, ChevronRight, Calculator
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// Profitability calculation engine helper
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
// MAIN BUSINESS INTELLIGENCE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const Analytics = () => {
  const { tenantFilter, db, addToast } = useApp();
  const reportRef = useRef(null);

  const [dateRange, setDateRange] = useState('ALL'); // 'TODAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const rawInvoices = tenantFilter(db.invoices || []);
  const rawExpenses = tenantFilter(db.expenses || []);
  const rawCustomers = tenantFilter(db.customers || []);
  const services = tenantFilter(db.services || []);
  const staff = tenantFilter(db.staff || []);
  const branches = tenantFilter(db.branches || []);
  const products = tenantFilter(db.products || []);

  // Filter Data by Selected Date Range
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = null;

    if (dateRange === 'TODAY') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRange === 'WEEK') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === 'MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === 'YEAR') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const matchesDate = (dateStr) => {
      if (!startDate || !dateStr) return true;
      const d = new Date(dateStr);
      return d >= startDate;
    };

    const invoices = rawInvoices.filter(i => matchesDate(i.createdAt));
    const expenses = rawExpenses.filter(e => matchesDate(e.date || e.createdAt));
    const customers = rawCustomers.filter(c => matchesDate(c.createdAt));

    return { invoices, expenses, customers };
  }, [dateRange, rawInvoices, rawExpenses, rawCustomers]);

  const { invoices, expenses, customers } = filteredData;

  // 1. REVENUE, EXPENSES & PROFIT CALCULATIONS
  const totalRevenue = invoices.reduce((sum, i) => sum + (i.finalAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  let totalMaterialCost = 0;
  invoices.forEach(inv => {
    (inv.services || []).forEach(item => {
      const originalServ = services.find(s => String(s._id) === String(item.serviceId));
      if (originalServ) {
        totalMaterialCost += (originalServ.materialCost || 0) * (item.quantity || 1);
      }
    });
  });

  const netProfit = totalRevenue - totalExpenses - totalMaterialCost;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';
  const averageBill = invoices.length > 0 ? Math.round(totalRevenue / invoices.length) : 0;

  // 2. CUSTOMER METRICS (GROWTH & RETENTION)
  const totalCustomersCount = rawCustomers.length;
  const newCustomersCount = customers.length;
  
  const customerInvoiceCounts = {};
  rawInvoices.forEach(inv => {
    if (inv.customerId) {
      const cid = typeof inv.customerId === 'object' ? inv.customerId._id : inv.customerId;
      customerInvoiceCounts[cid] = (customerInvoiceCounts[cid] || 0) + 1;
    }
  });

  const repeatCustomerCount = Object.keys(customerInvoiceCounts).filter(cid => customerInvoiceCounts[cid] > 1).length;
  const totalUniqueBillingClients = Object.keys(customerInvoiceCounts).length;
  const repeatRate = totalUniqueBillingClients > 0 ? Math.round((repeatCustomerCount / totalUniqueBillingClients) * 100) : 0;

  // 3. SERVICE PROFITABILITY REPORTS ENGINE
  const serviceProfitabilityReport = useMemo(() => {
    const reportMap = {};

    services.forEach(srv => {
      reportMap[String(srv._id)] = {
        id: srv._id,
        name: srv.name,
        category: srv.category,
        price: srv.price,
        duration: srv.duration,
        materialCost: srv.materialCost || 0,
        staffCommissionPercentage: srv.staffCommissionPercentage !== undefined ? srv.staffCommissionPercentage : 10,
        taxPercentage: srv.taxPercentage !== undefined ? srv.taxPercentage : 18,
        discountAmount: srv.discountAmount || 0,
        allocatedCostPercentage: srv.allocatedCostPercentage !== undefined ? srv.allocatedCostPercentage : 5,
        count: 0,
        totalCustomerPayment: 0,
        totalStaffCommission: 0,
        totalProductCost: 0,
        totalAllocatedCosts: 0,
        totalActualProfit: 0,
        profitMarginPct: 0
      };
    });

    invoices.forEach(inv => {
      (inv.services || []).forEach(item => {
        const sid = String(item.serviceId);
        let srvRec = reportMap[sid];

        if (!srvRec) {
          const found = services.find(s => s.name === item.name);
          if (found) srvRec = reportMap[String(found._id)];
        }

        if (srvRec) {
          const qty = item.quantity || 1;
          const fin = calculateServiceProfitability(
            srvRec.price,
            srvRec.materialCost,
            srvRec.staffCommissionPercentage,
            srvRec.taxPercentage,
            srvRec.discountAmount,
            srvRec.allocatedCostPercentage
          );

          srvRec.count += qty;
          srvRec.totalCustomerPayment += fin.customerPayment * qty;
          srvRec.totalStaffCommission += fin.staffCommission * qty;
          srvRec.totalProductCost += fin.productCost * qty;
          srvRec.totalAllocatedCosts += fin.allocatedCosts * qty;
          srvRec.totalActualProfit += fin.actualProfit * qty;
        }
      });
    });

    Object.values(reportMap).forEach(s => {
      s.profitMarginPct = s.totalCustomerPayment > 0
        ? Math.round((s.totalActualProfit / s.totalCustomerPayment) * 1000) / 10
        : 0;
    });

    const reportList = Object.values(reportMap);
    const activeServicesWithSales = reportList.filter(s => s.count > 0);

    const highestRevenueService = activeServicesWithSales.length > 0
      ? [...activeServicesWithSales].sort((a, b) => b.totalCustomerPayment - a.totalCustomerPayment)[0]
      : (services[0] || null);

    const highestProfitService = activeServicesWithSales.length > 0
      ? [...activeServicesWithSales].sort((a, b) => b.totalActualProfit - a.totalActualProfit)[0]
      : (services[0] || null);

    const lowestProfitService = activeServicesWithSales.length > 0
      ? [...activeServicesWithSales].sort((a, b) => a.totalActualProfit - b.totalActualProfit)[0]
      : (services[services.length - 1] || null);

    const mostBookedService = activeServicesWithSales.length > 0
      ? [...activeServicesWithSales].sort((a, b) => b.count - a.count)[0]
      : (services[0] || null);

    const grandTotalRevenue = reportList.reduce((sum, s) => sum + s.totalCustomerPayment, 0);
    const grandTotalProfit = reportList.reduce((sum, s) => sum + s.totalActualProfit, 0);
    const grandTotalVolume = reportList.reduce((sum, s) => sum + s.count, 0);
    const avgServiceValue = grandTotalVolume > 0 ? Math.round(grandTotalRevenue / grandTotalVolume) : 0;

    return {
      reportList,
      highestRevenueService,
      highestProfitService,
      lowestProfitService,
      mostBookedService,
      grandTotalRevenue,
      grandTotalProfit,
      grandTotalVolume,
      avgServiceValue
    };
  }, [services, invoices]);

  // 4. TOP EMPLOYEES BY REVENUE & COMPLETED SERVICES
  const staffStatsMap = {};
  staff.forEach(st => {
    staffStatsMap[st._id] = { name: st.name, role: st.role, rating: st.rating || 5.0, count: 0, revenue: 0 };
  });

  invoices.forEach(inv => {
    const sid = typeof inv.staffId === 'object' ? inv.staffId?._id : inv.staffId;
    if (sid && staffStatsMap[sid]) {
      staffStatsMap[sid].count += 1;
      staffStatsMap[sid].revenue += inv.finalAmount || 0;
    }
  });

  const topEmployees = Object.values(staffStatsMap).sort((a, b) => b.revenue - a.revenue);

  // 5. PEAK HOURS CALCULATION
  const hourlyData = {
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

      hourlyData[slot] = (hourlyData[slot] || 0) + 1;
    }
  });

  let peakHourSlot = '03 PM';
  let maxHourVal = 0;
  Object.keys(hourlyData).forEach(slot => {
    if (hourlyData[slot] > maxHourVal) {
      peakHourSlot = slot;
      maxHourVal = hourlyData[slot];
    }
  });

  // 6. INVENTORY USAGE & LOW STOCK METRICS
  const inventoryUsage = products.map(p => ({
    name: p.name,
    sku: p.sku,
    quantity: p.quantity,
    threshold: p.lowStockThreshold,
    category: p.category,
    status: p.quantity <= p.lowStockThreshold ? 'Low Stock' : 'In Stock'
  })).sort((a, b) => a.quantity - b.quantity);

  const lowStockCount = inventoryUsage.filter(p => p.status === 'Low Stock').length;

  // 7. BRANCH COMPARISON MATRIX
  const branchComparison = branches.map(br => {
    const bInvoices = rawInvoices.filter(i => {
      const bid = typeof i.branchId === 'object' ? i.branchId?._id : i.branchId;
      return String(bid) === String(br._id);
    });
    const bExpenses = rawExpenses.filter(e => {
      const bid = typeof e.branchId === 'object' ? e.branchId?._id : e.branchId;
      return String(bid) === String(br._id);
    });

    const bRev = bInvoices.reduce((s, i) => s + (i.finalAmount || 0), 0);
    const bExp = bExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const bAov = bInvoices.length > 0 ? Math.round(bRev / bInvoices.length) : 0;

    return {
      id: br._id,
      name: br.name,
      city: br.city || 'Location',
      revenue: bRev,
      expenses: bExp,
      profit: Math.max(0, bRev - bExp),
      checkoutCount: bInvoices.length,
      averageBill: bAov
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "SALONSYNC BUSINESS INTELLIGENCE REPORT\n";
    csvContent += `Generated Date,${new Date().toLocaleString()}\n`;
    csvContent += `Time Horizon Filter,${dateRange}\n\n`;

    // Summary Metrics
    csvContent += "SUMMARY FINANCIAL METRICS\n";
    csvContent += `Gross Revenue,₹${totalRevenue}\n`;
    csvContent += `Material Costs,₹${totalMaterialCost}\n`;
    csvContent += `Operating Expenses,₹${totalExpenses}\n`;
    csvContent += `Net Operating Profit,₹${netProfit}\n`;
    csvContent += `Profit Margin %,${profitMargin}%\n`;
    csvContent += `Average Order Value (AOV),₹${averageBill}\n`;
    csvContent += `Repeat Customer Rate,${repeatRate}%\n\n`;

    // Service Profitability Report
    csvContent += "SERVICE PROFITABILITY REPORT\n";
    csvContent += "Service Name,Category,Volume,Customer Payments,Staff Commission,Product Cost,Allocated Costs,Net Actual Profit,Profit Margin %\n";
    serviceProfitabilityReport.reportList.forEach(s => {
      csvContent += `"${s.name}",${s.category},${s.count},₹${s.totalCustomerPayment},₹${s.totalStaffCommission},₹${s.totalProductCost},₹${s.totalAllocatedCosts},₹${s.totalActualProfit},${s.profitMarginPct}%\n`;
    });
    csvContent += "\n";

    // Staff Performance
    csvContent += "STAFF PERFORMANCE RANKINGS\n";
    csvContent += "Staff Name,Role,Checkouts Done,Revenue Generated\n";
    topEmployees.forEach(st => {
      csvContent += `"${st.name}",${st.role},${st.count},₹${st.revenue}\n`;
    });
    csvContent += "\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SalonSync_BI_Profitability_Report_${dateRange}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Excel/CSV BI & Profitability report downloaded successfully!', 'success');
  };

  // Export PDF
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExportingPDF(true);
    addToast('Generating executive BI PDF report...', 'info');

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;
      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `SalonSync_Executive_BI_${dateRange}_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#050505' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
      };

      await html2pdf().set(opt).from(element).save();
      addToast('PDF report downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to export PDF. Please try printing or CSV export.', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="page-container animated-fade-in bi-container" ref={reportRef}>
      
      {/* ─── HEADER & EXPORT TOOLBAR ───────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart3 size={24} style={{ color: 'var(--gold-primary)' }} /> Business Intelligence Workspace
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time multi-branch financial engine, service profitability tracking, customer retention, and staff rankings.
          </p>
        </div>

        {/* Date Filter & Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Time Filter Pills */}
          <div style={{ display: 'flex', gap: '0.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '0.2rem', borderRadius: '6px' }}>
            {[
              { id: 'TODAY', label: 'Today' },
              { id: 'WEEK', label: '7 Days' },
              { id: 'MONTH', label: 'This Month' },
              { id: 'YEAR', label: 'This Year' },
              { id: 'ALL', label: 'All Time' },
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setDateRange(tf.id)}
                style={{
                  border: 'none',
                  background: dateRange === tf.id ? 'var(--gold-primary)' : 'transparent',
                  color: dateRange === tf.id ? '#000' : 'var(--text-secondary)',
                  fontSize: '0.75rem', fontWeight: '600', padding: '0.35rem 0.65rem', borderRadius: '4px',
                  cursor: 'pointer', transition: 'var(--transition-smooth)'
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button onClick={handleExportCSV} className="outline-btn" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}>
            <FileSpreadsheet size={14} style={{ color: 'var(--accent-green)' }} /> Export Excel / CSV
          </button>

          {/* Export PDF Button */}
          <button onClick={handleExportPDF} disabled={isExportingPDF} className="gold-btn" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}>
            <FileText size={14} /> {isExportingPDF ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>


      {/* ─── 1. P&L FINANCIAL LEDGER STATEMENT ─────────────────────────────── */}
      <div className="glass-card gold-border" style={{ padding: '1.75rem', marginBottom: '1.5rem', background: 'var(--gold-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--gold-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={18} /> Financial P&L Operating Statement — [{dateRange}]
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            Operating Profit Margin: <strong style={{ color: 'var(--gold-primary)' }}>{profitMargin}%</strong>
          </span>
        </div>

        <div className="dash-kpi-grid">
          {/* Net Operating Profit */}
          <div className="dash-kpi-card" style={{ borderLeft: '3px solid #2ecc71' }}>
            <div className="dash-kpi-header">
              <div className="dash-kpi-icon" style={{ background: 'rgba(46,204,113,0.12)', color: '#2ecc71' }}>
                <Award size={20} />
              </div>
              <span className="dash-kpi-trend up">{profitMargin}% Margin</span>
            </div>
            <div className="dash-kpi-value" style={{ color: '#2ecc71' }}>₹{netProfit.toLocaleString()}</div>
            <div className="dash-kpi-title">Net Operating Profit</div>
            <div className="dash-kpi-subtitle">Revenue − Expenses − Material</div>
          </div>

          {/* Material Cost */}
          <div className="dash-kpi-card" style={{ borderLeft: '3px solid #e67e22' }}>
            <div className="dash-kpi-header">
              <div className="dash-kpi-icon" style={{ background: 'rgba(230,126,34,0.12)', color: '#e67e22' }}>
                <Scissors size={20} />
              </div>
              <span className="dash-kpi-trend down">Treatment Consumables</span>
            </div>
            <div className="dash-kpi-value">₹{totalMaterialCost.toLocaleString()}</div>
            <div className="dash-kpi-title">Material Cost</div>
            <div className="dash-kpi-subtitle">Product consumption cost</div>
          </div>

          {/* Repeat Customer Rate */}
          <div className="dash-kpi-card" style={{ borderLeft: '3px solid #9b59b6' }}>
            <div className="dash-kpi-header">
              <div className="dash-kpi-icon" style={{ background: 'rgba(155,89,182,0.12)', color: '#9b59b6' }}>
                <RefreshCw size={20} />
              </div>
              <span className="dash-kpi-trend up">{repeatCustomerCount} Loyal Clients</span>
            </div>
            <div className="dash-kpi-value" style={{ color: '#9b59b6' }}>{repeatRate}% Retention</div>
            <div className="dash-kpi-title">Repeat Customer Rate</div>
            <div className="dash-kpi-subtitle">Clients returned 2+ times</div>
          </div>

          {/* Average Order Value (AOV) */}
          <div className="dash-kpi-card" style={{ borderLeft: '3px solid var(--gold-primary)' }}>
            <div className="dash-kpi-header">
              <div className="dash-kpi-icon" style={{ background: 'var(--gold-bg)', color: 'var(--gold-primary)' }}>
                <ShoppingBag size={20} />
              </div>
              <span className="dash-kpi-trend up">{invoices.length} Receipts</span>
            </div>
            <div className="dash-kpi-value" style={{ color: 'var(--gold-primary)' }}>₹{averageBill.toLocaleString()}</div>
            <div className="dash-kpi-title">Average Bill Value (AOV)</div>
            <div className="dash-kpi-subtitle">Per checkout average</div>
          </div>
        </div>
      </div>


      {/* ─── 2. SERVICE PROFITABILITY REPORT HIGHLIGHTS ────────────────────── */}
      <div className="dash-chart-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-section-header">
          <div className="dash-section-title">
            <Calculator size={18} style={{ color: 'var(--gold-primary)' }} />
            <h3>Service Profitability & Cost Breakdown Summary</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '600' }}>
            Average Service Value: ₹{serviceProfitabilityReport.avgServiceValue.toLocaleString()}
          </span>
        </div>

        <div className="crm-summary-grid" style={{ marginBottom: '1rem' }}>
          <div className="crm-summary-card">
            <div className="crm-sum-icon" style={{ background: 'rgba(52, 152, 219, 0.12)', color: '#3498db' }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="crm-sum-title">Highest Revenue Service</div>
              <div className="crm-sum-value" style={{ fontSize: '1rem' }}>
                {serviceProfitabilityReport.highestRevenueService ? serviceProfitabilityReport.highestRevenueService.name : 'N/A'}
              </div>
              <div className="crm-metric-sub" style={{ color: 'var(--gold-primary)' }}>
                ₹{serviceProfitabilityReport.highestRevenueService ? serviceProfitabilityReport.highestRevenueService.totalCustomerPayment.toLocaleString() : 0}
              </div>
            </div>
          </div>

          <div className="crm-summary-card">
            <div className="crm-sum-icon" style={{ background: 'rgba(46, 204, 113, 0.12)', color: '#2ecc71' }}>
              <Award size={18} />
            </div>
            <div>
              <div className="crm-sum-title">Highest Net Profit Service</div>
              <div className="crm-sum-value" style={{ fontSize: '1rem', color: '#2ecc71' }}>
                {serviceProfitabilityReport.highestProfitService ? serviceProfitabilityReport.highestProfitService.name : 'N/A'}
              </div>
              <div className="crm-metric-sub" style={{ color: '#2ecc71' }}>
                ₹{serviceProfitabilityReport.highestProfitService ? serviceProfitabilityReport.highestProfitService.totalActualProfit.toLocaleString() : 0} profit
              </div>
            </div>
          </div>

          <div className="crm-summary-card">
            <div className="crm-sum-icon" style={{ background: 'rgba(231, 76, 60, 0.12)', color: '#e74c3c' }}>
              <TrendingDown size={18} />
            </div>
            <div>
              <div className="crm-sum-title">Lowest Profit Service</div>
              <div className="crm-sum-value" style={{ fontSize: '1rem' }}>
                {serviceProfitabilityReport.lowestProfitService ? serviceProfitabilityReport.lowestProfitService.name : 'N/A'}
              </div>
              <div className="crm-metric-sub" style={{ color: '#e74c3c' }}>
                ₹{serviceProfitabilityReport.lowestProfitService ? serviceProfitabilityReport.lowestProfitService.totalActualProfit.toLocaleString() : 0} profit
              </div>
            </div>
          </div>

          <div className="crm-summary-card">
            <div className="crm-sum-icon" style={{ background: 'rgba(155, 89, 182, 0.12)', color: '#9b59b6' }}>
              <Scissors size={18} />
            </div>
            <div>
              <div className="crm-sum-title">Most Booked Service</div>
              <div className="crm-sum-value" style={{ fontSize: '1rem' }}>
                {serviceProfitabilityReport.mostBookedService ? serviceProfitabilityReport.mostBookedService.name : 'N/A'}
              </div>
              <div className="crm-metric-sub">
                {serviceProfitabilityReport.mostBookedService ? serviceProfitabilityReport.mostBookedService.count : 0} sessions
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ─── 3. PEAK HOURS CAPACITY UTILIZATION CHART ──────────────────────── */}
      <div className="dash-chart-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-section-header">
          <div className="dash-section-title">
            <Clock size={18} style={{ color: 'var(--gold-primary)' }} />
            <h3>Peak Hours Checkout & Salon Capacity Distribution</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: '600' }}>
            Busiest Time Slot: {peakHourSlot} ({maxHourVal} checkouts)
          </span>
        </div>
        <PeakHoursChart hourlyData={hourlyData} />
      </div>


      {/* ─── 4. POPULAR VS LEAST POPULAR SERVICES & STAFF RANKINGS ─────────── */}
      <div className="dash-charts-row-3" style={{ marginBottom: '1.5rem' }}>
        
        {/* Most Popular Services */}
        <div className="dash-panel-card">
          <div className="dash-section-header">
            <div className="dash-section-title">
              <Sparkles size={18} style={{ color: 'var(--gold-primary)' }} />
              <h3>Most Popular Treatments</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {mostPopularServices.length === 0 ? (
              <div className="dash-empty-state">No treatment data recorded.</div>
            ) : (
              mostPopularServices.map((srv, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 0.85rem', background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-light)', borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{srv.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{srv.category} • {srv.count} sales</div>
                  </div>
                  <strong style={{ color: 'var(--gold-primary)', fontSize: '0.9rem' }}>₹{srv.revenue.toLocaleString()}</strong>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Least Popular Services */}
        <div className="dash-panel-card">
          <div className="dash-section-header">
            <div className="dash-section-title">
              <Scissors size={18} style={{ color: 'var(--accent-orange)' }} />
              <h3>Least Popular Treatments</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {leastPopularServices.length === 0 ? (
              <div className="dash-empty-state">No service records found.</div>
            ) : (
              leastPopularServices.map((srv, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 0.85rem', background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-light)', borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{srv.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Price: ₹{srv.price} • {srv.count} sales</div>
                  </div>
                  <span className="gcal-tag" style={{ fontSize: '0.68rem', color: 'var(--accent-orange)' }}>Promo Needed</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Employees Ranking */}
        <div className="dash-panel-card">
          <div className="dash-section-header">
            <div className="dash-section-title">
              <Award size={18} style={{ color: 'var(--gold-primary)' }} />
              <h3>Top Employee Performance</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topEmployees.length === 0 ? (
              <div className="dash-empty-state">No employee checkout logs.</div>
            ) : (
              topEmployees.slice(0, 5).map((st, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 0.85rem',
                  background: idx === 0 ? 'var(--gold-bg)' : 'rgba(255,255,255,0.02)',
                  border: idx === 0 ? '1px solid var(--gold-primary)' : '1px solid var(--border-light)',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      #{idx + 1} {st.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{st.role} • {st.count} sessions</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: 'var(--gold-primary)', fontSize: '0.88rem' }}>₹{st.revenue.toLocaleString()}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>★ {st.rating}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>


      {/* ─── 5. INVENTORY CONSUMPTION & BRANCH COMPARISON ─────────────────── */}
      <div className="dash-charts-row" style={{ marginBottom: '1.5rem' }}>
        
        {/* Inventory Usage & Low Stock Warnings */}
        <div className="dash-panel-card">
          <div className="dash-section-header">
            <div className="dash-section-title">
              <Package size={18} style={{ color: 'var(--gold-primary)' }} />
              <h3>Retail & Treatment Inventory Usage</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: lowStockCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: '600' }}>
              {lowStockCount > 0 ? `${lowStockCount} Items Low Stock` : 'All Stock Optimal'}
            </span>
          </div>

          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Quantity Available</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryUsage.slice(0, 5).map((prod, idx) => (
                  <tr key={idx}>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{prod.name}</strong></td>
                    <td><span className="gcal-tag">{prod.sku}</span></td>
                    <td><strong>{prod.quantity} units</strong></td>
                    <td>
                      <span className={`badge ${prod.status === 'Low Stock' ? 'cancelled' : 'confirmed'}`}>
                        {prod.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Multi-Branch Franchise Comparison */}
        <div className="dash-panel-card">
          <div className="dash-section-header">
            <div className="dash-section-title">
              <Building2 size={18} style={{ color: 'var(--gold-primary)' }} />
              <h3>Multi-Branch Franchise Comparison</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {branchComparison.length === 0 ? (
              <div className="dash-empty-state">No branch comparative data logged.</div>
            ) : (
              branchComparison.map((b, idx) => (
                <div key={b.id} style={{
                  padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-light)', borderRadius: '8px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      #{idx + 1} {b.name} ({b.city})
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {b.checkoutCount} checkouts • AOV: ₹{b.averageBill}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--gold-primary)' }}>₹{b.revenue.toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-green)', fontWeight: '600' }}>Profit: ₹{b.profit.toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
