// ──────────────────────────────────────────────────────────────
// SalonSync Granular Permission-Based Access Control (PBAC/RBAC)
// ──────────────────────────────────────────────────────────────

const PERMISSIONS = {
  // Customer CRM
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_EDIT: 'customers.edit',
  CUSTOMERS_DELETE: 'customers.delete',

  // Appointments
  APPOINTMENTS_VIEW: 'appointments.view',
  APPOINTMENTS_CREATE: 'appointments.create',
  APPOINTMENTS_EDIT: 'appointments.edit',
  APPOINTMENTS_CANCEL: 'appointments.cancel',

  // POS & Billing
  BILLING_VIEW: 'billing.view',
  BILLING_CREATE: 'billing.create',
  BILLING_REFUND: 'billing.refund',

  // Inventory & Stock
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_EDIT: 'inventory.edit',

  // Staff & HR
  STAFF_VIEW: 'staff.view',
  STAFF_MANAGE: 'staff.manage',

  // Reports & Analytics
  REPORTS_VIEW: 'reports.view'
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'], // Full platform access wildcard

  FRANCHISE_OWNER: [...ALL_PERMISSIONS],

  SALON_OWNER: [...ALL_PERMISSIONS],

  SALON_MANAGER: [
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_EDIT,
    PERMISSIONS.APPOINTMENTS_CANCEL,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_EDIT,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.REPORTS_VIEW
  ],

  STAFF: [
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_EDIT,
    PERMISSIONS.APPOINTMENTS_CANCEL,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.STAFF_VIEW
  ],

  CLIENT: [
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_CANCEL,
    PERMISSIONS.BILLING_VIEW
  ]
};

/**
 * Checks if a given role has a specific permission
 * @param {string} role - User role (e.g. 'STAFF', 'SALON_OWNER')
 * @param {string} permission - Permission string (e.g. 'customers.delete')
 * @returns {boolean}
 */
const hasPermission = (role, permission) => {
  if (!role) return false;
  const userPerms = ROLE_PERMISSIONS[role] || [];
  if (userPerms.includes('*')) return true;
  return userPerms.includes(permission);
};

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission
};
