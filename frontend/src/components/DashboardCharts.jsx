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
export const RevenueExpenseChart = ({
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  revenues = [0, 0, 0, 0, 0, 0],
  expenses = [0, 0, 0, 0, 0, 0],
  revenueData,
  expenseData
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [hoveredType, setHoveredType] = useState(null);

  const activeRevenues = revenueData && revenueData.length > 0 ? revenueData : revenues;
  const activeExpenses = expenseData && expenseData.length > 0 ? expenseData : expenses;

  const width = 600;
  const height = 260;
  const padding = 50;

  const allVals = [...activeRevenues, ...activeExpenses];
  const rawMax = Math.max(...allVals, 0);
  const maxVal = rawMax > 0 ? rawMax * 1.15 : 10000;

  const getPoints = (data) =>
    data.map((val, idx) => ({
      x: padding + (idx * (width - padding * 2)) / Math.max(data.length - 1, 1),
      y: height - padding - ((val || 0) * (height - padding * 2)) / maxVal,
      val: val || 0,
    }));

  const revPoints = getPoints(activeRevenues);
  const expPoints = getPoints(activeExpenses);

  const revLine = smoothLine(revPoints);
  const expLine = smoothLine(expPoints);

  const makeArea = (points, line) => {
    if (points.length < 2 || !line) return '';
    return `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '0.75rem', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--gold-primary)', display: 'inline-block' }} />
          Revenue
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-red)', display: 'inline-block' }} />
          Expenses
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="260" style={{ background: 'transparent' }}>
        <defs>
          <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--gold-primary)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="expAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-red)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--accent-red)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + ratio * (height - padding * 2);
          const val = Math.round(maxVal - ratio * maxVal);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="4,4" />
              <text x={padding - 8} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontFamily="var(--font-sans)">
                ₹{(val / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {months.map((m, idx) => {
          const x = padding + (idx * (width - padding * 2)) / Math.max(months.length - 1, 1);
          return (
            <text key={m} x={x} y={height - padding + 22} fill="var(--text-secondary)" fontSize="10" textAnchor="middle" fontFamily="var(--font-sans)">
              {m}
            </text>
          );
        })}

        {/* Areas */}
        <path d={makeArea(revPoints, revLine)} fill="url(#revAreaGrad)" />
        <path d={makeArea(expPoints, expLine)} fill="url(#expAreaGrad)" />

        {/* Lines */}
        <path d={revLine} fill="none" stroke="var(--gold-primary)" strokeWidth="2.5" strokeLinecap="round" />
        <path d={expLine} fill="none" stroke="var(--accent-red)" strokeWidth="2" strokeLinecap="round" strokeDasharray="6,3" />

        {/* Revenue points */}
        {revPoints.map((p, idx) => (
          <circle
            key={`r${idx}`}
            cx={p.x} cy={p.y}
            r={hoveredIdx === idx && hoveredType === 'rev' ? 6 : 3.5}
            fill={hoveredIdx === idx && hoveredType === 'rev' ? 'var(--gold-primary)' : 'var(--bg-secondary)'}
            stroke="var(--gold-primary)" strokeWidth="2"
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
            fill={hoveredIdx === idx && hoveredType === 'exp' ? 'var(--accent-red)' : 'var(--bg-secondary)'}
            stroke="var(--accent-red)" strokeWidth="2"
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
          left: Math.max(10, (hoveredType === 'rev' ? revPoints : expPoints)[hoveredIdx].x - 55),
          background: 'rgba(15,15,15,0.95)',
          border: `1px solid ${hoveredType === 'rev' ? 'var(--gold-border)' : 'rgba(231,76,60,0.4)'}`,
          borderRadius: '6px',
          padding: '0.3rem 0.6rem',
          fontSize: '0.72rem',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10
        }}>
          <strong>{months[hoveredIdx]}</strong> {hoveredType === 'rev' ? 'Rev' : 'Exp'}: ₹{(hoveredType === 'rev' ? revPoints : expPoints)[hoveredIdx].val.toLocaleString()}
        </div>
      )}
    </div>
  );
};


// ─── 2. MONTHLY PROFIT BAR CHART ─────────────────────────────────────────────
export const MonthlyProfitChart = ({
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  profits = [0, 0, 0, 0, 0, 0],
  data
}) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  const values = data && data.length > 0 ? data : profits;

  const width = 500;
  const height = 250;
  const padding = 50;

  const rawMax = Math.max(...values, 0);
  const maxVal = rawMax > 0 ? rawMax * 1.15 : 10000;
  const barWidth = 32;
  const chartWidth = width - padding * 2;
  const step = chartWidth / Math.max(months.length, 1);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="250">
        <defs>
          <linearGradient id="profitBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold-primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--gold-primary)" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Y grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + ratio * (height - padding * 2);
          const val = Math.round(maxVal - ratio * maxVal);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="4,4" />
              <text x={padding - 8} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontFamily="var(--font-sans)">
                ₹{(val / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {months.map((m, idx) => {
          const x = padding + (idx * step) + (step / 2);
          return (
            <text key={m} x={x} y={height - padding + 20} fill="var(--text-secondary)" fontSize="10" textAnchor="middle" fontFamily="var(--font-sans)">
              {m}
            </text>
          );
        })}

        {/* Bars */}
        {values.map((val, idx) => {
          const x = padding + (idx * step) + (step / 2) - (barWidth / 2);
          const barHeight = ((Math.max(0, val)) * (height - padding * 2)) / maxVal;
          const y = height - padding - barHeight;
          const isHovered = hoveredBar === idx;

          return (
            <g key={idx}>
              <rect
                x={x} y={y}
                width={barWidth} height={Math.max(barHeight, 2)}
                rx="4"
                fill={isHovered ? 'var(--gold-primary)' : 'url(#profitBarGrad)'}
                opacity={isHovered ? 1 : 0.8}
                onMouseEnter={() => setHoveredBar(idx)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              />
              {/* Value on top */}
              {isHovered && (
                <text x={x + barWidth / 2} y={y - 8} fill="var(--gold-primary)" fontSize="10" textAnchor="middle" fontWeight="600" fontFamily="var(--font-sans)">
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
export const AppointmentTrendChart = ({
  days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  appointments = [0, 0, 0, 0, 0, 0, 0],
  data
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const values = data && data.length > 0 ? data : appointments;

  const width = 500;
  const height = 220;
  const padding = 45;

  const rawMax = Math.max(...values, 0);
  const maxVal = rawMax > 0 ? rawMax * 1.2 : 10;

  const points = values.map((val, idx) => ({
    x: padding + (idx * (width - padding * 2)) / Math.max(values.length - 1, 1),
    y: height - padding - ((val || 0) * (height - padding * 2)) / maxVal,
    val: val || 0,
  }));

  const line = smoothLine(points);
  const area = points.length > 1 && line ? `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : '';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="220" style={{ background: 'transparent' }}>
        <defs>
          <linearGradient id="apptAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3498db" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3498db" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const y = padding + ratio * (height - padding * 2);
          const val = Math.round(maxVal - ratio * maxVal);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
              <text x={padding - 8} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontFamily="var(--font-sans)">
                {val}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {days.map((d, idx) => {
          const x = padding + (idx * (width - padding * 2)) / Math.max(days.length - 1, 1);
          return (
            <text key={d} x={x} y={height - padding + 20} fill="var(--text-secondary)" fontSize="10" textAnchor="middle" fontFamily="var(--font-sans)">
              {d}
            </text>
          );
        })}

        {area && <path d={area} fill="url(#apptAreaGrad)" />}
        {line && <path d={line} fill="none" stroke="#3498db" strokeWidth="2.5" strokeLinecap="round" />}

        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x} cy={p.y}
            r={hoveredIdx === idx ? 6 : 3.5}
            fill={hoveredIdx === idx ? '#3498db' : 'var(--bg-secondary)'}
            stroke="#3498db" strokeWidth="2"
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
          left: Math.max(10, points[hoveredIdx].x - 40),
          background: 'rgba(15,15,15,0.95)',
          border: '1px solid rgba(52,152,219,0.4)',
          borderRadius: '6px',
          padding: '0.3rem 0.6rem',
          fontSize: '0.72rem',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10
        }}>
          <strong>{days[hoveredIdx]}:</strong> {points[hoveredIdx].val} appts
        </div>
      )}
    </div>
  );
};


// ─── 4. CUSTOMER GROWTH ──────────────────────────────────────────────────────
export const CustomerGrowthChart = ({
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  customers = [0, 0, 0, 0, 0, 0],
  data
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const values = data && data.length > 0 ? data : customers;

  const width = 500;
  const height = 220;
  const padding = 45;

  const rawMax = Math.max(...values, 0);
  const maxVal = rawMax > 0 ? rawMax * 1.2 : 10;

  const points = values.map((val, idx) => ({
    x: padding + (idx * (width - padding * 2)) / Math.max(values.length - 1, 1),
    y: height - padding - ((val || 0) * (height - padding * 2)) / maxVal,
    val: val || 0,
  }));

  const line = smoothLine(points);
  const area = points.length > 1 && line ? `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` : '';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="220" style={{ background: 'transparent' }}>
        <defs>
          <linearGradient id="custAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2ecc71" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2ecc71" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const y = padding + ratio * (height - padding * 2);
          const val = Math.round(maxVal - ratio * maxVal);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
              <text x={padding - 8} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end" fontFamily="var(--font-sans)">
                {val}
              </text>
            </g>
          );
        })}

        {months.map((m, idx) => {
          const x = padding + (idx * (width - padding * 2)) / Math.max(months.length - 1, 1);
          return (
            <text key={m} x={x} y={height - padding + 20} fill="var(--text-secondary)" fontSize="10" textAnchor="middle" fontFamily="var(--font-sans)">
              {m}
            </text>
          );
        })}

        {area && <path d={area} fill="url(#custAreaGrad)" />}
        {line && <path d={line} fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" />}

        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x} cy={p.y}
            r={hoveredIdx === idx ? 6 : 3.5}
            fill={hoveredIdx === idx ? '#2ecc71' : 'var(--bg-secondary)'}
            stroke="#2ecc71" strokeWidth="2"
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
          left: Math.max(10, points[hoveredIdx].x - 50),
          background: 'rgba(15,15,15,0.95)',
          border: '1px solid rgba(46,204,113,0.4)',
          borderRadius: '6px',
          padding: '0.3rem 0.6rem',
          fontSize: '0.72rem',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
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
export const PopularServicesDonut = ({
  labels = ['Haircut', 'Hair Color', 'Facial', 'Spa & Massage', 'Bridal'],
  values = [0, 0, 0, 0, 0],
  data
}) => {
  const [hoveredSeg, setHoveredSeg] = useState(null);

  const categories = labels && labels.length > 0 ? labels : ['Haircut', 'Hair Color', 'Facial', 'Spa & Massage', 'Bridal'];
  const activeValues = data && data.length > 0 ? data : values;
  const colors = ['#708238', '#8b9b6a', '#3498db', '#2ecc71', '#9b59b6', '#e67e22', '#e74c3c'];

  const total = activeValues.reduce((sum, v) => sum + (Number(v) || 0), 0);
  const percentages = activeValues.map(v => total > 0 ? Math.round(((Number(v) || 0) / total) * 100) : 0);

  const cx = 100;
  const cy = 100;
  const r = 62;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * r;

  let accumulatedPercent = 0;

  return (
    <div className="donut-chart-wrapper">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
        {percentages.map((pct, idx) => {
          if (pct === 0) return null;
          const strokeDashoffset = circumference - (pct / 100) * circumference;
          const rotation = (accumulatedPercent / 100) * 360;
          accumulatedPercent += pct;
          const isHovered = hoveredSeg === idx;

          return (
            <circle
              key={idx}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={colors[idx % colors.length]}
              strokeWidth={isHovered ? strokeWidth + 5 : strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(${rotation - 90} ${cx} ${cy})`}
              onMouseEnter={() => setHoveredSeg(idx)}
              onMouseLeave={() => setHoveredSeg(null)}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease', filter: isHovered ? 'brightness(1.2)' : 'none' }}
            />
          );
        })}

        {/* Center */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontWeight="bold" fontFamily="var(--font-sans)">
          {hoveredSeg !== null && percentages[hoveredSeg] !== undefined ? `${percentages[hoveredSeg]}%` : `${total}`}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" fontSize="8.5" fontFamily="var(--font-sans)">
          {hoveredSeg !== null && categories[hoveredSeg] ? categories[hoveredSeg] : 'Total Serviced'}
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {categories.map((c, i) => (
          <div
            key={c}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.75rem',
              padding: '0.3rem 0.5rem',
              borderRadius: '4px',
              background: hoveredSeg === i ? 'rgba(255,255,255,0.04)' : 'transparent',
              transition: 'background 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredSeg(i)}
            onMouseLeave={() => setHoveredSeg(null)}
          >
            <span style={{
              width: 10, height: 10,
              background: colors[i % colors.length],
              borderRadius: '2px',
              display: 'inline-block',
              boxShadow: hoveredSeg === i ? `0 0 6px ${colors[i % colors.length]}` : 'none',
              transition: 'box-shadow 0.2s ease'
            }} />
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>{c}</span>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginLeft: 'auto', fontWeight: 600 }}>
              {percentages[i] !== undefined ? `${percentages[i]}%` : `${activeValues[i] || 0}`}
            </span>
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
