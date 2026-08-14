// ──────────────────────────────────────────────────────────────
// SalonSync Central SaaS Subscription & Feature Configuration
// ──────────────────────────────────────────────────────────────

const PLANS = {
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE'
};

const PLAN_LIMITS = {
  STARTER: {
    maxBranches: 1,
    maxStaff: 5,
    maxAppointmentsPerMonth: 200,
    priceMonthly: 1999,
    priceYearly: 19990
  },
  PROFESSIONAL: {
    maxBranches: 1,
    maxStaff: 15,
    maxAppointmentsPerMonth: 1000,
    priceMonthly: 4999,
    priceYearly: 49990
  },
  ENTERPRISE: {
    maxBranches: 999,
    maxStaff: 999,
    maxAppointmentsPerMonth: 99999,
    priceMonthly: 9999,
    priceYearly: 99990
  }
};

const PLAN_FEATURES = {
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
    '*' // Full SaaS features access wildcard
  ]
};

/**
 * Evaluates whether a given plan tier includes a feature
 * @param {string} plan - Subscription plan ('STARTER', 'PROFESSIONAL', 'ENTERPRISE')
 * @param {string} featureKey - Feature key (e.g. 'inventory', 'franchise_analytics')
 * @returns {boolean}
 */
const hasPlanFeature = (plan, featureKey) => {
  if (!plan) return false;
  const features = PLAN_FEATURES[plan] || [];
  if (features.includes('*')) return true;
  return features.includes(featureKey);
};

module.exports = {
  PLANS,
  PLAN_LIMITS,
  PLAN_FEATURES,
  hasPlanFeature
};
