/**
 * Unit tests for number formatting, currency formatting, count-up math, and edge cases.
 */

const formatCurrency = (value, options = {}) => {
  const { decimals = 0, showSymbol = true } = options;
  if (value === null || value === undefined || value === '') {
    return showSymbol ? '₹0' : '0';
  }
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return showSymbol ? '₹0' : '0';

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const formatted = absNum.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  const prefix = isNegative ? '-' : '';
  const symbol = showSymbol ? '₹' : '';
  return `${prefix}${symbol}${formatted}`;
};

const formatPercent = (value, options = {}) => {
  const { decimals = 1, showSign = false } = options;
  if (value === null || value === undefined || value === '') return '0%';
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return '0%';
  const sign = showSign && num > 0 ? '+' : '';
  const formatted = num % 1 === 0 ? num.toFixed(0) : num.toFixed(decimals);
  return `${sign}${formatted}%`;
};

const formatNumber = (value, options = {}) => {
  const { decimals = 0 } = options;
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

describe('SalonSync Animated Number & Indian Locale Formatting Unit Tests', () => {

  describe('Indian Currency Formatting (₹)', () => {
    test('formats zero as ₹0', () => {
      expect(formatCurrency(0)).toBe('₹0');
      expect(formatCurrency(null)).toBe('₹0');
      expect(formatCurrency(undefined)).toBe('₹0');
    });

    test('formats thousands and lakhs with standard Indian comma grouping', () => {
      expect(formatCurrency(1000)).toBe('₹1,000');
      expect(formatCurrency(10000)).toBe('₹10,000');
      expect(formatCurrency(45000)).toBe('₹45,000');
      expect(formatCurrency(100000)).toBe('₹1,00,000');
      expect(formatCurrency(1000000)).toBe('₹10,00,000');
      expect(formatCurrency(12500000)).toBe('₹1,25,00,000');
    });

    test('formats negative amounts correctly with minus sign', () => {
      expect(formatCurrency(-5000)).toBe('-₹5,000');
      expect(formatCurrency(-45000)).toBe('-₹45,000');
    });
  });

  describe('Percentage Formatting (%)', () => {
    test('formats zero as 0%', () => {
      expect(formatPercent(0)).toBe('0%');
      expect(formatPercent(null)).toBe('0%');
    });

    test('formats integer percentages cleanly without decimal trailing zeroes', () => {
      expect(formatPercent(25)).toBe('25%');
      expect(formatPercent(50)).toBe('50%');
      expect(formatPercent(100)).toBe('100%');
    });

    test('formats fractional percentages with configured precision', () => {
      expect(formatPercent(48.43, { decimals: 1 })).toBe('48.4%');
      expect(formatPercent(12.75, { decimals: 2 })).toBe('12.75%');
    });
  });

  describe('Integer and Count Formatting', () => {
    test('formats count values with locale separators', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(15)).toBe('15');
      expect(formatNumber(120)).toBe('120');
      expect(formatNumber(1500)).toBe('1,500');
      expect(formatNumber(100000)).toBe('1,00,000');
    });
  });

  describe('Count-up Animation Math Deceleration Function', () => {
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    test('starts at 0 at t=0 and reaches exactly 1 at t=1', () => {
      expect(easeOutCubic(0)).toBe(0);
      expect(easeOutCubic(1)).toBe(1);
    });

    test('produces smooth deceleration curve between 0 and 1', () => {
      const mid = easeOutCubic(0.5);
      expect(mid).toBeGreaterThan(0.5); // Fast initial progress, decelerating to end
      expect(mid).toBe(0.875);
    });
  });

});
