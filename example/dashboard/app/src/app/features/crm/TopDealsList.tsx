import React from 'react';

export const TopDealsList: React.FC = () => {
  const deals = [
    { name: 'Michael Jordan', email: 'michael.jordan@example.com', amount: '$2,893', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80' },
    { name: 'Emigo Kiaren', email: 'emigo.kiaren@gmail.com', amount: '$4,289', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80' },
    { name: 'Randy Origoan', email: 'randy.origoan@gmail.com', amount: '$6,347', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80' },
    { name: 'George Pieterson', email: 'george.pieterson@gmail.com', amount: '$3,894', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&q=80' },
    { name: 'Kiara Advain', email: 'kiaraadvain214@gmail.com', amount: '$2,679', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80' }
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Top Deals</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {deals.map(deal => (
          <div key={deal.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src={deal.avatar} alt={deal.name} className="user-avatar" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{deal.name}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{deal.email}</span>
              </div>
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {deal.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
