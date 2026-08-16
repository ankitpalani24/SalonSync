const mongoose = require('mongoose');
const models = require('../models');

/**
 * Resolves start and end Date objects for standard and custom date ranges.
 * Ensures consistent timezone-aware day boundary coverage (00:00:00.000 to 23:59:59.999).
 */
const getDateRangeBounds = (horizon = 'month', customStart = null, customEnd = null) => {
  const now = new Date();

  if (customStart || customEnd) {
    const start = customStart ? new Date(customStart) : new Date(0);
    start.setHours(0, 0, 0, 0);

    const end = customEnd ? new Date(customEnd) : new Date();
    end.setHours(23, 59, 59, 999);

    return { startDate: start, endDate: end };
  }

  const normalized = (horizon || 'month').toLowerCase().replace(/[\s-]/g, '_');

  if (normalized === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  if (normalized === 'yesterday') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  if (normalized === 'week' || normalized === 'this_week' || normalized === 'weekly') {
    // Current week: from 7 days ago 00:00:00 to today 23:59:59.999
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  if (normalized === 'month' || normalized === 'this_month' || normalized === 'monthly') {
    // 1st of current month to end of current month
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  if (normalized === 'last_month') {
    // 1st of last month to last day of last month
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  if (normalized === 'year' || normalized === 'this_year' || normalized === 'yearly') {
    // Jan 1 to Dec 31 of current year
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  if (normalized === 'all') {
    return { startDate: null, endDate: null };
  }

  // Fallback to current month
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startDate: start, endDate: end };
};

/**
 * Builds date query object for MongoDB given a field name and bounds
 */
const buildDateFilter = (fieldName, startDate, endDate) => {
  if (!startDate && !endDate) return {};
  const filter = {};
  if (startDate) filter.$gte = startDate;
  if (endDate) filter.$lte = endDate;
  return { [fieldName]: filter };
};

/**
 * Authoritative financial calculation service.
 * Computes Gross Revenue, Discounts, Refunds, Net Revenue, Product Costs,
 * Staff Commissions, Operating Expenses, Gross Profit, Net Profit, and Profit Margin.
 */
const getFinancialSummary = async ({
  salonId,
  branchId = null,
  horizon = 'month',
  startDate = null,
  endDate = null
}) => {
  const { startDate: boundsStart, endDate: boundsEnd } = getDateRangeBounds(horizon, startDate, endDate);

  const baseTenantFilter = {};
  if (salonId) baseTenantFilter.salonId = salonId;

  const branchTenantFilter = { ...baseTenantFilter };
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    branchTenantFilter.branchId = branchId;
  }

  // Date filters
  const invoiceDateFilter = boundsStart || boundsEnd
    ? buildDateFilter('createdAt', boundsStart, boundsEnd)
    : {};

  const expenseDateFilter = boundsStart || boundsEnd
    ? buildDateFilter('date', boundsStart, boundsEnd)
    : {};

  const commissionDateFilter = boundsStart || boundsEnd
    ? buildDateFilter('date', boundsStart, boundsEnd)
    : {};

  const apptDateFilter = boundsStart || boundsEnd
    ? buildDateFilter('date', boundsStart, boundsEnd)
    : {};

  const custDateFilter = boundsStart || boundsEnd
    ? buildDateFilter('createdAt', boundsStart, boundsEnd)
    : {};

  // Parallel database retrieval
  const [
    invoices,
    expenses,
    commissions,
    services,
    products,
    staff,
    branches,
    appointments,
    customers
  ] = await Promise.all([
    models.Invoice.find({ ...branchTenantFilter, ...invoiceDateFilter }).lean(),
    models.Expense.find({ ...branchTenantFilter, ...expenseDateFilter }).lean(),
    models.Commission.find({ ...branchTenantFilter, ...commissionDateFilter }).lean(),
    models.Service.find(baseTenantFilter).lean(),
    models.Product.find(baseTenantFilter).lean(),
    models.Staff.find(baseTenantFilter).lean(),
    models.Branch.find(baseTenantFilter).lean(),
    models.Appointment.find({ ...branchTenantFilter, ...apptDateFilter }).lean(),
    models.Customer.find(baseTenantFilter).lean()
  ]);

  // 1. REVENUE CALCULATIONS
  let grossRevenue = 0;
  let discounts = 0;
  let refunds = 0;
  let refundCount = 0;
  let paidInvoiceCount = 0;

  invoices.forEach(inv => {
    if (inv.paymentStatus === 'Refunded' || inv.status === 'Cancelled') {
      refunds += Number(inv.finalAmount) || 0;
      refundCount += 1;
      return;
    }

    let invItemGross = 0;
    (inv.services || []).forEach(s => {
      invItemGross += (Number(s.price) || 0) * (Number(s.quantity) || 1);
    });
    (inv.products || []).forEach(p => {
      invItemGross += (Number(p.price) || 0) * (Number(p.quantity) || 1);
    });

    grossRevenue += (invItemGross || Number(inv.finalAmount) || 0);
    discounts += (Number(inv.discount) || 0);
    paidInvoiceCount += 1;
  });

  // Net Revenue: Gross items minus discounts and refunds
  const netRevenue = Math.max(0, grossRevenue - discounts - refunds);

  // 2. PRODUCT / MATERIAL COSTS
  let productCosts = 0;
  invoices.forEach(inv => {
    if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled') {
      (inv.services || []).forEach(item => {
        const srv = services.find(s => String(s._id) === String(item.serviceId) || s.name === item.name);
        if (srv) {
          productCosts += (Number(srv.materialCost) || 0) * (Number(item.quantity) || 1);
        }
      });
      (inv.products || []).forEach(item => {
        const prod = products.find(p => String(p._id) === String(item.productId) || p.name === item.name);
        if (prod) {
          productCosts += (Number(prod.purchasePrice) || 0) * (Number(item.quantity) || 1);
        }
      });
    }
  });

  // 3. STAFF COMMISSIONS
  let staffCommissions = commissions.reduce((sum, c) => sum + (Number(c.commissionEarned) || 0), 0);
  // Fallback: If no explicit commission records exist but invoices have staff assigned, compute accurately from commission %
  if (staffCommissions === 0 && invoices.length > 0) {
    invoices.forEach(inv => {
      if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled' && inv.staffId) {
        const sid = typeof inv.staffId === 'object' ? inv.staffId?._id : inv.staffId;
        const stMember = staff.find(s => String(s._id) === String(sid));
        const commPct = stMember ? (Number(stMember.commissionPercentage) || 10) : 10;
        const srvRev = (inv.services || []).reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
        staffCommissions += (srvRev * commPct) / 100;
      }
    });
  }
  staffCommissions = Math.round(staffCommissions);

  // 4. OPERATING EXPENSES
  const operatingExpenses = Math.round(expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));

  // 5. PROFIT & MARGIN CALCULATIONS
  const grossProfit = Math.round(netRevenue - productCosts - staffCommissions);
  const netProfit = Math.round(grossProfit - operatingExpenses);
  const profitMargin = netRevenue > 0 ? Math.round((netProfit / netRevenue) * 1000) / 10 : 0;

  // 6. EXPENSE BREAKDOWN BY CATEGORY
  const expenseBreakdown = {};
  const standardCategories = ['Rent', 'Salary', 'Electricity', 'Water', 'Products', 'Equipment', 'Maintenance', 'Marketing', 'Internet', 'Transportation', 'Other'];
  standardCategories.forEach(c => { expenseBreakdown[c] = 0; });
  expenses.forEach(e => {
    let cat = e.category || 'Other';
    if (cat === 'Utilities') cat = 'Electricity';
    if (cat === 'Inventory' || cat === 'Product Purchases') cat = 'Products';
    if (cat === 'Salaries') cat = 'Salary';
    expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + (Number(e.amount) || 0);
  });

  // 7. SERVICE PROFITABILITY BREAKDOWN
  const serviceStatsMap = {};
  services.forEach(s => {
    serviceStatsMap[String(s._id)] = {
      id: s._id,
      name: s.name,
      category: s.category,
      volume: 0,
      revenue: 0,
      productCost: 0,
      staffCommission: 0,
      netProfit: 0,
      profitMargin: 0
    };
  });

  invoices.forEach(inv => {
    if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled') {
      (inv.services || []).forEach(item => {
        let rec = serviceStatsMap[String(item.serviceId)];
        if (!rec) {
          const found = services.find(s => s.name === item.name);
          if (found) rec = serviceStatsMap[String(found._id)];
        }
        if (rec) {
          const qty = Number(item.quantity) || 1;
          const rev = (Number(item.price) || 0) * qty;
          const srvObj = services.find(s => String(s._id) === String(rec.id));
          const matCost = (Number(srvObj?.materialCost) || 0) * qty;
          const comm = (rev * 10) / 100;

          rec.volume += qty;
          rec.revenue += rev;
          rec.productCost += matCost;
          rec.staffCommission += comm;
          rec.netProfit += (rev - matCost - comm);
          rec.profitMargin = rec.revenue > 0 ? Math.round((rec.netProfit / rec.revenue) * 1000) / 10 : 0;
        }
      });
    }
  });

  const serviceProfitability = Object.values(serviceStatsMap).sort((a, b) => b.revenue - a.revenue);

  // 8. STAFF REVENUE & PERFORMANCE
  const staffStatsMap = {};
  staff.forEach(st => {
    staffStatsMap[String(st._id)] = {
      id: st._id,
      name: st.name,
      role: st.role,
      count: 0,
      revenue: 0,
      commission: 0
    };
  });

  invoices.forEach(inv => {
    if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled' && inv.staffId) {
      const sid = String(typeof inv.staffId === 'object' ? inv.staffId?._id : inv.staffId);
      if (staffStatsMap[sid]) {
        staffStatsMap[sid].count += 1;
        staffStatsMap[sid].revenue += Number(inv.finalAmount) || 0;
        const commPct = staff.find(s => String(s._id) === sid)?.commissionPercentage || 10;
        staffStatsMap[sid].commission += ((Number(inv.finalAmount) || 0) * commPct) / 100;
      }
    }
  });

  const staffRevenue = Object.values(staffStatsMap).sort((a, b) => b.revenue - a.revenue);

  // 9. MULTI-BRANCH ROLLUPS
  const branchProfitability = branches.map(br => {
    const bIdStr = String(br._id);
    const bInvoices = invoices.filter(i => String(typeof i.branchId === 'object' ? i.branchId?._id : i.branchId) === bIdStr);
    const bExpenses = expenses.filter(e => String(typeof e.branchId === 'object' ? e.branchId?._id : e.branchId) === bIdStr);
    const bAppts = appointments.filter(a => String(typeof a.branchId === 'object' ? a.branchId?._id : a.branchId) === bIdStr);
    const bStaff = staff.filter(s => String(typeof s.branchId === 'object' ? s.branchId?._id : s.branchId) === bIdStr);

    const bRev = bInvoices.reduce((sum, i) => sum + (Number(i.finalAmount) || 0), 0);
    const bExp = bExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const bProfit = bRev - bExp;
    const bMargin = bRev > 0 ? Number(((bProfit / bRev) * 100).toFixed(1)) : 0;
    const bAov = bInvoices.length > 0 ? Math.round(bRev / bInvoices.length) : 0;

    return {
      id: br._id,
      branchId: br._id,
      name: br.name,
      city: br.city || 'Main',
      revenue: bRev,
      expenses: bExp,
      profit: bProfit,
      profitMargin: bMargin,
      checkoutCount: bInvoices.length,
      appointmentsCount: bAppts.length,
      staffCount: bStaff.length,
      averageBill: bAov
    };
  }).sort((a, b) => b.revenue - a.revenue);

  branchProfitability.forEach((b, idx) => { b.rank = idx + 1; });

  // 10. COUNTS & SUMMARY METRICS
  const completedAppointments = appointments.filter(a => a.status === 'Completed');
  const counts = {
    invoiceCount: invoices.length,
    paidInvoiceCount,
    expenseCount: expenses.length,
    appointmentCount: appointments.length,
    completedAppointmentCount: completedAppointments.length,
    refundCount,
    customerCount: customers.length,
    staffCount: staff.length,
    branchCount: branches.length
  };

  return {
    horizon,
    dateRange: {
      startDate: boundsStart,
      endDate: boundsEnd
    },
    metrics: {
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
    },
    counts,
    expenseBreakdown,
    serviceProfitability,
    staffRevenue,
    branchProfitability
  };
};

/**
 * Retrieves historical trend charts (6-month trends, weekly appointment trends, customer growth)
 * calculated from live database records.
 */
const getHistoricalTrends = async ({ salonId, branchId = null }) => {
  const baseFilter = {};
  if (salonId) baseFilter.salonId = salonId;
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    baseFilter.branchId = branchId;
  }

  const now = new Date();
  const months = [];
  const monthLabels = [];

  // Generate 6 months of historical date bounds (oldest to newest)
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    months.push({ start, end, label, year: d.getFullYear(), month: d.getMonth() });
    monthLabels.push(label);
  }

  const oldestStart = months[0].start;
  const latestEnd = months[months.length - 1].end;

  const baseTenantFilter = salonId ? { salonId } : {};

  // Parallel database retrieval bounded to date horizon and tenant
  const [
    invoices,
    expenses,
    commissions,
    appointments,
    customers,
    servicesList,
    productsList,
    staffList
  ] = await Promise.all([
    models.Invoice.find({ ...baseFilter, createdAt: { $gte: oldestStart, $lte: latestEnd } }).lean(),
    models.Expense.find({ ...baseFilter, date: { $gte: oldestStart, $lte: latestEnd } }).lean(),
    models.Commission.find({ ...baseFilter, date: { $gte: oldestStart, $lte: latestEnd } }).lean(),
    models.Appointment.find({ ...baseFilter, date: { $gte: oldestStart, $lte: latestEnd } }).lean(),
    models.Customer.find(baseTenantFilter).select('_id createdAt').lean(),
    models.Service.find(baseTenantFilter).select('_id name price materialCost').lean(),
    models.Product.find(baseTenantFilter).select('_id name purchasePrice sellingPrice').lean(),
    models.Staff.find(baseTenantFilter).select('_id name commissionPercentage').lean()
  ]);

  const revenueData = [];
  const expenseData = [];
  const profitData = [];
  const customerGrowthData = [];

  months.forEach(m => {
    const mInvoices = invoices.filter(inv => {
      const rawDate = inv.createdAt || inv.date;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      return !isNaN(d.getTime()) && d >= m.start && d <= m.end;
    });

    const mExpenses = expenses.filter(exp => {
      const rawDate = exp.date || exp.createdAt;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      return !isNaN(d.getTime()) && d >= m.start && d <= m.end;
    });

    const mCommissions = commissions.filter(c => {
      const rawDate = c.date || c.createdAt;
      if (!rawDate) return false;
      const d = new Date(rawDate);
      return !isNaN(d.getTime()) && d >= m.start && d <= m.end;
    });

    const mCustomers = customers.filter(c => {
      const rawDate = c.createdAt || c.date;
      if (!rawDate) return true;
      const d = new Date(rawDate);
      return isNaN(d.getTime()) || d <= m.end;
    });

    // 1. REVENUE CALCULATIONS (Net Revenue = Gross - Discounts - Refunds)
    let grossRev = 0;
    let discounts = 0;
    let refunds = 0;

    mInvoices.forEach(inv => {
      if (inv.paymentStatus === 'Refunded' || inv.status === 'Cancelled') {
        refunds += Number(inv.finalAmount) || 0;
        return;
      }

      let invItemGross = 0;
      (inv.services || []).forEach(s => {
        invItemGross += (Number(s.price) || 0) * (Number(s.quantity) || 1);
      });
      (inv.products || []).forEach(p => {
        invItemGross += (Number(p.price) || 0) * (Number(p.quantity) || 1);
      });

      grossRev += (invItemGross || Number(inv.finalAmount) || 0);
      discounts += (Number(inv.discount) || 0);
    });

    const netRevenue = Math.max(0, grossRev - discounts - refunds);

    // 2. PRODUCT / MATERIAL COSTS
    let productCosts = 0;
    mInvoices.forEach(inv => {
      if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled') {
        (inv.services || []).forEach(item => {
          const srv = servicesList.find(s => String(s._id) === String(item.serviceId) || s.name === item.name);
          if (srv) {
            productCosts += (Number(srv.materialCost) || 0) * (Number(item.quantity) || 1);
          }
        });
        (inv.products || []).forEach(item => {
          const prod = productsList.find(p => String(p._id) === String(item.productId) || p.name === item.name);
          if (prod) {
            productCosts += (Number(prod.purchasePrice) || 0) * (Number(item.quantity) || 1);
          }
        });
      }
    });

    // 3. STAFF COMMISSIONS
    let staffCommissions = mCommissions.reduce((sum, c) => sum + (Number(c.commissionEarned) || 0), 0);
    if (staffCommissions === 0 && mInvoices.length > 0) {
      mInvoices.forEach(inv => {
        if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled' && inv.staffId) {
          const sid = typeof inv.staffId === 'object' ? inv.staffId?._id : inv.staffId;
          const stMember = staffList.find(s => String(s._id) === String(sid));
          const commPct = stMember ? (Number(stMember.commissionPercentage) || 10) : 10;
          const srvRev = (inv.services || []).reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0);
          staffCommissions += (srvRev * commPct) / 100;
        }
      });
    }
    staffCommissions = Math.round(staffCommissions);

    // 4. OPERATING EXPENSES
    const operatingExpenses = Math.round(mExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));

    // 5. AUTHORITATIVE GROSS PROFIT & NET PROFIT
    const grossProfit = Math.round(netRevenue - productCosts - staffCommissions);
    const netProfit = Math.round(grossProfit - operatingExpenses);

    revenueData.push(Math.round(netRevenue));
    expenseData.push(operatingExpenses);
    profitData.push(netProfit);
    customerGrowthData.push(mCustomers.length);
  });

  // Weekly day-of-week appointment distribution (Mon-Sun)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayApptCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  const targetDayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  appointments.forEach(a => {
    if (a.status !== 'Cancelled') {
      const rawDate = a.date || a.createdAt;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const dayName = daysOfWeek[d.getDay()];
          if (dayApptCounts[dayName] !== undefined) {
            dayApptCounts[dayName] += 1;
          }
        }
      }
    }
  });

  const appointmentTrendData = targetDayOrder.map(d => dayApptCounts[d]);

  // Service distribution from invoices and appointments
  const serviceCounts = {};
  invoices.forEach(inv => {
    if (inv.paymentStatus !== 'Refunded' && inv.status !== 'Cancelled') {
      (inv.services || []).forEach(s => {
        const name = s.name || 'Service';
        serviceCounts[name] = (serviceCounts[name] || 0) + (Number(s.quantity) || 1);
      });
    }
  });

  appointments.forEach(appt => {
    if (appt.status !== 'Cancelled') {
      (appt.services || []).forEach(s => {
        const name = s.name || 'Service';
        serviceCounts[name] = (serviceCounts[name] || 0) + 1;
      });
    }
  });

  // Fallback to catalog services if no usage yet
  if (Object.keys(serviceCounts).length === 0 && servicesList.length > 0) {
    servicesList.slice(0, 5).forEach(s => {
      serviceCounts[s.name] = 0;
    });
  }

  const popularServices = Object.entries(serviceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const popularServicesData = popularServices.map(p => p.count);
  const popularServicesLabels = popularServices.map(p => p.name);

  return {
    monthLabels,
    revenueExpenseChartData: {
      months: monthLabels,
      revenues: revenueData,
      expenses: expenseData
    },
    monthlyProfitChartData: {
      months: monthLabels,
      profits: profitData
    },
    appointmentTrendChartData: {
      days: targetDayOrder,
      appointments: appointmentTrendData
    },
    customerGrowthChartData: {
      months: monthLabels,
      customers: customerGrowthData
    },
    popularServicesData: {
      labels: popularServicesLabels,
      values: popularServicesData
    }
  };
};

/**
 * Computes live dashboard stats for both Today and Current Month in a single call.
 */
const getDashboardStats = async ({ salonId, branchId = null }) => {
  const baseFilter = {};
  if (salonId) baseFilter.salonId = salonId;
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    baseFilter.branchId = branchId;
  }

  // Parallel retrieval of today summary, monthly summary, historical trends, and counts
  const [
    todaySummary,
    monthSummary,
    trends,
    activeStaffCount,
    activeMembershipsCount,
    lowStockProducts
  ] = await Promise.all([
    getFinancialSummary({ salonId, branchId, horizon: 'today' }),
    getFinancialSummary({ salonId, branchId, horizon: 'this_month' }),
    getHistoricalTrends({ salonId, branchId }),
    models.Staff.countDocuments({ ...baseFilter, status: { $ne: 'Inactive' } }),
    models.Customer.countDocuments({ ...baseFilter, membershipLevel: { $ne: 'None' } }),
    models.Product.countDocuments({
      ...baseFilter,
      $expr: { $lte: ['$quantity', { $ifNull: ['$lowStockThreshold', 5] }] }
    })
  ]);

  return {
    today: {
      revenue: todaySummary.metrics.netRevenue,
      expenses: todaySummary.metrics.operatingExpenses,
      profit: todaySummary.metrics.netProfit,
      appointments: todaySummary.counts.appointmentCount,
      completedAppointments: todaySummary.counts.completedAppointmentCount,
      invoices: todaySummary.counts.paidInvoiceCount
    },
    monthly: {
      revenue: monthSummary.metrics.netRevenue,
      expenses: monthSummary.metrics.operatingExpenses,
      productCosts: monthSummary.metrics.productCosts,
      commissions: monthSummary.metrics.staffCommissions,
      netProfit: monthSummary.metrics.netProfit,
      profitMargin: monthSummary.metrics.profitMargin,
      appointments: monthSummary.counts.appointmentCount,
      completedAppointments: monthSummary.counts.completedAppointmentCount,
      invoices: monthSummary.counts.paidInvoiceCount
    },
    totalCustomers: monthSummary.counts.customerCount,
    activeStaffCount,
    activeMembershipsCount,
    lowStockAlertsCount: lowStockProducts,
    trends
  };
};

module.exports = {
  getDateRangeBounds,
  buildDateFilter,
  getFinancialSummary,
  getHistoricalTrends,
  getDashboardStats
};
