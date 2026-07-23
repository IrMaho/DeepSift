import React, { useState } from 'react';
import { Sidebar, type DashboardTab } from './app/components/Sidebar';
import { Header } from './app/components/Header';

import { CrmDashboard } from './app/features/crm/CrmDashboard';
import { EcommerceDashboard } from './app/features/ecommerce/EcommerceDashboard';
import { CryptoDashboard } from './app/features/crypto/CryptoDashboard';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('crm');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);

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
        />
        <main className="page-container">
          {activeTab === 'crm' && <CrmDashboard />}
          {activeTab === 'ecommerce' && <EcommerceDashboard />}
          {activeTab === 'crypto' && <CryptoDashboard />}
        </main>
      </div>
    </div>
  );
};

export default App;
