import React from 'react';
import { type LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';


interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: LucideIcon;
  color: string;
  sparklineData?: number[];
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  isPositive,
  icon: Icon,
  color,
  sparklineData = [10, 25, 18, 30, 22, 40, 35]
}) => {
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;

  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * 90 + 5;
      const y = 35 - ((val - minVal) / range) * 25;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: `${color}15`,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={22} />
        </div>

        <svg width="100" height="40" style={{ overflow: 'visible' }}>
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>

      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {title}
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--text-primary)' }}>
          {value}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.25rem' }}>
        <span className={`badge ${isPositive ? 'badge-success' : 'badge-danger'}`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>this month</span>
      </div>
    </div>
  );
};
