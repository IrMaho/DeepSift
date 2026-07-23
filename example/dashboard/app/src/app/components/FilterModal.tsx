import React, { useState } from 'react';
import { X, Filter, RefreshCw } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: { dateRange: string; category: string; status: string }) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApplyFilters }) => {
  const [dateRange, setDateRange] = useState('this-month');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters({ dateRange, category, status });
    onClose();
  };

  const handleReset = () => {
    setDateRange('this-month');
    setCategory('all');
    setStatus('all');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ width: '420px', maxWidth: '90vw', padding: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>
            <Filter size={18} color="var(--primary)" />
            <span>Filter Dashboard Data</span>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.3rem', borderRadius: '50%' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Date Range</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
            >
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="this-year">This Year</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
            >
              <option value="all">All Categories</option>
              <option value="manufacture">Manufacture</option>
              <option value="development">Development</option>
              <option value="marketing">Marketing</option>
              <option value="service">Service</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)', marginTop: '0.25rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button onClick={handleReset} className="btn btn-outline" style={{ flex: 1 }}>
            <RefreshCw size={14} /> Reset
          </button>
          <button onClick={handleApply} className="btn btn-primary" style={{ flex: 1 }}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
