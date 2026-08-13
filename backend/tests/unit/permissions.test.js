const { PERMISSIONS, ROLE_PERMISSIONS, hasPermission } = require('../../src/config/permissions');

describe('PBAC Permission Matrix Unit Tests', () => {

  describe('SUPER_ADMIN Role', () => {
    test('SUPER_ADMIN has wildcard permission allowing any action', () => {
      expect(hasPermission('SUPER_ADMIN', PERMISSIONS.CUSTOMERS_DELETE)).toBe(true);
      expect(hasPermission('SUPER_ADMIN', PERMISSIONS.STAFF_MANAGE)).toBe(true);
      expect(hasPermission('SUPER_ADMIN', 'any.arbitrary.permission')).toBe(true);
    });
  });

  describe('SALON_OWNER & FRANCHISE_OWNER Roles', () => {
    test('SALON_OWNER has all standard domain permissions', () => {
      expect(hasPermission('SALON_OWNER', PERMISSIONS.CUSTOMERS_VIEW)).toBe(true);
      expect(hasPermission('SALON_OWNER', PERMISSIONS.CUSTOMERS_DELETE)).toBe(true);
      expect(hasPermission('SALON_OWNER', PERMISSIONS.BILLING_CREATE)).toBe(true);
      expect(hasPermission('SALON_OWNER', PERMISSIONS.STAFF_MANAGE)).toBe(true);
      expect(hasPermission('SALON_OWNER', PERMISSIONS.REPORTS_VIEW)).toBe(true);
    });

    test('FRANCHISE_OWNER has all standard domain permissions', () => {
      expect(hasPermission('FRANCHISE_OWNER', PERMISSIONS.CUSTOMERS_DELETE)).toBe(true);
      expect(hasPermission('FRANCHISE_OWNER', PERMISSIONS.STAFF_MANAGE)).toBe(true);
      expect(hasPermission('FRANCHISE_OWNER', PERMISSIONS.INVENTORY_EDIT)).toBe(true);
    });
  });

  describe('SALON_MANAGER Role', () => {
    test('SALON_MANAGER has operational permissions but lacks customer deletion', () => {
      expect(hasPermission('SALON_MANAGER', PERMISSIONS.CUSTOMERS_VIEW)).toBe(true);
      expect(hasPermission('SALON_MANAGER', PERMISSIONS.CUSTOMERS_CREATE)).toBe(true);
      expect(hasPermission('SALON_MANAGER', PERMISSIONS.CUSTOMERS_EDIT)).toBe(true);
      expect(hasPermission('SALON_MANAGER', PERMISSIONS.CUSTOMERS_DELETE)).toBe(false);
      expect(hasPermission('SALON_MANAGER', PERMISSIONS.STAFF_MANAGE)).toBe(true);
      expect(hasPermission('SALON_MANAGER', PERMISSIONS.REPORTS_VIEW)).toBe(true);
    });
  });

  describe('STAFF Role', () => {
    test('STAFF has limited view & booking permissions', () => {
      expect(hasPermission('STAFF', PERMISSIONS.CUSTOMERS_VIEW)).toBe(true);
      expect(hasPermission('STAFF', PERMISSIONS.CUSTOMERS_CREATE)).toBe(true);
      expect(hasPermission('STAFF', PERMISSIONS.CUSTOMERS_DELETE)).toBe(false);
      expect(hasPermission('STAFF', PERMISSIONS.STAFF_MANAGE)).toBe(false);
      expect(hasPermission('STAFF', PERMISSIONS.BILLING_CREATE)).toBe(false);
      expect(hasPermission('STAFF', PERMISSIONS.REPORTS_VIEW)).toBe(false);
    });
  });

  describe('CLIENT Role', () => {
    test('CLIENT can view/create appointments and view invoices but cannot manage staff or inventory', () => {
      expect(hasPermission('CLIENT', PERMISSIONS.APPOINTMENTS_VIEW)).toBe(true);
      expect(hasPermission('CLIENT', PERMISSIONS.APPOINTMENTS_CREATE)).toBe(true);
      expect(hasPermission('CLIENT', PERMISSIONS.APPOINTMENTS_CANCEL)).toBe(true);
      expect(hasPermission('CLIENT', PERMISSIONS.BILLING_VIEW)).toBe(true);
      expect(hasPermission('CLIENT', PERMISSIONS.CUSTOMERS_DELETE)).toBe(false);
      expect(hasPermission('CLIENT', PERMISSIONS.STAFF_MANAGE)).toBe(false);
      expect(hasPermission('CLIENT', PERMISSIONS.INVENTORY_EDIT)).toBe(false);
    });
  });

  describe('Edge cases & Invalid Inputs', () => {
    test('returns false for null or undefined roles', () => {
      expect(hasPermission(null, PERMISSIONS.CUSTOMERS_VIEW)).toBe(false);
      expect(hasPermission(undefined, PERMISSIONS.CUSTOMERS_VIEW)).toBe(false);
      expect(hasPermission('', PERMISSIONS.CUSTOMERS_VIEW)).toBe(false);
    });

    test('returns false for non-existent roles', () => {
      expect(hasPermission('UNKNOWN_ROLE', PERMISSIONS.CUSTOMERS_VIEW)).toBe(false);
    });
  });

});
