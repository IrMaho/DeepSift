import React from 'react';
import { StatCard } from '../../components/StatCard';
import { Coins, ArrowRightLeft } from 'lucide-react';


export const CryptoDashboard: React.FC = () => {
  const transactions = [
    { coin: 'Bitcoin', type: 'Buy', amount: '+19,123.02 USD', date: 'Dec 15', status: 'Sent' },
    { coin: 'Ethereum', type: 'Sell', amount: '-1,430.92 USD', date: 'Dec 24', status: 'Received' },
    { coin: 'Dash', type: 'Buy', amount: '+5,236.53 USD', date: 'Dec 02', status: 'Received' },
    { coin: 'Monero', type: 'Sell', amount: '+1,256.24 USD', date: 'Nov 29', status: 'Processing' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Crypto Market & Portfolio</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time cryptocurrency statistics and instant trading.</p>
        </div>
      </div>

      <div className="grid-cols-12">
        <div className="col-span-4">
          <StatCard title="Bitcoin - BTC" value="$35,876.29" trend="+2.33%" isPositive={true} icon={Coins} color="#f5b849" />
        </div>
        <div className="col-span-4">
          <StatCard title="Ethereum - ETH" value="$31,244.12" trend="+13.45%" isPositive={true} icon={Coins} color="#5c67f7" />
        </div>
        <div className="col-span-4">
          <StatCard title="Dash - DASH" value="$26,345.000" trend="+112.95%" isPositive={true} icon={Coins} color="#23b7e5" />
        </div>
      </div>

      <div className="grid-cols-12">
        <div className="col-span-8 card">
          <div className="card-header">
            <h3 className="card-title">Recent Transactions</h3>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem' }}>View All</button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cryptocurrency</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.coin + t.date}>
                    <td style={{ fontWeight: 600 }}>{t.coin}</td>
                    <td>
                      <span className={`badge ${t.type === 'Buy' ? 'badge-success' : 'badge-danger'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{t.amount}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.date}</td>
                    <td><span className="badge badge-info">{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-4 card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card-header">
            <h3 className="card-title">Quick Trade</h3>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" style={{ flex: 1 }}>Buy</button>
            <button className="btn btn-outline" style={{ flex: 1 }}>Sell</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Select Currency</label>
            <select style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
              <option>Bitcoin (BTC)</option>
              <option>Ethereum (ETH)</option>
              <option>Dash (DASH)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Amount (USD)</label>
            <input type="number" defaultValue={36335} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }} />
          </div>

          <button className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
            <ArrowRightLeft size={16} /> Execute Buy
          </button>
        </div>
      </div>
    </div>
  );
};
