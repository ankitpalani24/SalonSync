import { describe, test, expect } from 'vitest';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../context/AppContext';

describe('Frontend Permission Matrix Tests', () => {

  const hasPermissionCheck = (userRole, requiredPerm) => {
    if (!userRole) return false;
    const perms = ROLE_PERMISSIONS[userRole] || [];
    if (userRole === 'SUPER_ADMIN' || perms.includes('*')) return true;
    return perms.includes(requiredPerm);
  };

  test('SUPER_ADMIN role has access to all UI features', () => {
    expect(hasPermissionCheck('SUPER_ADMIN', PERMISSIONS.CUSTOMERS_DELETE)).toBe(true);
    expect(hasPermissionCheck('SUPER_ADMIN', PERMISSIONS.STAFF_MANAGE)).toBe(true);
    expect(hasPermissionCheck('SUPER_ADMIN', PERMISSIONS.REPORTS_VIEW)).toBe(true);
  });

  test('SALON_OWNER role has access to all standard UI features', () => {
    expect(hasPermissionCheck('SALON_OWNER', PERMISSIONS.CUSTOMERS_DELETE)).toBe(true);
    expect(hasPermissionCheck('SALON_OWNER', PERMISSIONS.STAFF_MANAGE)).toBe(true);
    expect(hasPermissionCheck('SALON_OWNER', PERMISSIONS.REPORTS_VIEW)).toBe(true);
  });

  test('SALON_MANAGER role lacks customer delete permission in UI', () => {
    expect(hasPermissionCheck('SALON_MANAGER', PERMISSIONS.CUSTOMERS_VIEW)).toBe(true);
    expect(hasPermissionCheck('SALON_MANAGER', PERMISSIONS.CUSTOMERS_CREATE)).toBe(true);
    expect(hasPermissionCheck('SALON_MANAGER', PERMISSIONS.CUSTOMERS_DELETE)).toBe(false);
  });

  test('STAFF role cannot access staff management, billing creation, or BI analytics in UI', () => {
    expect(hasPermissionCheck('STAFF', PERMISSIONS.STAFF_VIEW)).toBe(true);
    expect(hasPermissionCheck('STAFF', PERMISSIONS.STAFF_MANAGE)).toBe(false);
    expect(hasPermissionCheck('STAFF', PERMISSIONS.BILLING_CREATE)).toBe(false);
    expect(hasPermissionCheck('STAFF', PERMISSIONS.REPORTS_VIEW)).toBe(false);
  });

  test('CLIENT role can view appointments and billing but cannot manage inventory or staff', () => {
    expect(hasPermissionCheck('CLIENT', PERMISSIONS.APPOINTMENTS_VIEW)).toBe(true);
    expect(hasPermissionCheck('CLIENT', PERMISSIONS.BILLING_VIEW)).toBe(true);
    expect(hasPermissionCheck('CLIENT', PERMISSIONS.INVENTORY_EDIT)).toBe(false);
    expect(hasPermissionCheck('CLIENT', PERMISSIONS.STAFF_MANAGE)).toBe(false);
  });

});
