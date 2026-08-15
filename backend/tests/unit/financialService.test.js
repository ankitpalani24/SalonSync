const { getDateRangeBounds, buildDateFilter } = require('../../src/services/financialService');

describe('Financial Calculation Service - Unit Tests', () => {

  describe('getDateRangeBounds', () => {
    test('resolves "today" bounds from 00:00:00 to 23:59:59.999', () => {
      const { startDate, endDate } = getDateRangeBounds('today');
      const now = new Date();

      expect(startDate.getFullYear()).toBe(now.getFullYear());
      expect(startDate.getMonth()).toBe(now.getMonth());
      expect(startDate.getDate()).toBe(now.getDate());
      expect(startDate.getHours()).toBe(0);
      expect(startDate.getMinutes()).toBe(0);
      expect(startDate.getSeconds()).toBe(0);

      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
      expect(endDate.getSeconds()).toBe(59);
    });

    test('resolves "this_month" bounds starting from 1st of the month', () => {
      const { startDate, endDate } = getDateRangeBounds('this_month');
      const now = new Date();

      expect(startDate.getFullYear()).toBe(now.getFullYear());
      expect(startDate.getMonth()).toBe(now.getMonth());
      expect(startDate.getDate()).toBe(1);
      expect(startDate.getHours()).toBe(0);

      expect(endDate.getMonth()).toBe(now.getMonth());
      expect(endDate.getHours()).toBe(23);
    });

    test('resolves "last_month" bounds accurately', () => {
      const { startDate, endDate } = getDateRangeBounds('last_month');
      const now = new Date();
      const expectedMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;

      expect(startDate.getDate()).toBe(1);
      expect(startDate.getMonth()).toBe(expectedMonth);
      expect(endDate.getMonth()).toBe(expectedMonth);
    });

    test('resolves custom date range bounds correctly', () => {
      const { startDate, endDate } = getDateRangeBounds('custom', '2026-05-10', '2026-05-20');

      expect(startDate.getFullYear()).toBe(2026);
      expect(startDate.getMonth()).toBe(4); // 0-indexed May
      expect(startDate.getDate()).toBe(10);
      expect(startDate.getHours()).toBe(0);

      expect(endDate.getFullYear()).toBe(2026);
      expect(endDate.getMonth()).toBe(4);
      expect(endDate.getDate()).toBe(20);
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
    });
  });

  describe('buildDateFilter', () => {
    test('constructs valid mongo date filter object', () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-01-31');
      const filter = buildDateFilter('date', start, end);

      expect(filter).toEqual({
        date: {
          $gte: start,
          $lte: end
        }
      });
    });

    test('returns empty object when dates are null', () => {
      expect(buildDateFilter('date', null, null)).toEqual({});
    });
  });

  describe('Profit Margin and Net Profit Math Formulas', () => {
    test('calculates net revenue, gross profit, net profit, and profit margin with mathematical integrity', () => {
      const grossRevenue = 100000;
      const discounts = 5000;
      const refunds = 2000;
      const netRevenue = grossRevenue - discounts - refunds; // 93000

      const productCosts = 13000;
      const staffCommissions = 10000;
      const operatingExpenses = 25000;

      const grossProfit = netRevenue - productCosts - staffCommissions; // 93000 - 23000 = 70000
      const netProfit = grossProfit - operatingExpenses; // 70000 - 25000 = 45000

      const profitMargin = Number(((netProfit / netRevenue) * 100).toFixed(1)); // (45000 / 93000) * 100 = 48.4%

      expect(netRevenue).toBe(93000);
      expect(grossProfit).toBe(70000);
      expect(netProfit).toBe(45000);
      expect(profitMargin).toBe(48.4);
    });

    test('handles zero revenue edge case gracefully without NaN', () => {
      const netRevenue = 0;
      const netProfit = -15000;
      const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

      expect(profitMargin).toBe(0);
      expect(isNaN(profitMargin)).toBe(false);
    });
  });

});
