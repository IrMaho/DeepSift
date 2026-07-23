import React, { useState } from 'react';
import { StatCard } from '../../components/StatCard';
import { Wallet, Image, DollarSign, Layers } from 'lucide-react';

export const NftDashboard: React.FC = () => {
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  const auctions = [
    { id: '1', title: 'Color Abstract - NFT', author: 'Bloom NFT', bid: '0.19 ETH', timer: '04hrs : 24m : 38s', img: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&q=80' },
    { id: '2', title: 'Fluid Abstract - NFT', author: 'Ergos NFT', bid: '0.35 ETH', timer: '04hrs : 24m : 38s', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80' },
    { id: '3', title: 'Space Fluid - NFT', author: 'Caros NFT', bid: '0.13 ETH', timer: '04hrs : 24m : 38s', img: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80' },
    { id: '4', title: 'Fluid Abstract II', author: 'Daron NFT', bid: '0.75 ETH', timer: '04hrs : 24m : 38s', img: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&q=80' }
  ];

  const creators = [
    { name: 'Amanda Nanes', handle: '@amandananes', sold: 18, val: '$1,982' },
    { name: 'Charles Achilles', handle: '@charlesachilles', sold: 126, val: '$16,982' },
    { name: 'Julia Camo', handle: '@juliacamo', sold: 42, val: '$3,432' }
  ];

  const toggleFollow = (handle: string) => {
    setFollowing(prev => ({ ...prev, [handle]: !prev[handle] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card" style={{
        background: 'linear-gradient(135deg, #111c43, #5c67f7)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.75rem'
      }}>
        <div style={{ maxWidth: '60%' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Discover, collect and sell your <span style={{ color: '#f5b849' }}>NFTs</span> at one place
          </h2>
          <p style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '1.25rem' }}>
            NFT means non-fungible tokens, created using smart contract technology.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary">Discover Now</button>
            <button className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>Create Yours</button>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80"
          alt="NFT Banner"
          style={{ width: '130px', height: '130px', borderRadius: '16px', objectFit: 'cover' }}
        />
      </div>

      <div className="grid-cols-12">
        <div className="col-span-3">
          <StatCard title="TOTAL ASSETS" value="596" trend="+0.25%" isPositive={true} icon={Image} color="#5c67f7" />
        </div>
        <div className="col-span-3">
          <StatCard title="TOTAL SALES" value="821" trend="+1.52%" isPositive={true} icon={Layers} color="#26bf94" />
        </div>
        <div className="col-span-3">
          <StatCard title="TOTAL VALUE" value="$1,298" trend="+0.74%" isPositive={true} icon={DollarSign} color="#23b7e5" />
        </div>
        <div className="col-span-3">
          <StatCard title="YOUR BALANCE" value="$19,867.96" trend="+29.09%" isPositive={true} icon={Wallet} color="#f5b849" />
        </div>
      </div>

      <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Trending Auctions</h3>
      <div className="grid-cols-12">
        {auctions.map(item => (
          <div key={item.id} className="col-span-3 card" style={{ padding: '0.75rem' }}>
            <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', height: '160px' }}>
              <img src={item.img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span className="badge badge-primary" style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                {item.timer}
              </span>
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.author}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>{item.bid}</span>
                <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>Place Bid</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Top NFT Creators</h3>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Items Sold</th>
                <th>Total Value</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {creators.map(c => (
                <tr key={c.handle}>
                  <td style={{ fontWeight: 600 }}>{c.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.handle}</span></td>
                  <td>{c.sold}</td>
                  <td style={{ fontWeight: 700 }}>{c.val}</td>
                  <td>
                    <button
                      onClick={() => toggleFollow(c.handle)}
                      className={`btn ${following[c.handle] ? 'btn-outline' : 'btn-primary'}`}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    >
                      {following[c.handle] ? 'Unfollow' : 'Follow'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
