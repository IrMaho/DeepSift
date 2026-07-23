import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Coins, 
  Briefcase, 
  BarChart3, 
  Image 
} from 'lucide-react';


export type DashboardTab = 'crm' | 'ecommerce' | 'crypto' | 'jobs' | 'nft' | 'analytics';

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, collapsed }) => {
  const menuItems = [
    { id: 'crm', label: 'CRM', icon: LayoutDashboard, badge: '12' },
    { id: 'ecommerce', label: 'Ecommerce', icon: ShoppingCart },
    { id: 'crypto', label: 'Crypto', icon: Coins },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'nft', label: 'NFT', icon: Image, badge: 'HOT' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <aside style={{
      width: collapsed ? '80px' : '240px',
      background: 'var(--bg-sidebar)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.25s ease-in-out',
      zIndex: 100
    }}>
      <div style={{
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.25rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #5c67f7, #e6533c)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: '#fff'
        }}>
          Y
        </div>
        {!collapsed && (
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
            ynex
          </span>
        )}
      </div>

      <div style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
        {!collapsed && (
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'rgba(255, 255, 255, 0.4)',
            margin: '0.5rem 0.5rem 0.75rem'
          }}>
            Main Dashboards
          </div>
        )}

        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as DashboardTab)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: '0.7rem 0.85rem',
                margin: '0.2rem 0',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(92, 103, 247, 0.2)' : 'transparent',
                color: isActive ? '#5c67f7' : 'rgba(255, 255, 255, 0.75)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: isActive ? 600 : 400
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} color={isActive ? '#5c67f7' : 'currentColor'} />
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && item.badge && (
                <span className={`badge ${item.badge === 'HOT' ? 'badge-danger' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
