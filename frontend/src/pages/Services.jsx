import React, { useState, useMemo } from 'react';
import {
  Plus, Scissors, Sparkles, Clock, Calculator, Percent, Tag, X,
  TrendingUp, TrendingDown, DollarSign, Award, BarChart3, ArrowUpRight,
  PieChart, FileText, CheckCircle2, AlertCircle, ShoppingBag, Layers, Bookmark
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/UIComponents';

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

const Services = () => {
  const { tenantFilter, db, addService, updateService, addPackage } = useApp();
  const [editingService, setEditingService] = useState(null);

  const services = tenantFilter(db.services || []);
  const packages = tenantFilter(db.packages || []);
  const invoices = tenantFilter(db.invoices || []);
  const appointments = tenantFilter(db.appointments || []);

  const categories = ['All', 'Haircut', 'Hair Color', 'Facial', 'Makeup', 'Waxing', 'Spa', 'Bridal Services'];
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');
  const [mainTab, setMainTab] = useState('catalog'); // 'catalog' | 'profitability'

  // Modals
  const [showSrvModal, setShowSrvModal] = useState(false);
  const [showPkgModal, setShowPkgModal] = useState(false);

  // Service Form state with full financial & profitability fields
  const [srvName, setSrvName] = useState('');
  const [srvCat, setSrvCat] = useState('Haircut');
  const [srvDuration, setSrvDuration] = useState(30);
  const [srvPrice, setSrvPrice] = useState(1200);
  const [srvCost, setSrvCost] = useState(150);
  const [srvCommissionPct, setSrvCommissionPct] = useState(10);
  const [srvTaxPct, setSrvTaxPct] = useState(18);
  const [srvDiscountAmt, setSrvDiscountAmt] = useState(0);
  const [srvAllocatedCostPct, setSrvAllocatedCostPct] = useState(5);
  const [srvDesc, setSrvDesc] = useState('');

  // Package Form state
  const [pkgName, setPkgName] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [pkgPrice, setPkgPrice] = useState(0);
  const [pkgExpiry, setPkgExpiry] = useState('');

  const [tempServId, setTempServId] = useState('');
  const [tempSessions, setTempSessions] = useState(1);

  // Filter service catalog
  const filteredServices = activeCategoryTab === 'All' 
    ? services 
    : services.filter(s => s.category === activeCategoryTab);

  // Live Modal Profitability Calculation
  const modalProfitability = useMemo(() => {
    return calculateServiceProfitability(
      srvPrice, srvCost, srvCommissionPct, srvTaxPct, srvDiscountAmt, srvAllocatedCostPct
    );
  }, [srvPrice, srvCost, srvCommissionPct, srvTaxPct, srvDiscountAmt, srvAllocatedCostPct]);

  // ────────────────────────────────────────────────────────────────────────────
  // SERVICE PROFITABILITY & FINANCIAL REPORTS ENGINE (REAL DATABASE TRANSACTIONS)
  // ────────────────────────────────────────────────────────────────────────────
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

    // Aggregate from Invoices
    invoices.forEach(inv => {
      (inv.services || []).forEach(item => {
        const sid = String(item.serviceId);
        let srvRec = reportMap[sid];

        if (!srvRec) {
          // Fallback matching by name
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

    // Calculate Margin % for each service
    Object.values(reportMap).forEach(s => {
      s.profitMarginPct = s.totalCustomerPayment > 0
        ? Math.round((s.totalActualProfit / s.totalCustomerPayment) * 1000) / 10
        : 0;
    });

    const reportList = Object.values(reportMap);
    const activeServicesWithSales = reportList.filter(s => s.count > 0);

    // Highest Revenue Service
    const highestRevenueService = activeServicesWithSales.length > 0
      ? [...activeServicesWithSales].sort((a, b) => b.totalCustomerPayment - a.totalCustomerPayment)[0]
      : (services[0] || null);

    // Highest Profit Service
    const highestProfitService = activeServicesWithSales.length > 0
      ? [...activeServicesWithSales].sort((a, b) => b.totalActualProfit - a.totalActualProfit)[0]
      : (services[0] || null);

    // Lowest Profit Service
    const lowestProfitService = activeServicesWithSales.length > 0
      ? [...activeServicesWithSales].sort((a, b) => a.totalActualProfit - b.totalActualProfit)[0]
      : (services[services.length - 1] || null);

    // Most Frequently Booked Service
    const mostBookedService = activeServicesWithSales.length > 0
      ? [...activeServicesWithSales].sort((a, b) => b.count - a.count)[0]
      : (services[0] || null);

    // Total Financial Aggregates
    const grandTotalRevenue = reportList.reduce((sum, s) => sum + s.totalCustomerPayment, 0);
    const grandTotalProfit = reportList.reduce((sum, s) => sum + s.totalActualProfit, 0);
    const grandTotalVolume = reportList.reduce((sum, s) => sum + s.count, 0);
    const avgServiceValue = grandTotalVolume > 0 ? Math.round(grandTotalRevenue / grandTotalVolume) : 0;
    const overallProfitMargin = grandTotalRevenue > 0 ? (grandTotalProfit / grandTotalRevenue) * 100 : 0;

    return {
      reportList,
      highestRevenueService,
      highestProfitService,
      lowestProfitService,
      mostBookedService,
      grandTotalRevenue,
      grandTotalProfit,
      grandTotalVolume,
      avgServiceValue,
      overallProfitMargin
    };
  }, [services, invoices, appointments]);

  // Form Submit Handler
  const handleServiceSubmit = (e) => {
    e.preventDefault();
    const fin = calculateServiceProfitability(
      srvPrice, srvCost, srvCommissionPct, srvTaxPct, srvDiscountAmt, srvAllocatedCostPct
    );

    const payload = {
      name: srvName,
      category: srvCat,
      duration: Number(srvDuration),
      price: Number(srvPrice),
      materialCost: Number(srvCost),
      staffCommissionPercentage: Number(srvCommissionPct),
      taxPercentage: Number(srvTaxPct),
      discountAmount: Number(srvDiscountAmt),
      allocatedCostPercentage: Number(srvAllocatedCostPct),
      actualProfit: fin.actualProfit,
      profitMarginPercentage: fin.profitMargin,
      description: srvDesc
    };

    if (editingService) {
      updateService(editingService._id, payload);
    } else {
      addService(payload);
    }
    
    setShowSrvModal(false);
    setEditingService(null);
    resetForm();
  };

  const resetForm = () => {
    setSrvName('');
    setSrvCat('Haircut');
    setSrvDuration(30);
    setSrvPrice(1200);
    setSrvCost(150);
    setSrvCommissionPct(10);
    setSrvTaxPct(18);
    setSrvDiscountAmt(0);
    setSrvAllocatedCostPct(5);
    setSrvDesc('');
  };

  const handleOpenEdit = (srv) => {
    setEditingService(srv);
    setSrvName(srv.name);
    setSrvCat(srv.category);
    setSrvDuration(srv.duration);
    setSrvPrice(srv.price);
    setSrvCost(srv.materialCost || 0);
    setSrvCommissionPct(srv.staffCommissionPercentage !== undefined ? srv.staffCommissionPercentage : 10);
    setSrvTaxPct(srv.taxPercentage !== undefined ? srv.taxPercentage : 18);
    setSrvDiscountAmt(srv.discountAmount || 0);
    setSrvAllocatedCostPct(srv.allocatedCostPercentage !== undefined ? srv.allocatedCostPercentage : 5);
    setSrvDesc(srv.description || '');
    setShowSrvModal(true);
  };

  const handleAddTempService = () => {
    if (!tempServId) return;
    const exists = selectedServices.some(s => s.serviceId === tempServId);
    if (exists) return;

    const matchedSrv = services.find(s => s._id === tempServId);
    setSelectedServices(prev => [
      ...prev,
      { serviceId: tempServId, name: matchedSrv ? matchedSrv.name : 'Service', sessionsCount: Number(tempSessions) }
    ]);
  };

  const handleRemoveTempService = (srvId) => {
    setSelectedServices(prev => prev.filter(s => s.serviceId !== srvId));
  };

  const handlePackageSubmit = (e) => {
    e.preventDefault();
    addPackage({
      name: pkgName,
      includedServices: selectedServices.map(s => ({ serviceId: s.serviceId, name: s.name, sessionsCount: s.sessionsCount })),
      price: Number(pkgPrice),
      expiryDate: pkgExpiry
    });
    setShowPkgModal(false);

    setPkgName('');
    setSelectedServices([]);
    setPkgPrice(0);
    setPkgExpiry('');
  };

  return (
    <div className="page-container animated-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Services & Profitability Engine</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Configure treatments, commissions, material costs, taxes, and track service net profitability reports.
          </p>
        </div>
        <div className="flex-mobile-column" style={{ gap: '0.75rem' }}>
          <button onClick={() => setShowPkgModal(true)} className="outline-btn">
            <Sparkles size={16} /> Bundle Package
          </button>
          <button onClick={() => { resetForm(); setShowSrvModal(true); }} className="gold-btn">
            <Plus size={16} /> Create Service
          </button>
        </div>
      </div>

      {/* Main View Mode Selector Tabs */}
      <div className="crm-workspace-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`crm-tab-btn ${mainTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setMainTab('catalog')}
        >
          <Scissors size={15} />
          <span>Treatment Menu Catalog ({services.length})</span>
        </button>
        <button
          className={`crm-tab-btn ${mainTab === 'profitability' ? 'active' : ''}`}
          onClick={() => setMainTab('profitability')}
        >
          <BarChart3 size={15} />
          <span>Service Profitability Reports</span>
        </button>
      </div>


      {/* ════════════════════════════════════════════════════════════════════
         TAB 1: TREATMENT MENU CATALOG & PACKAGES
         ════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'catalog' && (
        <div className="grid-split-3-1-2">
          
          {/* Left Side: Services Roster */}
          <div className="glass-card">
            <div className="flex-between-responsive" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Treatment Catalog & Financials</h3>
              
              {/* Category Filter Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxWidth: '100%', paddingBottom: '0.25rem' }}>
                {categories.slice(0, 6).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryTab(cat)}
                    style={{
                      background: activeCategoryTab === cat ? 'var(--gold-bg)' : 'transparent',
                      border: activeCategoryTab === cat ? '1px solid var(--gold-primary)' : '1px solid var(--border-light)',
                      color: activeCategoryTab === cat ? 'var(--gold-primary)' : 'var(--text-secondary)',
                      borderRadius: '4px',
                      padding: '0.35rem 0.6rem',
                      fontSize: '0.7rem',
                      fontWeight: '500'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <EmptyState
                icon={Scissors}
                title="No Treatments Found"
                description="There are no services configured in this category. Click create service to add new treatments."
                actionLabel="Create Service"
                onAction={() => { resetForm(); setShowSrvModal(true); }}
              />
            ) : (
              <div className="table-responsive">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Service Details</th>
                      <th>Category & Time</th>
                      <th>Selling Price (INR)</th>
                      <th>Cost Parameters</th>
                      <th>Actual Net Profit</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map(srv => {
                      const fin = calculateServiceProfitability(
                        srv.price,
                        srv.materialCost,
                        srv.staffCommissionPercentage,
                        srv.taxPercentage,
                        srv.discountAmount,
                        srv.allocatedCostPercentage
                      );
                      const isHighMargin = fin.profitMargin >= 70;

                      return (
                        <tr key={srv._id}>
                          <td>
                            <div>
                              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{srv.name}</span>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{srv.description || 'No description'}</p>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{srv.category}</span>
                              <p style={{ fontSize: '0.7rem', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Clock size={11} /> {srv.duration} mins
                              </p>
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong style={{ color: 'var(--gold-primary)', fontSize: '0.95rem' }}>₹{srv.price}</strong>
                              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Cust Pay: ₹{fin.customerPayment}</p>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              <div>Staff Comm: {srv.staffCommissionPercentage !== undefined ? srv.staffCommissionPercentage : 10}% (₹{fin.staffCommission})</div>
                              <div>Material: ₹{srv.materialCost || 0}</div>
                              <div>Overhead: {srv.allocatedCostPercentage !== undefined ? srv.allocatedCostPercentage : 5}% (₹{fin.allocatedCosts})</div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong style={{ color: fin.actualProfit >= 0 ? '#2ecc71' : 'var(--accent-red)', fontSize: '0.95rem' }}>
                                ₹{fin.actualProfit}
                              </strong>
                              <div style={{ marginTop: '0.15rem' }}>
                                <span className={`badge ${isHighMargin ? 'vip' : 'confirm'}`} style={{ fontSize: '0.65rem' }}>
                                  {fin.profitMargin}% Margin
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleOpenEdit(srv)}
                              className="outline-btn"
                              style={{ padding: '0.25rem 0.65rem', fontSize: '0.7rem' }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Side: Packages Bundles */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Bundled Combos & Packages</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {packages.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No Bundles Created"
                  description="Bundle multiple services together into discounted packages."
                  actionLabel="Bundle Package"
                  onAction={() => setShowPkgModal(true)}
                />
              ) : (
                packages.map((pkg) => (
                  <div key={pkg._id} style={{
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-gold)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--gold-primary)', fontWeight: '600' }}>{pkg.name}</h4>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.95rem' }}>₹{pkg.price}</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(255,255,255,0.05)' }}>
                      {pkg.includedServices.map((inc, i) => (
                        <span key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          • {inc.name} ({inc.sessionsCount} sessions)
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      <span>Unlimited validity</span>
                      {pkg.expiryDate && <span>Expires: {pkg.expiryDate}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════
         TAB 2: SERVICE PROFITABILITY REPORTS & FINANCIALS
         ════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'profitability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Profitability Formula Banner */}
          <div className="glass-card" style={{ background: 'var(--gold-bg)', borderColor: 'var(--gold-border)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--gold-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator size={18} /> Exact Financial Profitability Formula Enforced
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <span><strong>Customer Payment</strong> = Selling Price − Discount + Tax (18%)</span>
              <span>•</span>
              <span><strong>Actual Net Profit</strong> = Customer Payment − Staff Comm. − Product Cost − Overhead</span>
              <span>•</span>
              <span><strong>Profit Margin %</strong> = (Actual Profit / Customer Payment) × 100</span>
            </div>
          </div>

          {/* 5 TOP SERVICE PROFITABILITY REPORT CARDS */}
          <div className="crm-summary-grid">
            {/* Card 1: Highest Revenue Service */}
            <div className="crm-summary-card">
              <div className="crm-sum-icon" style={{ background: 'rgba(52, 152, 219, 0.12)', color: '#3498db' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <div className="crm-sum-title">Highest Revenue Service</div>
                <div className="crm-sum-value" style={{ fontSize: '1.15rem' }}>
                  {serviceProfitabilityReport.highestRevenueService ? serviceProfitabilityReport.highestRevenueService.name : 'N/A'}
                </div>
                <div className="crm-metric-sub" style={{ color: 'var(--gold-primary)', fontWeight: '600' }}>
                  ₹{serviceProfitabilityReport.highestRevenueService ? serviceProfitabilityReport.highestRevenueService.totalCustomerPayment.toLocaleString() : 0} gross
                </div>
              </div>
            </div>

            {/* Card 2: Highest Profit Service */}
            <div className="crm-summary-card">
              <div className="crm-sum-icon" style={{ background: 'rgba(46, 204, 113, 0.12)', color: '#2ecc71' }}>
                <Award size={20} />
              </div>
              <div>
                <div className="crm-sum-title">Highest Net Profit Service</div>
                <div className="crm-sum-value" style={{ fontSize: '1.15rem', color: '#2ecc71' }}>
                  {serviceProfitabilityReport.highestProfitService ? serviceProfitabilityReport.highestProfitService.name : 'N/A'}
                </div>
                <div className="crm-metric-sub" style={{ color: '#2ecc71', fontWeight: '600' }}>
                  ₹{serviceProfitabilityReport.highestProfitService ? serviceProfitabilityReport.highestProfitService.totalActualProfit.toLocaleString() : 0} net profit
                </div>
              </div>
            </div>

            {/* Card 3: Lowest Profit Service */}
            <div className="crm-summary-card">
              <div className="crm-sum-icon" style={{ background: 'rgba(231, 76, 60, 0.12)', color: '#e74c3c' }}>
                <TrendingDown size={20} />
              </div>
              <div>
                <div className="crm-sum-title">Lowest Net Profit Service</div>
                <div className="crm-sum-value" style={{ fontSize: '1.15rem' }}>
                  {serviceProfitabilityReport.lowestProfitService ? serviceProfitabilityReport.lowestProfitService.name : 'N/A'}
                </div>
                <div className="crm-metric-sub" style={{ color: '#e74c3c', fontWeight: '600' }}>
                  ₹{serviceProfitabilityReport.lowestProfitService ? serviceProfitabilityReport.lowestProfitService.totalActualProfit.toLocaleString() : 0} net profit
                </div>
              </div>
            </div>

            {/* Card 4: Most Frequently Booked Service */}
            <div className="crm-summary-card">
              <div className="crm-sum-icon" style={{ background: 'rgba(155, 89, 182, 0.12)', color: '#9b59b6' }}>
                <Scissors size={20} />
              </div>
              <div>
                <div className="crm-sum-title">Most Booked Service</div>
                <div className="crm-sum-value" style={{ fontSize: '1.15rem' }}>
                  {serviceProfitabilityReport.mostBookedService ? serviceProfitabilityReport.mostBookedService.name : 'N/A'}
                </div>
                <div className="crm-metric-sub">
                  {serviceProfitabilityReport.mostBookedService ? serviceProfitabilityReport.mostBookedService.count : 0} checkouts
                </div>
              </div>
            </div>
          </div>


          {/* 6. PROFIT MARGIN BY SERVICE BREAKDOWN TABLE */}
          <div className="glass-card">
            <div className="flex-between-responsive" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>Service Profitability & Cost Breakdown Report</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Actual transaction ledger from database invoices: Customer Payments − Staff Commissions − Material Costs − Overhead = Actual Profit
                </p>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--gold-primary)', fontWeight: '700' }}>
                Average Service Value: ₹{serviceProfitabilityReport.avgServiceValue.toLocaleString()}
              </div>
            </div>

            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Volume</th>
                    <th>Customer Payments</th>
                    <th>Staff Comm.</th>
                    <th>Material Cost</th>
                    <th>Overhead Cost</th>
                    <th>Net Actual Profit</th>
                    <th>Profit Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceProfitabilityReport.reportList.map(srv => {
                    const isHighMargin = srv.profitMarginPct >= 70;
                    return (
                      <tr key={srv.id}>
                        <td><strong style={{ color: 'var(--text-primary)' }}>{srv.name}</strong></td>
                        <td><span className="gcal-tag">{srv.category}</span></td>
                        <td><strong>{srv.count} x</strong></td>
                        <td><strong style={{ color: 'var(--gold-primary)' }}>₹{srv.totalCustomerPayment.toLocaleString()}</strong></td>
                        <td>₹{srv.totalStaffCommission.toLocaleString()}</td>
                        <td>₹{srv.totalProductCost.toLocaleString()}</td>
                        <td>₹{srv.totalAllocatedCosts.toLocaleString()}</td>
                        <td>
                          <strong style={{ color: srv.totalActualProfit >= 0 ? '#2ecc71' : 'var(--accent-red)', fontSize: '0.95rem' }}>
                            ₹{srv.totalActualProfit.toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          <span className={`badge ${isHighMargin ? 'vip' : 'confirm'}`} style={{ fontSize: '0.75rem' }}>
                            {srv.profitMarginPct}%
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


      {/* ════════════════════════════════════════════════════════════════════
         CREATE / EDIT SERVICE MODAL WITH LIVE PROFIT ESTIMATOR
         ════════════════════════════════════════════════════════════════════ */}
      {showSrvModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowSrvModal(false); setEditingService(null); } }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>{editingService ? 'Edit Service Financials' : 'Create Treatment Service'}</h3>
              <button onClick={() => { setShowSrvModal(false); setEditingService(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleServiceSubmit}>
              <div className="form-group">
                <label>Service Name *</label>
                <input type="text" required placeholder="Signature Balayage & Blow Dry" className="form-control" value={srvName} onChange={(e) => setSrvName(e.target.value)} />
              </div>
              
              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Category *</label>
                  <select className="form-control" value={srvCat} onChange={(e) => setSrvCat(e.target.value)}>
                    {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration (mins)</label>
                  <input type="number" className="form-control" value={srvDuration} onChange={(e) => setSrvDuration(e.target.value)} />
                </div>
              </div>

              {/* Financial Inputs Grid */}
              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Selling Price (₹) *</label>
                  <input type="number" required placeholder="1500" className="form-control" value={srvPrice} onChange={(e) => setSrvPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Product / Material Cost (₹)</label>
                  <input type="number" placeholder="150" className="form-control" value={srvCost} onChange={(e) => setSrvCost(e.target.value)} />
                </div>
              </div>

              <div className="grid-3-cols">
                <div className="form-group">
                  <label>Staff Comm (%)</label>
                  <input type="number" className="form-control" value={srvCommissionPct} onChange={(e) => setSrvCommissionPct(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Tax (%)</label>
                  <input type="number" className="form-control" value={srvTaxPct} onChange={(e) => setSrvTaxPct(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Overhead Cost (%)</label>
                  <input type="number" className="form-control" value={srvAllocatedCostPct} onChange={(e) => setSrvAllocatedCostPct(e.target.value)} />
                </div>
              </div>

              {/* LIVE PROFITABILITY ESTIMATOR BREAKDOWN BOX */}
              <div style={{
                background: 'rgba(46,204,113,0.06)',
                border: '1px solid rgba(46,204,113,0.25)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.8rem',
                marginBottom: '1.25rem'
              }}>
                <div style={{ color: 'var(--gold-primary)', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calculator size={14} /> Live Service Profitability Breakdown:
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <div>Customer Payment: <strong>₹{modalProfitability.customerPayment}</strong></div>
                  <div>Staff Commission: <strong>₹{modalProfitability.staffCommission}</strong></div>
                  <div>Product Cost: <strong>₹{modalProfitability.productCost}</strong></div>
                  <div>Allocated Overhead: <strong>₹{modalProfitability.allocatedCosts}</strong></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(46,204,113,0.2)' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Estimated Net Profit:</span>
                  <strong style={{ color: '#2ecc71', fontSize: '1rem' }}>
                    ₹{modalProfitability.actualProfit} ({modalProfitability.profitMargin}% Margin)
                  </strong>
                </div>
              </div>

              <div className="form-group">
                <label>Description Details</label>
                <textarea className="form-control" rows="2" placeholder="Brief outline of steps involved..." value={srvDesc} onChange={(e) => setSrvDesc(e.target.value)} />
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center' }}>
                {editingService ? 'Update Service Item' : 'Save Menu Item'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bundle Package Modal */}
      {showPkgModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowPkgModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Bundle Service Package</h3>
              <button onClick={() => setShowPkgModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            
            <form onSubmit={handlePackageSubmit}>
              <div className="form-group">
                <label>Package Name *</label>
                <input type="text" required placeholder="Luxury Facial Roster" className="form-control" value={pkgName} onChange={(e) => setPkgName(e.target.value)} />
              </div>

              <div style={{ border: '1px solid var(--border-light)', borderRadius: '6px', padding: '1rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Bundle Items</h4>
                
                <div className="flex-mobile-column" style={{ marginBottom: '1rem' }}>
                  <select className="form-control" style={{ flex: 2 }} value={tempServId} onChange={(e) => setTempServId(e.target.value)}>
                    <option value="">-- Choose Service --</option>
                    {services.map(s => <option key={s._id} value={s._id}>{s.name} (₹{s.price})</option>)}
                  </select>
                  <input type="number" min="1" className="form-control" style={{ flex: 1 }} placeholder="Sessions" value={tempSessions} onChange={(e) => setTempSessions(e.target.value)} />
                  <button type="button" onClick={handleAddTempService} className="outline-btn" style={{ padding: '0.5rem' }}>Add</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedServices.map(item => (
                    <div key={item.serviceId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.35rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                      <span>{item.name} (x{item.sessionsCount} sessions)</span>
                      <button type="button" onClick={() => handleRemoveTempService(item.serviceId)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)' }}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Bundle Package Price (₹) *</label>
                  <input type="number" required placeholder="5000" className="form-control" value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Expiration Date</label>
                  <input type="date" className="form-control" value={pkgExpiry} onChange={(e) => setPkgExpiry(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>Create Bundle Package</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Services;
