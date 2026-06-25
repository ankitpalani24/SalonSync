import React from 'react';
import { 
  TrendingUp, Users, Calendar, AlertTriangle, 
  CreditCard, Sparkles, UserPlus, FileText, ArrowUpRight 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RevenueLineChart, ProfitBarChart, ServiceShareDonut } from '../components/DashboardCharts';

const Dashboard = ({ setActivePage }) => {
  const { currentUser, currentBranch, tenantFilter, db, updateAppointmentStatus } = useApp();

  // Filter entities by tenant (salonId) and active branch
  const salonInvoices = tenantFilter(db.invoices);
  const salonAppointments = tenantFilter(db.appointments);
  const salonExpenses = tenantFilter(db.expenses);
  const salonCustomers = tenantFilter(db.customers);
  const salonProducts = tenantFilter(db.products);

  // Branch filter (if not checking all)
  const branchInvoices = salonInvoices.filter(i => i.branchId === currentBranch?._id);
  const branchAppointments = salonAppointments.filter(a => a.branchId === currentBranch?._id);
  const branchExpenses = salonExpenses.filter(e => e.branchId === currentBranch?._id);
  
  // Date ranges
  const today = new Date().toLocaleDateString('en-CA');
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startOfMonthStr = startOfMonth.toLocaleDateString('en-CA');

  // ----------------------------------------------------
  // CALCULATIONS (PROFIT & LOSS ENGINE)
  // ----------------------------------------------------
  
  // Today's Revenue
  const todayRevenue = branchInvoices
    .filter(i => i.createdAt.startsWith(today))
    .reduce((sum, i) => sum + i.finalAmount, 0);

  // Monthly Revenue
  const monthlyRevenue = branchInvoices
    .filter(i => i.createdAt >= startOfMonthStr)
    .reduce((sum, i) => sum + i.finalAmount, 0);

  // Today's Expenses
  const todayExpenses = branchExpenses
    .filter(e => e.date === today)
    .reduce((sum, e) => sum + e.amount, 0);

  // Monthly Expenses
  const monthlyExpenses = branchExpenses
    .filter(e => e.date >= startOfMonthStr)
    .reduce((sum, e) => sum + e.amount, 0);

  // Product Inventory material costs from monthly invoices
  let monthlyMaterialCost = 0;
  branchInvoices.forEach(inv => {
    inv.services.forEach(item => {
      const originalServ = db.services.find(s => s._id === item.serviceId);
      if (originalServ) {
        monthlyMaterialCost += (originalServ.materialCost || 0) * (item.quantity || 1);
      }
    });
  });

  const netProfit = monthlyRevenue - monthlyExpenses - monthlyMaterialCost;

  // Stock Warnings
  const lowStockAlerts = salonProducts.filter(p => p.quantity <= p.lowStockThreshold);

  // Active Memberships
  const activeMemberships = salonCustomers.filter(c => c.membershipLevel !== 'None');

  // Widget Lists
  const upcomingAppointments = branchAppointments
    .filter(a => a.status !== 'Completed' && a.status !== 'Cancelled')
    .slice(0, 5);

  const recentPayments = branchInvoices.slice(-4).reverse();
  const lowStockProductsList = lowStockAlerts.slice(0, 4);

  return (
    <div className="page-container animated-fade-in">
      {/* Header Info */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)' }}>Dashboard Overview</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time financial analytics and operational desk logs.
          </p>
        </div>
        <div className="flex-mobile-column" style={{ gap: '0.75rem' }}>
          {['Salon Owner', 'Manager', 'Receptionist'].includes(currentUser.role) && (
            <button onClick={() => setActivePage('billing')} className="gold-btn">
              <CreditCard size={16} /> Open POS Checkout
            </button>
          )}
          <button onClick={() => setActivePage('appointments')} className="outline-btn">
            <Calendar size={16} /> Book Appointment
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Card 1 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Today's Revenue</span>
            <TrendingUp size={16} style={{ color: 'var(--gold-primary)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', color: 'var(--gold-primary)' }}>₹{todayRevenue.toLocaleString()}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Updated live</p>
        </div>

        {/* Card 2 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Monthly Revenue</span>
            <FileText size={16} style={{ color: 'var(--gold-primary)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', color: 'var(--text-primary)' }}>₹{monthlyRevenue.toLocaleString()}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Target: ₹3,00,000</p>
        </div>

        {/* Card 3 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Monthly Expenses</span>
            <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', color: 'var(--text-primary)' }}>₹{monthlyExpenses.toLocaleString()}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Salary, Rent & Utilities</p>
        </div>

        {/* Card 4 */}
        <div className="glass-card gold-border" style={{ background: 'var(--gold-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--gold-primary)' }}>Net Profit (June)</span>
            <Sparkles size={16} style={{ color: 'var(--gold-primary)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', color: 'var(--gold-primary)' }}>₹{netProfit.toLocaleString()}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Material Deductions Incurred</p>
        </div>

        {/* Card 5 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Active Members</span>
            <Users size={16} style={{ color: 'var(--accent-green)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', color: 'var(--text-primary)' }}>{activeMemberships.length}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Silver, Gold & Platinum</p>
        </div>

        {/* Card 6 */}
        <div className="glass-card" style={{ border: lowStockAlerts.length > 0 ? '1px solid rgba(231,76,60,0.3)' : '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Low Stock Items</span>
            <AlertTriangle size={16} style={{ color: lowStockAlerts.length > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }} />
          </div>
          <h3 style={{ fontSize: '1.65rem', color: lowStockAlerts.length > 0 ? 'var(--accent-red)' : '#fff' }}>
            {lowStockAlerts.length}
          </h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Needs restocking</p>
        </div>
      </div>

      {/* Analytics Charts Panel */}
      <div className="grid-split-2-1" style={{ marginBottom: '2rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Revenue Trends (Last 6 Months)</h3>
          <RevenueLineChart />
        </div>
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Service Category Share</h3>
          <ServiceShareDonut />
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid-split-1-5-1">
        
        {/* Upcoming Appointments */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Upcoming Appointments</h3>
            <button onClick={() => setActivePage('appointments')} style={{ background: 'transparent', border: 'none', color: 'var(--gold-primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View Schedule <ArrowUpRight size={12} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {upcomingAppointments.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No upcoming appointments today.</p>
            ) : (
              upcomingAppointments.map((appt) => {
                const customer = db.customers.find(c => c._id === appt.customerId);
                const staff = db.staff.find(s => s._id === appt.staffId);
                return (
                  <div key={appt._id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px'
                  }}>
                    <div>
                      <h5 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>{customer ? customer.name : 'Walk-in Client'}</h5>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {appt.services.map(s => s.name).join(', ')} • Stylist: {staff ? staff.name : 'Any'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--gold-primary)', fontWeight: '600' }}>{appt.time}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{appt.date}</p>
                      </div>
                      <span className={`badge ${appt.status.toLowerCase().replace(' ', '')}`}>{appt.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Inventory & Expense Recaps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Low Stock Alerts */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Low Stock Inventory Warnings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lowStockProductsList.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>All product items fully stocked.</p>
              ) : (
                lowStockProductsList.map((prod) => (
                  <div key={prod._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <div>
                      <h6 style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '500' }}>{prod.name}</h6>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SKU: {prod.sku}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--accent-red)', fontWeight: 'bold', fontSize: '0.85rem' }}>{prod.quantity} units</span>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Threshold: {prod.lowStockThreshold}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Recent Checkouts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentPayments.map((inv) => {
                const client = db.customers.find(c => c._id === inv.customerId);
                return (
                  <div key={inv._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{client ? client.name : 'Walk-in Client'}</span>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{inv.invoiceNumber} • {inv.paymentMethod}</p>
                    </div>
                    <span style={{ color: 'var(--gold-primary)', fontWeight: '600' }}>₹{inv.finalAmount}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
