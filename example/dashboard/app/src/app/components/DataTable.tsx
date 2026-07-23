import React from 'react';
import { Download, Edit2 } from 'lucide-react';

export interface TableRowData {
  id: string;
  name: string;
  avatar: string;
  category: string;
  email: string;
  location: string;
  date: string;
  status: 'active' | 'pending' | 'completed';
}

interface DataTableProps {
  data: TableRowData[];
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  return (
    <div className="card" style={{ padding: '0' }}>
      <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
        <h3 className="card-title">Deals Statistics</h3>
        <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
          Sort By
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}><input type="checkbox" /></th>
              <th>Sales Rep</th>
              <th>Category</th>
              <th>Mail</th>
              <th>Location</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.id}>
                <td><input type="checkbox" /></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={row.avatar} alt={row.name} className="user-avatar" />
                    <span style={{ fontWeight: 600 }}>{row.name}</span>
                  </div>
                </td>
                <td>{row.category}</td>
                <td style={{ color: 'var(--text-muted)' }}>{row.email}</td>
                <td>
                  <span className="badge badge-info">{row.location}</span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.date}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.3rem', borderRadius: '6px' }}>
                      <Download size={14} color="var(--primary)" />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.3rem', borderRadius: '6px' }}>
                      <Edit2 size={14} color="var(--text-secondary)" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <span>Showing 5 Entries</span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Prev</button>
          <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>1</button>
          <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>2</button>
          <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>Next</button>
        </div>
      </div>
    </div>
  );
};
