import React from 'react';
import { TargetProgressCard } from './TargetProgressCard';
import { RevenueAnalyticsChart } from './RevenueAnalyticsChart';
import { LeadsDonutChart } from './LeadsDonutChart';
import { TopDealsList } from './TopDealsList';
import { StatCard } from '../../components/StatCard';
import { DataTable, type TableRowData } from '../../components/DataTable';

import { Users, DollarSign, Percent, Briefcase } from 'lucide-react';

const mockTableData: TableRowData[] = [
  { id: '1', name: 'Mayor Kelly', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80', category: 'Manufacture', email: 'mayorkelly@gmail.com', location: 'Germany', date: 'Sep 15 - Oct 12, 2023', status: 'completed' },
  { id: '2', name: 'Andrew Garfield', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80', category: 'Development', email: 'andrewgarfield@gmail.com', location: 'Canada', date: 'Apr 10 - Dec 12, 2023', status: 'active' },
  { id: '3', name: 'Simon Cowel', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80', category: 'Service', email: 'simoncowel234@gmail.com', location: 'Europe', date: 'Sep 15 - Oct 12, 2023', status: 'pending' },
  { id: '4', name: 'Mirinda Hers', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80', category: 'Marketing', email: 'mirindahers@gmail.com', location: 'USA', date: 'Apr 14 - Dec 14, 2023', status: 'completed' },
  { id: '5', name: 'Jacob Smith', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&q=80', category: 'Social Plataform', email: 'jacobsmith@gmail.com', location: 'Singapore', date: 'Feb 25 - Nov 25, 2023', status: 'active' }
];

export const CrmDashboard: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Welcome back, Json Taylor !
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Track your sales activity, leads and deals here.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary">Filters</button>
          <button className="btn btn-outline">Export</button>
        </div>
      </div>

      <div className="grid-cols-12">
        <div className="col-span-4">
          <TargetProgressCard />
        </div>
        <div className="col-span-4 grid-cols-12" style={{ gridColumn: 'span 8', gap: '1rem' }}>
          <div className="col-span-6">
            <StatCard title="Total Customers" value="1,02,890" trend="+40%" isPositive={true} icon={Users} color="#5c67f7" />
          </div>
          <div className="col-span-6">
            <StatCard title="Total Revenue" value="$56,562" trend="+25%" isPositive={true} icon={DollarSign} color="#23b7e5" />
          </div>
          <div className="col-span-6">
            <StatCard title="Conversion Ratio" value="12.08%" trend="-12%" isPositive={false} icon={Percent} color="#26bf94" />
          </div>
          <div className="col-span-6">
            <StatCard title="Total Deals" value="2,543" trend="+19%" isPositive={true} icon={Briefcase} color="#f5b849" />
          </div>
        </div>
      </div>

      <div className="grid-cols-12">
        <div className="col-span-3">
          <TopDealsList />
        </div>
        <div className="col-span-6">
          <RevenueAnalyticsChart />
        </div>
        <div className="col-span-3">
          <LeadsDonutChart />
        </div>
      </div>

      <div className="grid-cols-12">
        <div className="col-span-12">
          <DataTable data={mockTableData} />
        </div>
      </div>
    </div>
  );
};
