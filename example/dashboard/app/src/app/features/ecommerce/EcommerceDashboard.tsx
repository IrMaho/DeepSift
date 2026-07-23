import React from 'react';
import { StatCard } from '../../components/StatCard';
import { ShoppingBag, CreditCard, Eye, Package } from 'lucide-react';

export const EcommerceDashboard: React.FC = () => {
  const topProducts = [
    { name: 'Ethnic School bag for children', category: 'Bags', stock: 'In Stock', sales: '5,093' },
    { name: 'Leather jacket for men (S,M,L,XL)', category: 'Clothing', stock: 'In Stock', sales: '6,890' },
    { name: 'Childrens Teddy toy of high quality', category: 'Toys', stock: 'Out Of Stock', sales: '5,423' },
    { name: 'Orange smart watch with square dial', category: 'Fashion', stock: 'Out Of Stock', sales: '10,234' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Ecommerce Dashboard</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Overview of sales, inventory and recent orders.</p>
        </div>
      </div>

      <div className="grid-cols-12">
        <div className="col-span-3">
          <StatCard title="Total Sales" value="14,732" trend="+4.2%" isPositive={true} icon={ShoppingBag} color="#5c67f7" />
        </div>
        <div className="col-span-3">
          <StatCard title="Total Expenses" value="$28,346.00" trend="+12.0%" isPositive={true} icon={CreditCard} color="#23b7e5" />
        </div>
        <div className="col-span-3">
          <StatCard title="Total Visitors" value="1,29,368" trend="-7.6%" isPositive={false} icon={Eye} color="#e6533c" />
        </div>
        <div className="col-span-3">
          <StatCard title="Total Orders" value="35,367" trend="+2.5%" isPositive={true} icon={Package} color="#f5b849" />
        </div>
      </div>

      <div className="grid-cols-12">
        <div className="col-span-4 card" style={{ background: 'linear-gradient(135deg, #111c43, #1e293b)', color: '#fff' }}>
          <span className="badge badge-warning" style={{ marginBottom: '0.5rem' }}>BIG SAVING DAYS</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Special Offer 10% Off</h3>
          <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: '0.5rem 0 1rem' }}>
            Bank Offer 10% off on Aches Bank Credit Cards on orders above $500.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary">Notify Me</button>
            <button className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>Offers</button>
          </div>
        </div>

        <div className="col-span-8 card">
          <div className="card-header">
            <h3 className="card-title">Top Selling Products</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map(p => (
                  <tr key={p.name}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="badge badge-primary">{p.category}</span></td>
                    <td>
                      <span className={`badge ${p.stock === 'In Stock' ? 'badge-success' : 'badge-danger'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.sales}</td>
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
