import React, { useState } from 'react';
import { Sidebar, type DashboardTab } from './app/components/Sidebar';
import { Header } from './app/components/Header';
import { FilterModal } from './app/components/FilterModal';
import { CrmDashboard } from './app/features/crm/CrmDashboard';
import { EcommerceDashboard } from './app/features/ecommerce/EcommerceDashboard';
import { CryptoDashboard } from './app/features/crypto/CryptoDashboard';
import { JobsDashboard } from './app/features/jobs/JobsDashboard';
import { NftDashboard } from './app/features/nft/NftDashboard';
import { AnalyticsDashboard } from './app/features/analytics/AnalyticsDashboard';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('crm');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={collapsed}
      />
      <div className="main-content">
        <Header
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          onToggleSidebar={() => setCollapsed(!collapsed)}
          onOpenFilter={() => setIsFilterOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <main className="page-container">
          {activeTab === 'crm' && <CrmDashboard />}
          {activeTab === 'ecommerce' && <EcommerceDashboard />}
          {activeTab === 'crypto' && <CryptoDashboard />}
          {activeTab === 'jobs' && <JobsDashboard />}
          {activeTab === 'nft' && <NftDashboard />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
        </main>
      </div>

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={(filters) => {
          console.log('Applied filters:', filters);
        }}
      />
    </div>
  );
};

export default App;
