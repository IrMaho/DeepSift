import React from 'react';
import { StatCard } from '../../components/StatCard';
import { Activity, Clock, RefreshCw, Eye } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const browserStats = [
    { name: 'Google Chrome', usage: '64.2%', users: '24,512' },
    { name: 'Mozilla Firefox', usage: '18.4%', users: '7,120' },
    { name: 'Apple Safari', usage: '12.1%', users: '4,650' },
    { name: 'Microsoft Edge', usage: '5.3%', users: '2,040' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Analytics & Web Traffic</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time user sessions, conversion funnel and device statistics.</p>
      </div>

      <div className="grid-cols-12">
        <div className="col-span-3">
          <StatCard title="ACTIVE USERS" value="42,512" trend="+14.2%" isPositive={true} icon={Activity} color="#5c67f7" />
        </div>
        <div className="col-span-3">
          <StatCard title="AVG SESSION DURATION" value="4m 32s" trend="+5.8%" isPositive={true} icon={Clock} color="#26bf94" />
        </div>
        <div className="col-span-3">
          <StatCard title="BOUNCE RATE" value="38.2%" trend="-3.1%" isPositive={true} icon={RefreshCw} color="#23b7e5" />
        </div>
        <div className="col-span-3">
          <StatCard title="TOTAL PAGE VIEWS" value="1,240,890" trend="+22.5%" isPositive={true} icon={Eye} color="#f5b849" />
        </div>
      </div>

      <div className="grid-cols-12">
        <div className="col-span-8 card">
          <div className="card-header">
            <h3 className="card-title">Audience Traffic Sources</h3>
          </div>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '1rem 0' }}>
            {[
              { label: 'Direct', val: 75, color: '#5c67f7' },
              { label: 'Search', val: 90, color: '#23b7e5' },
              { label: 'Social', val: 55, color: '#f5b849' },
              { label: 'Referral', val: 40, color: '#26bf94' },
              { label: 'Email', val: 65, color: '#8c57ff' }
            ].map(bar => (
              <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '40px', height: `${bar.val}%`, background: bar.color, borderRadius: '6px 6px 0 0' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-4 card">
          <div className="card-header">
            <h3 className="card-title">Top Browsers</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Browser</th>
                  <th>Share</th>
                  <th>Users</th>
                </tr>
              </thead>
              <tbody>
                {browserStats.map(b => (
                  <tr key={b.name}>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td><span className="badge badge-primary">{b.usage}</span></td>
                    <td style={{ fontWeight: 700 }}>{b.users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
