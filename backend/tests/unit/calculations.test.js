describe('SalonSync Financial & Business Math Unit Tests', () => {

  describe('Loyalty Points Rules', () => {
    // Rule: ₹100 spent = 1 loyalty point earned
    const calculateEarnedPoints = (transactionAmount) => Math.floor(transactionAmount / 100);

    test('calculates correct loyalty points for spent amount', () => {
      expect(calculateEarnedPoints(1500)).toBe(15);
      expect(calculateEarnedPoints(99)).toBe(0);
      expect(calculateEarnedPoints(100)).toBe(1);
      expect(calculateEarnedPoints(2550)).toBe(25);
    });

    // Rule: 1 point = ₹1 discount on billing
    const calculateRedemptionDiscount = (requestedPoints, availablePoints) => {
      const actualRedeemed = Math.min(Math.max(0, requestedPoints), Math.max(0, availablePoints));
      return { actualRedeemed, discountAmount: actualRedeemed };
    };

    test('correctly caps redeemed points to available balance', () => {
      expect(calculateRedemptionDiscount(50, 100)).toEqual({ actualRedeemed: 50, discountAmount: 50 });
      expect(calculateRedemptionDiscount(150, 100)).toEqual({ actualRedeemed: 100, discountAmount: 100 });
      expect(calculateRedemptionDiscount(-20, 100)).toEqual({ actualRedeemed: 0, discountAmount: 0 });
    });
  });

  describe('Staff Commission Calculation', () => {
    // Rule: Staff earns commission on service revenue generated
    const calculateStaffCommission = (serviceRevenue, commissionPercentage) => {
      const commRate = Math.max(0, Number(commissionPercentage) || 0);
      return Math.round(serviceRevenue * (commRate / 100)) || 0;
    };

    test('calculates staff commission accurately', () => {
      expect(calculateStaffCommission(2000, 15)).toBe(300);
      expect(calculateStaffCommission(1500, 10)).toBe(150);
      expect(calculateStaffCommission(500, 0)).toBe(0);
    });
  });

  describe('Profit & Loss Analytics Engine', () => {
    // Rule: Net Profit = Total Revenue - Material Cost - Expenses
    const calculateNetProfit = (revenue, materialCost, expenses) => {
      return revenue - materialCost - expenses;
    };

    test('calculates net profit correctly', () => {
      // Example: ₹50,000 revenue - ₹8,000 material cost - ₹12,000 expenses = ₹30,000 profit
      expect(calculateNetProfit(50000, 8000, 12000)).toBe(30000);
      // Example: Loss case
      expect(calculateNetProfit(10000, 3000, 15000)).toBe(-8000);
    });
  });

});
