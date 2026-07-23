import React from 'react';

export const RevenueAnalyticsChart: React.FC = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const salesPath = "M 20,120 C 60,60 100,160 140,110 C 180,60 220,150 260,80 C 300,20 340,110 380,50 C 420,130 460,90 500,140";
  const revenuePath = "M 20,150 C 60,110 100,80 140,130 C 180,140 220,90 260,60 C 300,120 340,70 380,100 C 420,150 460,110 500,120";

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Revenue Analytics</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Revenue Analytics with sales & profit (USD)</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>View All</button>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '220px', margin: '1rem 0' }}>
        <svg width="100%" height="100%" viewBox="0 0 520 180" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          <line x1="20" y1="30" x2="500" y2="30" stroke="var(--border-color)" strokeDasharray="4 4" />
          <line x1="20" y1="70" x2="500" y2="70" stroke="var(--border-color)" strokeDasharray="4 4" />
          <line x1="20" y1="110" x2="500" y2="110" stroke="var(--border-color)" strokeDasharray="4 4" />
          <line x1="20" y1="150" x2="500" y2="150" stroke="var(--border-color)" strokeDasharray="4 4" />

          <path d={salesPath} fill="none" stroke="#5c67f7" strokeWidth="3.5" strokeLinecap="round" />
          <path d={revenuePath} fill="none" stroke="#23b7e5" strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" />
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', padding: '0 0.5rem' }}>
          {months.map(m => (
            <span key={m} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', fontSize: '0.8rem', paddingTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#5c67f7' }} />
          <span>Sales</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#23b7e5' }} />
          <span>Revenue</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f5b849' }} />
          <span>Profit</span>
        </div>
      </div>
    </div>
  );
};
