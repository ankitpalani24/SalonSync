import React, { useState, useMemo } from 'react';
import {
  Plus, DollarSign, Calendar, Filter, Search, X, FileSpreadsheet,
  TrendingUp, TrendingDown, PieChart, BarChart3, Paperclip, Truck,
  Building2, CreditCard, CheckCircle2, AlertCircle, ArrowUpRight,
  ArrowDownRight, Eye, Edit, Trash2, Tag, Layers, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState, DataGridHeader } from '../components/UIComponents';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';

const EXPENSE_CATEGORIES = [
  'Rent',
  'Salary',
  'Electricity',
  'Water',
  'Products',
  'Equipment',
  'Maintenance',
  'Marketing',
  'Internet',
  'Transportation',
  'Other'
];

const CATEGORY_COLORS = {
  'Rent': '#e74c3c',
  'Salary': '#3498db',
  'Electricity': '#f39c12',
  'Water': '#1abc9c',
  'Products': '#9b59b6',
  'Equipment': '#34495e',
  'Maintenance': '#d35400',
  'Marketing': '#e67e22',
  'Internet': '#2980b9',
  'Transportation': '#2ecc71',
  'Other': '#7f8c8d'
};

const Expenses = () => {
  const {
    tenantFilter, db, addExpense, updateExpense, deleteExpense,
    currentUser, currentBranch, addToast, hasPermission, PERMISSIONS
  } = useApp();

  const rawExpenses = tenantFilter(db.expenses || []);
  const suppliers = tenantFilter(db.suppliers || []);
  const branches = tenantFilter(db.branches || []);

  // Workspace Tabs
  const [mainTab, setMainTab] = useState('ledger'); // 'ledger' | 'daily' | 'monthly' | 'categories' | 'trends'

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL'); // 'TODAY' | 'WEEK' | 'MONTH' | 'LAST_MONTH' | 'YEAR' | 'CUSTOM' | 'ALL'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');

  // Modals State
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Expense Form State
  const [expCategory, setExpCategory] = useState('Rent');
  const [expAmount, setExpAmount] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expPaymentMethod, setExpPaymentMethod] = useState('Cash');
  const [expVendor, setExpVendor] = useState('');
  const [expReceiptUrl, setExpReceiptUrl] = useState('');
  const [expBranchId, setExpBranchId] = useState(currentBranch ? currentBranch._id : '');

  // ────────────────────────────────────────────────────────────────────────────
  // FILTERED EXPENSES COMPUTATION
  // ────────────────────────────────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (dateRangeFilter === 'TODAY') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateRangeFilter === 'WEEK') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateRangeFilter === 'MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRangeFilter === 'LAST_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (dateRangeFilter === 'YEAR') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (dateRangeFilter === 'CUSTOM') {
      if (customStartDate) {
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
      }
      if (customEndDate) {
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    return rawExpenses.filter(exp => {
      // Date filter strictly on expense date
      if (startDate || endDate) {
        const expD = new Date(exp.date || exp.createdAt);
        if (startDate && expD < startDate) return false;
        if (endDate && expD > endDate) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) return false;

      // Payment method filter
      if (paymentMethodFilter !== 'ALL' && exp.paymentMethod !== paymentMethodFilter) return false;

      // Branch filter
      if (branchFilter !== 'ALL') {
        const bid = typeof exp.branchId === 'object' ? exp.branchId?._id : exp.branchId;
        if (String(bid) !== String(branchFilter)) return false;
      }

      // Search text filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesQ =
          (exp.category && exp.category.toLowerCase().includes(q)) ||
          (exp.description && exp.description.toLowerCase().includes(q)) ||
          (exp.vendor && exp.vendor.toLowerCase().includes(q)) ||
          (exp.createdBy && exp.createdBy.toLowerCase().includes(q)) ||
          (exp.amount && String(exp.amount).includes(q));
        if (!matchesQ) return false;
      }

      return true;
    });
  }, [rawExpenses, dateRangeFilter, customStartDate, customEndDate, categoryFilter, paymentMethodFilter, branchFilter, searchTerm]);

  // ────────────────────────────────────────────────────────────────────────────
  // FINANCIAL REPORTS CALCULATIONS
  // ────────────────────────────────────────────────────────────────────────────
  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  // Daily Expense Report Breakdown
  const dailyReport = useMemo(() => {
    const map = {};
    filteredExpenses.forEach(exp => {
      const dayStr = exp.date ? new Date(exp.date).toISOString().split('T')[0] : 'Unknown Date';
      if (!map[dayStr]) {
        map[dayStr] = { date: dayStr, total: 0, count: 0, items: [] };
      }
      map[dayStr].total += Number(exp.amount) || 0;
      map[dayStr].count += 1;
      map[dayStr].items.push(exp);
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredExpenses]);

  // Monthly Expense Report Breakdown
  const monthlyReport = useMemo(() => {
    const map = {};
    filteredExpenses.forEach(exp => {
      const d = exp.date ? new Date(exp.date) : new Date();
      const monthStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!map[monthStr]) {
        map[monthStr] = { month: monthStr, total: 0, count: 0, categories: {} };
      }
      map[monthStr].total += Number(exp.amount) || 0;
      map[monthStr].count += 1;

      const cat = exp.category || 'Other';
      map[monthStr].categories[cat] = (map[monthStr].categories[cat] || 0) + (Number(exp.amount) || 0);
    });
    return Object.values(map);
  }, [filteredExpenses]);

  // Category Breakdown Allocation
  const categoryBreakdown = useMemo(() => {
    const map = {};
    EXPENSE_CATEGORIES.forEach(c => { map[c] = 0; });

    filteredExpenses.forEach(exp => {
      const cat = exp.category || 'Other';
      map[cat] = (map[cat] || 0) + (Number(exp.amount) || 0);
    });

    const total = Object.values(map).reduce((sum, val) => sum + val, 0);

    return EXPENSE_CATEGORIES.map(cat => {
      const amount = map[cat] || 0;
      const percentage = total > 0 ? Math.round((amount / total) * 1000) / 10 : 0;
      return {
        category: cat,
        amount,
        percentage,
        color: CATEGORY_COLORS[cat] || '#7f8c8d'
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  // Top Category
  const topCategory = categoryBreakdown[0] || { category: 'N/A', amount: 0 };

  // ────────────────────────────────────────────────────────────────────────────
  // FORM HANDLERS
  // ────────────────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setExpCategory('Rent');
    setExpAmount('');
    setExpDescription('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpPaymentMethod('Cash');
    setExpVendor('');
    setExpReceiptUrl('');
    setExpBranchId(currentBranch ? currentBranch._id : '');
    setEditingExpense(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (exp) => {
    setEditingExpense(exp);
    setExpCategory(exp.category || 'Rent');
    setExpAmount(exp.amount || '');
    setExpDescription(exp.description || '');
    setExpDate(exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setExpPaymentMethod(exp.paymentMethod || 'Cash');
    setExpVendor(exp.vendor || '');
    setExpReceiptUrl(exp.receiptUrl || '');
    setExpBranchId(typeof exp.branchId === 'object' ? exp.branchId?._id : exp.branchId || '');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!expAmount || Number(expAmount) <= 0) {
      addToast('Please enter a valid expense amount', 'warning');
      return;
    }

    const payload = {
      category: expCategory,
      amount: Number(expAmount),
      description: expDescription,
      date: expDate,
      paymentMethod: expPaymentMethod,
      vendor: expVendor,
      receiptUrl: expReceiptUrl,
      createdBy: currentUser?.name || 'Manager',
      branchId: expBranchId || (currentBranch ? currentBranch._id : null)
    };

    if (editingExpense) {
      await updateExpense(editingExpense._id, payload);
      addToast('Expense record updated successfully', 'success');
    } else {
      await addExpense(payload);
      addToast('Expense logged successfully', 'success');
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      await deleteExpense(id);
      addToast('Expense record removed', 'info');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "SALONSYNC EXPENSE MANAGEMENT REPORT\n";
    csv += `Generated Date,${new Date().toLocaleString()}\n`;
    csv += `Time Horizon,${dateRangeFilter}\n`;
    csv += `Total Expenses Logged,₹${totalExpenseAmount}\n\n`;

    csv += "Date,Category,Vendor/Supplier,Payment Method,Amount (INR),Description,Created By\n";
    filteredExpenses.forEach(exp => {
      const dateStr = exp.date ? new Date(exp.date).toISOString().split('T')[0] : '';
      csv += `"${dateStr}","${exp.category}","${exp.vendor || 'N/A'}","${exp.paymentMethod || 'Cash'}","₹${exp.amount}","${exp.description || ''}","${exp.createdBy || 'Staff'}"\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SalonSync_Expenses_Report_${dateRangeFilter}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Expense report CSV downloaded successfully!', 'success');
  };


  // ────────────────────────────────────────────────────────────────────────────
  // JSX RETURN
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="page-container animated-fade-in">
      
      {/* ─── HEADER ───────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <DollarSign size={24} style={{ color: 'var(--gold-primary)' }} /> Professional Expense Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Track overhead costs, rent, staff salaries, utilities, vendor bills, and daily/monthly operational reports.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV} className="outline-btn" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}>
            <FileSpreadsheet size={14} style={{ color: 'var(--accent-green)' }} /> Export CSV Report
          </button>
          <button onClick={handleOpenCreate} className="gold-btn" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}>
            <Plus size={16} /> Log Expense
          </button>
        </div>
      </div>


      {/* ─── SUMMARY KPI CARDS ────────────────────────────────────────────── */}
      <div className="crm-summary-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="crm-summary-card">
          <div className="crm-sum-icon" style={{ background: 'rgba(231, 76, 60, 0.12)', color: '#e74c3c' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div className="crm-sum-title">Total Filtered Expenses</div>
            <div className="crm-sum-value" style={{ color: '#e74c3c', fontSize: '1.4rem' }}>
              {formatCurrency(totalExpenseAmount)}
            </div>
            <div className="crm-metric-sub">{filteredExpenses.length} expense receipts</div>
          </div>
        </div>

        <div className="crm-summary-card">
          <div className="crm-sum-icon" style={{ background: 'rgba(243, 156, 18, 0.12)', color: '#f39c12' }}>
            <PieChart size={20} />
          </div>
          <div>
            <div className="crm-sum-title">Top Expense Category</div>
            <div className="crm-sum-value" style={{ fontSize: '1.2rem' }}>
              {topCategory.category}
            </div>
            <div className="crm-metric-sub" style={{ color: '#f39c12', fontWeight: '600' }}>
              {formatCurrency(topCategory.amount)} ({formatPercent(topCategory.percentage)})
            </div>
          </div>
        </div>

        <div className="crm-summary-card">
          <div className="crm-sum-icon" style={{ background: 'rgba(52, 152, 219, 0.12)', color: '#3498db' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div className="crm-sum-title">Daily Average Spend</div>
            <div className="crm-sum-value" style={{ fontSize: '1.4rem' }}>
              {formatCurrency(dailyReport.length > 0 ? Math.round(totalExpenseAmount / dailyReport.length) : 0)}
            </div>
            <div className="crm-metric-sub">Across {dailyReport.length} active spend days</div>
          </div>
        </div>

        <div className="crm-summary-card">
          <div className="crm-sum-icon" style={{ background: 'rgba(46, 204, 113, 0.12)', color: '#2ecc71' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <div className="crm-sum-title">Active Payment Methods</div>
            <div className="crm-sum-value" style={{ fontSize: '1.2rem' }}>
              4 Methods
            </div>
            <div className="crm-metric-sub">Cash, UPI, Card, Bank Transfer</div>
          </div>
        </div>
      </div>


      {/* ─── WORKSPACE TABS NAV ───────────────────────────────────────────── */}
      <div className="crm-workspace-tabs" style={{ marginBottom: '1.5rem' }}>
        {[
          { id: 'ledger', label: `Expense Ledger (${filteredExpenses.length})`, icon: DollarSign },
          { id: 'daily', label: 'Daily Expense Report', icon: Calendar },
          { id: 'monthly', label: 'Monthly Expense Report', icon: BarChart3 },
          { id: 'categories', label: 'Category Allocation Breakdown', icon: PieChart },
          { id: 'trends', label: 'Expense Trends & MoM', icon: TrendingUp }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`crm-tab-btn ${mainTab === tab.id ? 'active' : ''}`}
              onClick={() => setMainTab(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>


      {/* ─── SEARCH & MULTI-FILTER BAR ────────────────────────────────────── */}
      <div className="gcal-filters-bar" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div className="gcal-search-box">
          <Search size={15} style={{ color: 'var(--gold-primary)' }} />
          <input
            type="text"
            placeholder="Search vendor, description, category, created by..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="gcal-search-clear" onClick={() => setSearchTerm('')}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="gcal-filter-item">
          <label>Category:</label>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="ALL">All Categories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Payment Method Filter */}
        <div className="gcal-filter-item">
          <label>Payment Method:</label>
          <select value={paymentMethodFilter} onChange={e => setPaymentMethodFilter(e.target.value)}>
            <option value="ALL">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        {/* Time Horizon Filter */}
        <div className="gcal-filter-item">
          <label>Date Horizon:</label>
          <select value={dateRangeFilter} onChange={e => setDateRangeFilter(e.target.value)}>
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="WEEK">Last 7 Days</option>
            <option value="MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="YEAR">This Year</option>
            <option value="CUSTOM">Custom Date Range</option>
          </select>
        </div>

        {/* Custom Start & End Date Pickers */}
        {dateRangeFilter === 'CUSTOM' && (
          <>
            <div className="gcal-filter-item">
              <label>Start Date:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
              />
            </div>
            <div className="gcal-filter-item">
              <label>End Date:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
              />
            </div>
          </>
        )}

        {/* Branch Filter */}
        {branches.length > 0 && (
          <div className="gcal-filter-item">
            <label>Branch:</label>
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
              <option value="ALL">All Branches</option>
              {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
        )}
      </div>


      {/* ════════════════════════════════════════════════════════════════════
         TAB 1: OPERATIONAL EXPENSE LEDGER DATAGRID
         ════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'ledger' && (
        <div className="glass-card">
          {filteredExpenses.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No Expenses Logged"
              description="There are no expense records matching your current filter criteria. Click Log Expense to add operational costs."
              actionLabel="Log Expense"
              onAction={handleOpenCreate}
            />
          ) : (
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount (INR)</th>
                    <th>Payment Method</th>
                    <th>Supplier / Vendor</th>
                    <th>Description</th>
                    <th>Created By</th>
                    <th>Receipt</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(exp => {
                    const color = CATEGORY_COLORS[exp.category] || '#7f8c8d';
                    const dateStr = exp.date ? new Date(exp.date).toISOString().split('T')[0] : 'N/A';

                    return (
                      <tr key={exp._id}>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{dateStr}</span>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: `${color}20`,
                              color: color,
                              border: `1px solid ${color}40`,
                              fontWeight: '600',
                              fontSize: '0.75rem'
                            }}
                          >
                            {exp.category}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--accent-red)', fontSize: '0.95rem' }}>
                            {formatCurrency(exp.amount)}
                          </strong>
                        </td>
                        <td>
                          <span className="gcal-tag">{exp.paymentMethod || 'Cash'}</span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                            {exp.vendor || 'Direct Vendor'}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {exp.description || 'No notes'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {exp.createdBy || 'Manager'}
                          </span>
                        </td>
                        <td>
                          {exp.receiptUrl ? (
                            <button
                              onClick={() => setViewingReceipt(exp)}
                              className="outline-btn"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.68rem', borderColor: 'var(--gold-primary)', color: 'var(--gold-primary)' }}
                            >
                              <Paperclip size={11} /> View Receipt
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>None</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleOpenEdit(exp)}
                              className="outline-btn"
                              style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(exp._id)}
                              className="outline-btn"
                              style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════
         TAB 2: DAILY EXPENSE REPORT
         ════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'daily' && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Daily Expense Log Breakdown</h3>
          
          {dailyReport.length === 0 ? (
            <div className="crm-empty-state">No daily expense logs found for selected criteria.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {dailyReport.map(day => (
                <div key={day.date} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} style={{ color: 'var(--gold-primary)' }} />
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{day.date}</strong>
                      <span className="gcal-tag">{day.count} receipts</span>
                    </div>
                    <strong style={{ color: 'var(--accent-red)', fontSize: '1.05rem' }}>{formatCurrency(day.total)}</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {day.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <div>
                          <strong style={{ color: CATEGORY_COLORS[item.category] || '#fff' }}>[{item.category}]</strong> {item.description || item.vendor || 'Expense Item'}
                        </div>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════
         TAB 3: MONTHLY EXPENSE REPORT
         ════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'monthly' && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Monthly Expense Ledger & Operating Cost Summary</h3>
          
          {monthlyReport.length === 0 ? (
            <div className="crm-empty-state">No monthly expense data recorded.</div>
          ) : (
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Month Horizon</th>
                    <th>Total Receipts</th>
                    <th>Total Operating Spend</th>
                    <th>Top Spend Category in Month</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyReport.map((m, idx) => {
                    const topCatInMonth = Object.entries(m.categories).sort((a, b) => b[1] - a[1])[0] || ['Other', 0];
                    return (
                      <tr key={idx}>
                        <td><strong style={{ color: 'var(--text-primary)' }}>{m.month}</strong></td>
                        <td><strong>{m.count} receipts</strong></td>
                        <td><strong style={{ color: 'var(--accent-red)', fontSize: '1rem' }}>{formatCurrency(m.total)}</strong></td>
                        <td>
                          <span className="badge confirm">{topCatInMonth[0]}: {formatCurrency(topCatInMonth[1])}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════
         TAB 4: CATEGORY BREAKDOWN ALLOCATION
         ════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'categories' && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Category Allocation Distribution</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categoryBreakdown.map(item => (
              <div key={item.category} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.color }} />
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.category}</strong>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{formatCurrency(item.amount)}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({formatPercent(item.percentage)})</span>
                  </div>
                </div>

                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.percentage}%`, height: '100%', background: item.color, transition: 'var(--transition-smooth)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════
         TAB 5: EXPENSE TRENDS & MOM ANALYTICS
         ════════════════════════════════════════════════════════════════════ */}
      {mainTab === 'trends' && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Expense Trends & Category Allocation Highlights</h3>
          
          <div className="grid-2-cols">
            {categoryBreakdown.slice(0, 6).map(item => (
              <div key={item.category} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${item.color}40`, borderRadius: '8px', borderLeft: `4px solid ${item.color}` }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.category} Spending</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {formatCurrency(item.amount)}
                </div>
                <div style={{ fontSize: '0.75rem', color: item.color, marginTop: '0.4rem', fontWeight: '600' }}>
                  Accounts for {formatPercent(item.percentage)} of total operational budget
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════
         LOG / EDIT EXPENSE MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>{editingExpense ? 'Edit Expense Record' : 'Log Operational Expense'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Expense Category *</label>
                  <select className="form-control" required value={expCategory} onChange={e => setExpCategory(e.target.value)}>
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input type="number" required min="1" placeholder="25000" className="form-control" value={expAmount} onChange={e => setExpAmount(e.target.value)} />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Expense Date *</label>
                  <input type="date" required className="form-control" value={expDate} onChange={e => setExpDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select className="form-control" value={expPaymentMethod} onChange={e => setExpPaymentMethod(e.target.value)}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / Digital</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Supplier / Vendor Name</label>
                  <input type="text" placeholder="e.g. L'Oreal Ind / RealEstate Corp" className="form-control" value={expVendor} onChange={e => setExpVendor(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Branch</label>
                  <select className="form-control" value={expBranchId} onChange={e => setExpBranchId(e.target.value)}>
                    <option value="">-- Main Branch --</option>
                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Receipt Attachment Image URL / Document</label>
                <input type="text" placeholder="https://example.com/receipt-123.jpg or voucher code" className="form-control" value={expReceiptUrl} onChange={e => setExpReceiptUrl(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Description Details</label>
                <textarea className="form-control" rows="2" placeholder="Notes on invoice number, approval, or breakdown..." value={expDescription} onChange={e => setExpDescription(e.target.value)} />
              </div>

              <button type="submit" className="gold-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                {editingExpense ? 'Update Expense Record' : 'Save Expense Record'}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════
         VIEW RECEIPT MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {viewingReceipt && (
        <div onClick={() => setViewingReceipt(null)} className="modal-backdrop-overlay">
          <div className="modal-scrollable-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Receipt Document Voucher</h3>
              <button onClick={() => setViewingReceipt(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}><X size={18} /></button>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--gold-border)', marginBottom: '1rem' }}>
              <div><strong>Category:</strong> {viewingReceipt.category}</div>
              <div><strong>Vendor:</strong> {viewingReceipt.vendor || 'Vendor'}</div>
              <div><strong>Amount:</strong> ₹{viewingReceipt.amount}</div>
              <div><strong>Payment Method:</strong> {viewingReceipt.paymentMethod}</div>
              <div><strong>Date:</strong> {viewingReceipt.date}</div>
              <div><strong>Attachment Reference:</strong> {viewingReceipt.receiptUrl}</div>
            </div>

            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#000', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
              <Paperclip size={32} style={{ color: 'var(--gold-primary)', marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Receipt Voucher: <code>{viewingReceipt.receiptUrl}</code>
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Expenses;
