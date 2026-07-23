import React from 'react';

export const LeadsDonutChart: React.FC = () => {
  const sources = [
    { label: 'Mobile', value: '1,624', color: '#5c67f7' },
    { label: 'Desktop', value: '1,267', color: '#23b7e5' },
    { label: 'Laptop', value: '1,153', color: '#f5b849' },
    { label: 'Tablet', value: '679', color: '#26bf94' }
  ];

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="card-header">
        <h3 className="card-title">Leads By Source</h3>
      </div>

      <div style={{ position: 'relative', width: '180px', height: '180px', margin: '1rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="180" height="180" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="38" stroke="#5c67f7" strokeWidth="12" fill="none" strokeDasharray="238" strokeDashoffset="60" />
          <circle cx="50" cy="50" r="38" stroke="#23b7e5" strokeWidth="12" fill="none" strokeDasharray="238" strokeDashoffset="120" />
          <circle cx="50" cy="50" r="38" stroke="#f5b849" strokeWidth="12" fill="none" strokeDasharray="238" strokeDashoffset="170" />
          <circle cx="50" cy="50" r="38" stroke="#26bf94" strokeWidth="12" fill="none" strokeDasharray="238" strokeDashoffset="210" />
        </svg>

        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>4,145</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        {sources.map(src => (
          <div key={src.label} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: src.color }} />
              <span>{src.label}</span>
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, marginLeft: '1rem', color: 'var(--text-primary)' }}>
              {src.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
