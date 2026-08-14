// ──────────────────────────────────────────────────────────────
// SalonSync Central SaaS Subscription & Feature Configuration (Frontend)
// ──────────────────────────────────────────────────────────────

export const PLANS = {
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE'
};

export const PLAN_LIMITS = {
  STARTER: {
    name: 'Starter',
    maxBranches: 1,
    maxStaff: 5,
    maxAppointmentsPerMonth: 200,
    priceMonthly: 1999,
    priceYearly: 19990,
    description: 'Perfect for single-location boutique salons getting started'
  },
  PROFESSIONAL: {
    name: 'Professional',
    maxBranches: 1,
    maxStaff: 15,
    maxAppointmentsPerMonth: 1000,
    priceMonthly: 4999,
    priceYearly: 49990,
    description: 'Ideal for growing salons with loyalty rewards & WhatsApp marketing'
  },
  ENTERPRISE: {
    name: 'Enterprise',
    maxBranches: 999,
    maxStaff: 999,
    maxAppointmentsPerMonth: 99999,
    priceMonthly: 9999,
    priceYearly: 99990,
    description: 'Built for multi-branch salon chains & franchise networks'
  }
};

export const PLAN_FEATURES = {
  STARTER: [
    'single_salon',
    'appointments',
    'customers',
    'staff',
    'billing',
    'basic_reports'
  ],
  PROFESSIONAL: [
    'single_salon',
    'appointments',
    'customers',
    'staff',
    'billing',
    'basic_reports',
    'inventory',
    'loyalty',
    'memberships',
    'advanced_analytics',
    'whatsapp_automation',
    'health_score'
  ],
  ENTERPRISE: [
    '*' // Full SaaS access wildcard
  ]
};

export const FEATURE_CATALOG = [
  { key: 'appointments', name: 'Calendar Appointments & Booking', category: 'Operations', starter: true, pro: true, enterprise: true },
  { key: 'customers', name: 'Customer CRM & Profile Files', category: 'Operations', starter: true, pro: true, enterprise: true },
  { key: 'staff', name: 'Staff Roster & Commission Calculator', category: 'Operations', starter: true, pro: true, enterprise: true },
  { key: 'billing', name: 'POS Invoice Checkout', category: 'Operations', starter: true, pro: true, enterprise: true },
  { key: 'basic_reports', name: 'Basic Revenue Summary Reports', category: 'Analytics', starter: true, pro: true, enterprise: true },
  
  { key: 'inventory', name: 'Inventory & Stock Reorder Tracking', category: 'Management', starter: false, pro: true, enterprise: true },
  { key: 'loyalty', name: 'Loyalty Rewards Program', category: 'Growth', starter: false, pro: true, enterprise: true },
  { key: 'memberships', name: 'Salon Membership Plans', category: 'Growth', starter: false, pro: true, enterprise: true },
  { key: 'whatsapp_automation', name: 'WhatsApp Automated Reminders', category: 'Growth', starter: false, pro: true, enterprise: true },
  { key: 'advanced_analytics', name: 'Advanced BI Analytics & Expense Ledger', category: 'Analytics', starter: false, pro: true, enterprise: true },
  { key: 'health_score', name: 'Salon Health Score Diagnostic (0-100)', category: 'Analytics', starter: false, pro: true, enterprise: true },

  { key: 'multi_branch', name: 'Multi-Branch Salon Support', category: 'Enterprise', starter: false, pro: false, enterprise: true },
  { key: 'franchise_analytics', name: 'Franchise Multi-Branch Rollup Hub', category: 'Enterprise', starter: false, pro: false, enterprise: true },
  { key: 'central_inventory', name: 'Central Inventory Consumption Tracking', category: 'Enterprise', starter: false, pro: false, enterprise: true },
  { key: 'audit_logs', name: 'Security & Business Audit Logs', category: 'Enterprise', starter: false, pro: false, enterprise: true },
  { key: 'advanced_permissions', name: 'Granular Role Permission Matrix', category: 'Enterprise', starter: false, pro: false, enterprise: true }
];

export const hasPlanFeature = (plan, featureKey) => {
  if (!plan) return false;
  const features = PLAN_FEATURES[plan] || [];
  if (features.includes('*')) return true;
  return features.includes(featureKey);
};
