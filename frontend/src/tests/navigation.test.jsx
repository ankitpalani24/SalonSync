import { describe, test, expect } from 'vitest';

describe('Sidebar Categorized Navigation Filtering Tests', () => {

  const PERMISSIONS = {
    APPOINTMENTS_VIEW: 'appointments.view',
    CUSTOMERS_VIEW: 'customers.view',
    INVENTORY_VIEW: 'inventory.view',
    BILLING_VIEW: 'billing.view',
    STAFF_VIEW: 'staff.view',
    REPORTS_VIEW: 'reports.view'
  };

  const ROLE_PERMISSIONS = {
    SUPER_ADMIN: ['*'],
    SALON_OWNER: ['*'],
    SALON_MANAGER: [
      PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.APPOINTMENTS_VIEW,
      PERMISSIONS.BILLING_VIEW, PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.STAFF_VIEW, PERMISSIONS.REPORTS_VIEW
    ],
    STAFF: [
      PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.APPOINTMENTS_VIEW,
      PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.STAFF_VIEW
    ],
    CLIENT: [
      PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.APPOINTMENTS_VIEW,
      PERMISSIONS.BILLING_VIEW
    ]
  };

  const menuSections = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Overview', permission: null },
        { id: 'appointments', label: 'Calendar Bookings', permission: PERMISSIONS.APPOINTMENTS_VIEW },
        { id: 'customers', label: 'Customer CRM', permission: PERMISSIONS.CUSTOMERS_VIEW },
        { id: 'services', label: 'Services & Packages', permission: PERMISSIONS.INVENTORY_VIEW },
        { id: 'inventory', label: 'Inventory & Stock', permission: PERMISSIONS.INVENTORY_VIEW },
      ]
    },
    {
      title: 'BUSINESS',
      items: [
        { id: 'billing', label: 'POS Billing', permission: PERMISSIONS.BILLING_VIEW },
        { id: 'staff', label: 'Staff & Roster', permission: PERMISSIONS.STAFF_VIEW },
        { id: 'analytics', label: 'BI Analytics', permission: PERMISSIONS.REPORTS_VIEW },
      ]
    },
    {
      title: 'GROWTH',
      items: [
        { id: 'marketing', label: 'Marketing Auto', roles: ['SALON_OWNER', 'FRANCHISE_OWNER'] },
      ]
    },
    {
      title: 'ENTERPRISE',
      items: [
        { id: 'super-admin', label: 'Super Admin', roles: ['SUPER_ADMIN'] }
      ]
    }
  ];

  const filterVisibleItems = (role) => {
    const userPerms = ROLE_PERMISSIONS[role] || [];
    const hasPerm = (p) => userPerms.includes('*') || userPerms.includes(p);

    const visible = [];
    for (const section of menuSections) {
      for (const item of section.items) {
        if (item.roles && !item.roles.includes(role)) continue;
        if (item.permission && !hasPerm(item.permission)) continue;
        visible.push(item.id);
      }
    }
    return visible;
  };

  test('SALON_OWNER sees all operations, business, and marketing items but NOT super-admin', () => {
    const items = filterVisibleItems('SALON_OWNER');
    expect(items).toContain('dashboard');
    expect(items).toContain('appointments');
    expect(items).toContain('customers');
    expect(items).toContain('billing');
    expect(items).toContain('staff');
    expect(items).toContain('analytics');
    expect(items).toContain('marketing');
    expect(items).not.toContain('super-admin');
  });

  test('STAFF user does NOT see POS Billing, BI Analytics, Marketing, or Super Admin', () => {
    const items = filterVisibleItems('STAFF');
    expect(items).toContain('dashboard');
    expect(items).toContain('appointments');
    expect(items).toContain('customers');
    expect(items).toContain('services');
    expect(items).toContain('staff');

    expect(items).not.toContain('billing');
    expect(items).not.toContain('analytics');
    expect(items).not.toContain('marketing');
    expect(items).not.toContain('super-admin');
  });

  test('SUPER_ADMIN user sees super-admin section', () => {
    const items = filterVisibleItems('SUPER_ADMIN');
    expect(items).toContain('super-admin');
  });

});
