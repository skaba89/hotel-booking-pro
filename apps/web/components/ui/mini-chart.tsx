'use client';

import { useMemo } from 'react';

// ─── Bar Chart ────────────────────────────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  unit?: string;
  formatValue?: (v: number) => string;
}

export function BarChart({
  data,
  color = '#C8A45D',
  height = 120,
  unit = '',
  formatValue,
}: BarChartProps) {
  const max = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);
  const fmt = formatValue ?? ((v: number) => `${v}${unit}`);

  if (data.length === 0) return null;

  const BAR_W = 100 / data.length;
  const GAP = 0.3; // percentage gap between bars

  return (
    <div className="w-full" style={{ height }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        aria-hidden="true"
      >
        {data.map((d, i) => {
          const barH = (d.value / max) * (height - 20);
          const x = i * BAR_W + GAP / 2;
          const w = BAR_W - GAP;
          const y = height - 20 - barH;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={w}
                height={barH}
                fill={color}
                opacity={0.85}
                rx="1"
              />
              {/* Tooltip on hover via title */}
              <title>{`${d.label}: ${fmt(d.value)}`}</title>
            </g>
          );
        })}
      </svg>
      {/* X-axis labels */}
      <div className="flex justify-between mt-1 px-0.5">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-muted-foreground truncate" style={{ width: `${BAR_W}%`, textAlign: 'center' }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

interface LineChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  fillColor?: string;
  formatValue?: (v: number) => string;
}

export function LineChart({
  data,
  color = '#C8A45D',
  height = 120,
  fillColor,
  formatValue,
}: LineChartProps) {
  const max = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);
  const fmt = formatValue ?? ((v: number) => String(v));

  const points = useMemo(() => {
    if (data.length === 0) return '';
    const step = 100 / (data.length - 1 || 1);
    return data
      .map((d, i) => {
        const x = i * step;
        const y = height - 20 - (d.value / max) * (height - 28);
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, max, height]);

  const areaPoints = useMemo(() => {
    if (data.length === 0) return '';
    const step = 100 / (data.length - 1 || 1);
    const linePoints = data.map((d, i) => {
      const x = i * step;
      const y = height - 20 - (d.value / max) * (height - 28);
      return `${x},${y}`;
    });
    return `0,${height - 20} ${linePoints.join(' ')} 100,${height - 20}`;
  }, [data, max, height]);

  if (data.length === 0) return null;

  return (
    <div className="w-full" style={{ height }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        aria-hidden="true"
      >
        {/* Filled area */}
        {fillColor && (
          <polygon points={areaPoints} fill={fillColor} opacity={0.15} />
        )}
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={pct}
            x1={0}
            y1={height - 20 - pct * (height - 28)}
            x2={100}
            y2={height - 20 - pct * (height - 28)}
            stroke="#e5e7eb"
            strokeWidth="0.4"
          />
        ))}
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots + tooltips */}
        {data.map((d, i) => {
          const step = 100 / (data.length - 1 || 1);
          const x = i * step;
          const y = height - 20 - (d.value / max) * (height - 28);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="1.8" fill={color} />
              <title>{`${d.label}: ${fmt(d.value)}`}</title>
            </g>
          );
        })}
      </svg>
      {/* X labels — show only first, middle, last to avoid overlap */}
      <div className="flex justify-between mt-1 px-0.5">
        <span className="text-[9px] text-muted-foreground">{data[0]?.label}</span>
        {data.length > 2 && (
          <span className="text-[9px] text-muted-foreground">{data[Math.floor(data.length / 2)]?.label}</span>
        )}
        <span className="text-[9px] text-muted-foreground">{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
