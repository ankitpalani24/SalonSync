import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';

/**
 * Ease-out cubic formula for smooth, natural deceleration:
 * f(t) = 1 - (1 - t)^3
 */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Custom React Hook for smooth 60fps number count-up animation using requestAnimationFrame.
 * 
 * @param {number} targetValue - Final real value from API
 * @param {object} options - Configuration options: duration (ms), triggerKey (reset on branch/refresh)
 * @returns {number} Current animated value
 */
export const useCountUp = (targetValue, { duration = 800, triggerKey = null } = {}) => {
  const numValue = typeof targetValue === 'number' && !isNaN(targetValue) ? targetValue : 0;
  const [displayValue, setDisplayValue] = useState(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    // If target value is 0, render immediately without running RAF loop
    if (numValue === 0) {
      setDisplayValue(0);
      return;
    }

    let startTime = null;
    const startVal = 0;
    const diff = numValue - startVal;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = startVal + diff * easedProgress;

      if (progress < 1) {
        setDisplayValue(current);
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Guarantee exact match with authoritative target value
        setDisplayValue(numValue);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [numValue, triggerKey, duration]);

  return displayValue;
};

/**
 * Reusable AnimatedNumber component for KPI cards and dashboard widgets.
 * Formats numbers into currency (₹), percentages (%), or counts with Indian locale.
 */
export const AnimatedNumber = ({
  value,
  type = 'currency', // 'currency' | 'percent' | 'number' | 'count'
  decimals = 0,
  duration = 850,
  triggerKey = null,
  prefix = '',
  suffix = '',
  formatter = null
}) => {
  const rawNum = typeof value === 'number' ? value : Number(String(value || 0).replace(/[^0-9.-]+/g, '')) || 0;
  const animatedValue = useCountUp(rawNum, { duration, triggerKey });

  if (formatter && typeof formatter === 'function') {
    return <>{prefix}{formatter(animatedValue)}{suffix}</>;
  }

  if (type === 'currency') {
    return <>{prefix}{formatCurrency(animatedValue, { decimals })}{suffix}</>;
  }

  if (type === 'percent') {
    return <>{prefix}{formatPercent(animatedValue, { decimals: decimals || 1 })}{suffix}</>;
  }

  return <>{prefix}{formatNumber(animatedValue, { decimals })}{suffix}</>;
};

export default AnimatedNumber;
