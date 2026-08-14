import React, { useState } from 'react';

// ─── UTILITY: Smooth SVG path from points ────────────────────────────────────
const smoothLine = (points) => {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
    const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
    d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
};

// ─── 1. REVENUE VS EXPENSES ──────────────────────────────────────────────────
export const RevenueExpenseChart = ({ revenueData = [], expenseData = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [hoveredType, setHoveredType] = useState(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const revenues = revenueData.length > 0 ? revenueData : [120000, 145000, 110000, 165000, 190000, 215000];
  const expenses = expenseData.length > 0 ? expenseData : [65000, 72000, 58000, 80000, 75000, 85000];

  const width = 600;
  const height = 260;
  const padding = 50;

  const allVals = [...revenues, ...expenses];
  const maxVal = Math.max(...allVals) * 1.15;

  const getPoints = (data) =>
    data.map((val, idx) => ({
      x: padding + (idx * (width - padding * 2)) / (data.length - 1),
      y: height - padding - ((val) * (height - padding * 2)) / maxVal,
      val,
    }));

  const revPoints = getPoints(revenues);
  const expPoints = getPoints(expenses);

  const revLine = smoothLine(revPoints);
  const expLine = smoothLine(expPoints);

  const makeArea = (points, line) => {
    if (points.length < 2) return '';
    return `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '0.75rem', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-primary-dark)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-primary)', display: 'inline-block' }} />
          Revenue (Olive)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-accent-dark)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-accent)', display: 'inline-block' }} />
          Expenses (Purple)
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="260" style={{ background: 'transparent' }}>
        <defs>
          <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="expAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + ratio * (height - padding * 2);
          const val = Math.round(maxVal - ratio * maxVal);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--color-border)" strokeDasharray="3,3" />
              <text x={padding - 8} y={y + 4} fill="var(--color-text-muted)" fontSize="9" textAnchor="end" fontFamily="var(--font-sans)">
                ₹{(val / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {months.map((m, idx) => {
          const x = padding + (idx * (width - padding * 2)) / (months.length - 1);
          return (
            <text key={m} x={x} y={height - padding + 22} fill="var(--color-text-secondary)" fontSize="10" fontWeight="500" textAnchor="middle" fontFamily="var(--font-sans)">
              {m}
            </text>
          );
        })}

        {/* Areas */}
        <path d={makeArea(revPoints, revLine)} fill="url(#revAreaGrad)" />
        <path d={makeArea(expPoints, expLine)} fill="url(#expAreaGrad)" />

        {/* Lines */}
        <path d={revLine} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
        <path d={expLine} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray="5,3" />

        {/* Revenue points */}
        {revPoints.map((p, idx) => (
          <circle
            key={`r${idx}`}
            cx={p.x} cy={p.y}
            r={hoveredIdx === idx && hoveredType === 'rev' ? 6 : 3.5}
            fill={hoveredIdx === idx && hoveredType === 'rev' ? 'var(--color-primary)' : '#FFFFFF'}
            stroke="var(--color-primary)" strokeWidth="2"
            onMouseEnter={() => { setHoveredIdx(idx); setHoveredType('rev'); }}
            onMouseLeave={() => { setHoveredIdx(null); setHoveredType(null); }}
            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          />
        ))}

        {/* Expense points */}
        {expPoints.map((p, idx) => (
          <circle
            key={`e${idx}`}
            cx={p.x} cy={p.y}
            r={hoveredIdx === idx && hoveredType === 'exp' ? 6 : 3.5}
            fill={hoveredIdx === idx && hoveredType === 'exp' ? 'var(--color-accent)' : '#FFFFFF'}
            stroke="var(--color-accent)" strokeWidth="2"
            onMouseEnter={() => { setHoveredIdx(idx); setHoveredType('exp'); }}
            onMouseLeave={() => { setHoveredIdx(null); setHoveredType(null); }}
            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && hoveredType && (
        <div style={{
          position: 'absolute',
          top: (hoveredType === 'rev' ? revPoints : expPoints)[hoveredIdx].y - 48,
          left: (hoveredType === 'rev' ? revPoints : expPoints)[hoveredIdx].x - 55,
          background: 'var(--color-surface)',
          border: `1px solid ${hoveredType === 'rev' ? 'var(--color-primary)' : 'var(--color-accent)'}`,
          borderRadius: '8px',
          padding: '0.35rem 0.65rem',
          fontSize: '0.75rem',
          color: 'var(--color-text)',
          boxShadow: 'var(--shadow-md)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10
        }}>
          <strong>{months[hoveredIdx]}</strong> {hoveredType === 'rev' ? 'Revenue' : 'Expense'}: ₹{(hoveredType === 'rev' ? revPoints : expPoints)[hoveredIdx].val.toLocaleString()}
        </div>
      )}
    </div>
  );
};


// ─── 2. MONTHLY PROFIT BAR CHART ─────────────────────────────────────────────
export const MonthlyProfitChart = ({ data = [] }) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const values = data.length > 0 ? data : [55000, 73000, 52000, 85000, 115000, 130000];

  const width = 500;
  const height = 250;
  const padding = 50;

  const maxVal = Math.max(...values) * 1.15;
  const barWidth = 32;
  const chartWidth = width - padding * 2;
  const step = chartWidth / months.length;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="250">
        <defs>
          <linearGradient id="profitBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--color-primary-dark)" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* Y grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + ratio * (height - padding * 2);
          const val = Math.round(maxVal - ratio * maxVal);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--color-border)" strokeDasharray="3,3" />
              <text x={padding - 8} y={y + 4} fill="var(--color-text-muted)" fontSize="9" textAnchor="end" fontFamily="var(--font-sans)">
                ₹{(val / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {months.map((m, idx) => {
          const x = padding + (idx * step) + (step / 2);
          return (
            <text key={m} x={x} y={height - padding + 20} fill="var(--color-text-secondary)" fontSize="10" fontWeight="500" textAnchor="middle" fontFamily="var(--font-sans)">
              {m}
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
            <g key={idx}>
              <rect
                x={x} y={y}
                width={barWidth} height={barHeight}
                rx="6"
                fill={isHovered ? 'var(--color-accent)' : 'url(#profitBarGrad)'}
                opacity={isHovered ? 1 : 0.9}
                onMouseEnter={() => setHoveredBar(idx)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              />
              {/* Value on top */}
              {isHovered && (
                <text x={x + barWidth / 2} y={y - 8} fill="var(--color-accent-dark)" fontSize="10" textAnchor="middle" fontWeight="700" fontFamily="var(--font-sans)">
                  ₹{(val / 1000).toFixed(0)}k
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};


// ─── 3. APPOINTMENT TREND ────────────────────────────────────────────────────
export const AppointmentTrendChart = ({ data = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = data.length > 0 ? data : [12, 18, 15, 22, 28, 35, 20];

  const width = 500;
  const height = 220;
  const padding = 45;

  const maxVal = Math.max(...values) * 1.2;

  const points = values.map((val, idx) => ({
    x: padding + (idx * (width - padding * 2)) / (values.length - 1),
    y: height - padding - ((val) * (height - padding * 2)) / maxVal,
    val,
  }));

  const line = smoothLine(points);
  const area = `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="220" style={{ background: 'transparent' }}>
        <defs>
          <linearGradient id="apptAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const y = padding + ratio * (height - padding * 2);
          const val = Math.round(maxVal - ratio * maxVal);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--color-border)" strokeDasharray="3,3" />
              <text x={padding - 8} y={y + 4} fill="var(--color-text-muted)" fontSize="9" textAnchor="end" fontFamily="var(--font-sans)">
                {val}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {days.map((d, idx) => {
          const x = padding + (idx * (width - padding * 2)) / (days.length - 1);
          return (
            <text key={d} x={x} y={height - padding + 20} fill="var(--color-text-secondary)" fontSize="10" fontWeight="500" textAnchor="middle" fontFamily="var(--font-sans)">
              {d}
            </text>
          );
        })}

        <path d={area} fill="url(#apptAreaGrad)" />
        <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />

        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x} cy={p.y}
            r={hoveredIdx === idx ? 6 : 3.5}
            fill={hoveredIdx === idx ? 'var(--color-accent)' : '#FFFFFF'}
            stroke="var(--color-accent)" strokeWidth="2"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          />
        ))}
      </svg>

      {hoveredIdx !== null && (
        <div style={{
          position: 'absolute',
          top: points[hoveredIdx].y - 42,
          left: points[hoveredIdx].x - 40,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-accent)',
          borderRadius: '8px',
          padding: '0.35rem 0.65rem',
          fontSize: '0.75rem',
          color: 'var(--color-text)',
          boxShadow: 'var(--shadow-md)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10
        }}>
          <strong>{days[hoveredIdx]}:</strong> {points[hoveredIdx].val} appointments
        </div>
      )}
    </div>
  );
};


// ─── 4. CUSTOMER GROWTH ──────────────────────────────────────────────────────
export const CustomerGrowthChart = ({ data = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const values = data.length > 0 ? data : [45, 62, 78, 95, 118, 142];

  const width = 500;
  const height = 220;
  const padding = 45;

  const maxVal = Math.max(...values) * 1.2;

  const points = values.map((val, idx) => ({
    x: padding + (idx * (width - padding * 2)) / (values.length - 1),
    y: height - padding - ((val) * (height - padding * 2)) / maxVal,
    val,
  }));

  const line = smoothLine(points);
  const area = `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="220" style={{ background: 'transparent' }}>
        <defs>
          <linearGradient id="custAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const y = padding + ratio * (height - padding * 2);
          const val = Math.round(maxVal - ratio * maxVal);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--color-border)" strokeDasharray="3,3" />
              <text x={padding - 8} y={y + 4} fill="var(--color-text-muted)" fontSize="9" textAnchor="end" fontFamily="var(--font-sans)">
                {val}
              </text>
            </g>
          );
        })}

        {months.map((m, idx) => {
          const x = padding + (idx * (width - padding * 2)) / (months.length - 1);
          return (
            <text key={m} x={x} y={height - padding + 20} fill="var(--color-text-secondary)" fontSize="10" fontWeight="500" textAnchor="middle" fontFamily="var(--font-sans)">
              {m}
            </text>
          );
        })}

        <path d={area} fill="url(#custAreaGrad)" />
        <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />

        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x} cy={p.y}
            r={hoveredIdx === idx ? 6 : 3.5}
            fill={hoveredIdx === idx ? 'var(--color-primary)' : '#FFFFFF'}
            stroke="var(--color-primary)" strokeWidth="2"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          />
        ))}
      </svg>

      {hoveredIdx !== null && (
        <div style={{
          position: 'absolute',
          top: points[hoveredIdx].y - 42,
          left: points[hoveredIdx].x - 50,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-primary)',
          borderRadius: '8px',
          padding: '0.35rem 0.65rem',
          fontSize: '0.75rem',
          color: 'var(--color-text)',
          boxShadow: 'var(--shadow-md)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10
        }}>
          <strong>{months[hoveredIdx]}:</strong> {points[hoveredIdx].val} customers
        </div>
      )}
    </div>
  );
};


// ─── 5. POPULAR SERVICES DONUT ───────────────────────────────────────────────
export const PopularServicesDonut = ({ data = [] }) => {
  const [hoveredSeg, setHoveredSeg] = useState(null);

  const categories = ['Haircut', 'Hair Color', 'Facial', 'Spa & Massage', 'Bridal'];
  const values = data.length > 0 ? data : [32, 24, 18, 15, 11];
  const colors = ['#667A3E', '#7C4D9E', '#8FA65A', '#A875C2', '#3F4D27'];

  const cx = 100;
  const cy = 100;
  const r = 62;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * r;

  let accumulatedPercent = 0;

  return (
    <div className="donut-chart-wrapper">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
        {values.map((pct, idx) => {
          const strokeDashoffset = circumference - (pct / 100) * circumference;
          const rotation = (accumulatedPercent / 100) * 360;
          accumulatedPercent += pct;
          const isHovered = hoveredSeg === idx;

          return (
            <circle
              key={idx}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={colors[idx]}
              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(${rotation - 90} ${cx} ${cy})`}
              onMouseEnter={() => setHoveredSeg(idx)}
              onMouseLeave={() => setHoveredSeg(null)}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease', filter: isHovered ? 'brightness(1.15)' : 'none' }}
            />
          );
        })}

        {/* Center */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--color-text)" fontSize="13" fontWeight="bold" fontFamily="var(--font-sans)">
          {hoveredSeg !== null ? `${values[hoveredSeg]}%` : 'Services'}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--color-text-muted)" fontSize="9" fontFamily="var(--font-sans)">
          {hoveredSeg !== null ? categories[hoveredSeg] : 'Share Ratio'}
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {categories.map((c, i) => (
          <div
            key={c}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.78rem',
              padding: '0.3rem 0.5rem',
              borderRadius: '6px',
              background: hoveredSeg === i ? 'var(--color-surface-hover)' : 'transparent',
              transition: 'background 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredSeg(i)}
            onMouseLeave={() => setHoveredSeg(null)}
          >
            <span style={{
              width: 10, height: 10,
              background: colors[i],
              borderRadius: '3px',
              display: 'inline-block'
            }} />
            <span style={{ color: 'var(--color-text)', fontFamily: 'var(--font-sans)', fontWeight: '500' }}>{c}</span>
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', marginLeft: 'auto', fontWeight: 600 }}>{values[i]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── LEGACY EXPORTS (backward compat) ────────────────────────────────────────
export const RevenueLineChart = RevenueExpenseChart;
export const ProfitBarChart = MonthlyProfitChart;
export const ServiceShareDonut = PopularServicesDonut;
