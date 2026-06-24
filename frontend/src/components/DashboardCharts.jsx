import React, { useState } from 'react';

// 1. Revenue & Profit Trends (Line & Area SVG Chart)
export const RevenueLineChart = ({ data = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const revenues = data.length > 0 ? data : [120000, 145000, 110000, 165000, 190000, 215000];

  const width = 600;
  const height = 250;
  const padding = 40;

  const maxVal = Math.max(...revenues) * 1.15;
  const minVal = 0;

  // Map coordinates
  const points = revenues.map((val, idx) => {
    const x = padding + (idx * (width - padding * 2)) / (revenues.length - 1);
    const y = height - padding - ((val - minVal) * (height - padding * 2)) / (maxVal - minVal);
    return { x, y, val };
  });

  const linePath = points.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }, '');

  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
    : '';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="250" style={{ background: 'transparent' }}>
        <defs>
          <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold-primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--gold-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + ratio * (height - padding * 2);
          const val = Math.round(maxVal - ratio * maxVal);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(212,175,55,0.08)" strokeDasharray="3,3" />
              <text x={padding - 5} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">
                ₹{(val / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {months.map((m, idx) => {
          const x = padding + (idx * (width - padding * 2)) / (months.length - 1);
          return (
            <text key={m} x={x} y={height - padding + 20} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">
              {m}
            </text>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#goldAreaGrad)" />

        {/* Line stroke */}
        <path d={linePath} fill="none" stroke="var(--gold-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Interactive points */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 7 : 4}
              fill={hoveredIdx === idx ? 'var(--gold-primary)' : 'var(--bg-secondary)'}
              stroke="var(--gold-primary)"
              strokeWidth="2"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip Overlay */}
      {hoveredIdx !== null && (
        <div style={{
          position: 'absolute',
          top: points[hoveredIdx].y - 45,
          left: points[hoveredIdx].x - 60,
          background: '#1a1a1a',
          border: '1px solid var(--gold-border)',
          borderRadius: '4px',
          padding: '0.25rem 0.5rem',
          fontSize: '0.75rem',
          color: '#fff',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          <strong>{months[hoveredIdx]} Rev:</strong> ₹{points[hoveredIdx].val.toLocaleString()}
        </div>
      )}
    </div>
  );
};

// 2. Profit & Expense (Bar SVG Chart)
export const ProfitBarChart = ({ data = [] }) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  const categories = ['Staff Sal.', 'Rent', 'Electricity', 'Products', 'Marketing', 'Misc'];
  const values = data.length > 0 ? data : [30000, 45000, 18500, 18000, 12000, 5000];

  const width = 500;
  const height = 250;
  const padding = 40;

  const maxVal = Math.max(...values) * 1.1;

  const barWidth = 35;
  const chartWidth = width - padding * 2;
  const step = chartWidth / categories.length;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="250">
        {/* Y grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + ratio * (height - padding * 2);
          const val = Math.round(maxVal - ratio * maxVal);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.05)" />
              <text x={padding - 5} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">
                ₹{(val / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {categories.map((c, idx) => {
          const x = padding + (idx * step) + (step / 2);
          return (
            <text key={c} x={x} y={height - padding + 18} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">
              {c}
            </text>
          );
        })}

        {/* Bars */}
        {values.map((val, idx) => {
          const x = padding + (idx * step) + (step / 2) - (barWidth / 2);
          const barHeight = ((val) * (height - padding * 2)) / maxVal;
          const y = height - padding - barHeight;
          const isHovered = hoveredBar === idx;

          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="4"
              fill={isHovered ? 'var(--gold-primary)' : 'rgba(212, 175, 55, 0.35)'}
              stroke="var(--gold-primary)"
              strokeWidth={isHovered ? '1.5' : '0.5'}
              onMouseEnter={() => setHoveredBar(idx)}
              onMouseLeave={() => setHoveredBar(null)}
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
            />
          );
        })}
      </svg>

      {/* Tooltip Overlay */}
      {hoveredBar !== null && (
        <div style={{
          position: 'absolute',
          top: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1a1a',
          border: '1px solid var(--gold-border)',
          borderRadius: '4px',
          padding: '0.25rem 0.5rem',
          fontSize: '0.75rem',
          color: '#fff',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          <strong>{categories[hoveredBar]}:</strong> ₹{values[hoveredBar].toLocaleString()}
        </div>
      )}
    </div>
  );
};

// 3. Category Pie Share (Donut SVG Chart)
export const ServiceShareDonut = ({ data = [] }) => {
  const [hoveredSeg, setHoveredSeg] = useState(null);

  const categories = ['Haircut', 'Hair Color', 'Facial', 'Spa', 'Bridal'];
  const values = data.length > 0 ? data : [35, 25, 20, 12, 8]; // Percentages
  const colors = ['#d4af37', '#c5a059', '#3498db', '#2ecc71', '#9b59b6'];

  const cx = 100;
  const cy = 100;
  const r = 60;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * r;

  let accumulatedPercent = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
        {values.map((pct, idx) => {
          const strokeDashoffset = circumference - (pct / 100) * circumference;
          const rotation = (accumulatedPercent / 100) * 360;
          accumulatedPercent += pct;
          const isHovered = hoveredSeg === idx;

          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={colors[idx]}
              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(${rotation - 90} ${cx} ${cy})`}
              onMouseEnter={() => setHoveredSeg(idx)}
              onMouseLeave={() => setHoveredSeg(null)}
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
            />
          );
        })}
        {/* Center Text */}
        <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="bold">
          {hoveredSeg !== null ? `${categories[hoveredSeg]}: ${values[hoveredSeg]}%` : 'Share Ratio'}
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {categories.map((c, i) => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
            <span style={{ width: '10px', height: '10px', background: colors[i], borderRadius: '2px', display: 'inline-block' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>{c} ({values[i]}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};
