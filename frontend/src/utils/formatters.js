/**
 * SalonSync Centralized Number & Currency Formatting Utility
 * Enforces pure numeric state internally and consistent INR display formatting.
 */

/**
 * Formats a numeric value into Indian Rupee notation (e.g., ₹1,25,000 or -₹5,000)
 * @param {number|string} value - Amount to format
 * @param {object} options - Optional parameters { decimals: 0, showSymbol: true, compact: false }
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, options = {}) => {
  const { decimals = 0, showSymbol = true, compact = false } = options;

  if (value === null || value === undefined || value === '') {
    return showSymbol ? '₹0' : '0';
  }

  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) {
    return showSymbol ? '₹0' : '0';
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  let formatted = '';
  if (compact && absNum >= 10000000) {
    formatted = (absNum / 10000000).toFixed(1) + ' Cr';
  } else if (compact && absNum >= 100000) {
    formatted = (absNum / 100000).toFixed(1) + ' L';
  } else if (compact && absNum >= 1000) {
    formatted = (absNum / 1000).toFixed(1) + ' K';
  } else {
    formatted = absNum.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  const prefix = isNegative ? '-' : '';
  const symbol = showSymbol ? '₹' : '';

  return `${prefix}${symbol}${formatted}`;
};

/**
 * Formats a number as a percentage (e.g., 15.5% or 0%)
 * @param {number|string} value - Percentage value
 * @param {object} options - Optional parameters { decimals: 1, showSign: false }
 * @returns {string} Formatted percentage string
 */
export const formatPercent = (value, options = {}) => {
  const { decimals = 1, showSign = false } = options;

  if (value === null || value === undefined || value === '') {
    return '0%';
  }

  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) {
    return '0%';
  }

  const sign = showSign && num > 0 ? '+' : '';
  // Avoid showing trailing .0 if integer percentage
  const formatted = num % 1 === 0 ? num.toFixed(0) : num.toFixed(decimals);

  return `${sign}${formatted}%`;
};

/**
 * Formats a count or generic numeric quantity with locale thousands separators
 * @param {number|string} value - Number to format
 * @param {object} options - Optional parameters { decimals: 0 }
 * @returns {string} Formatted number
 */
export const formatNumber = (value, options = {}) => {
  const { decimals = 0 } = options;

  if (value === null || value === undefined || value === '') {
    return '0';
  }

  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) {
    return '0';
  }

  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Safely parses any input into a clean positive or standard number
 * @param {any} value - Input string or number
 * @param {number} fallback - Default fallback if invalid
 * @returns {number} Clean numeric value
 */
export const parseNumeric = (value, fallback = 0) => {
  if (typeof value === 'number') return isNaN(value) ? fallback : value;
  if (!value) return fallback;

  const cleaned = String(value).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
};
