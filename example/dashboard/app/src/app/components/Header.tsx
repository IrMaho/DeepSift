import React from 'react';
import { Menu, Search, Moon, Sun, Bell, ShoppingBag, Globe } from 'lucide-react';


interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, onToggleDarkMode, onToggleSidebar }) => {
  return (
    <header style={{
      height: '70px',
      background: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.75rem',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-outline"
          style={{ padding: '0.4rem', borderRadius: '8px' }}
        >
          <Menu size={20} />
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--bg-main)',
          padding: '0.5rem 0.9rem',
          borderRadius: '20px',
          width: '280px',
          border: '1px solid var(--border-color)'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search Anything..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '0.85rem',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-outline" style={{ padding: '0.45rem', borderRadius: '50%' }}>
          <Globe size={18} />
        </button>

        <button onClick={onToggleDarkMode} className="btn btn-outline" style={{ padding: '0.45rem', borderRadius: '50%' }}>
          {darkMode ? <Sun size={18} color="#f5b849" /> : <Moon size={18} />}
        </button>

        <button className="btn btn-outline" style={{ padding: '0.45rem', borderRadius: '50%', position: 'relative' }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '8px',
            height: '8px',
            background: 'var(--danger)',
            borderRadius: '50%'
          }} />
        </button>

        <button className="btn btn-outline" style={{ padding: '0.45rem', borderRadius: '50%' }}>
          <ShoppingBag size={18} />
        </button>

        <div style={{ height: '24px', width: '1px', background: 'var(--border-color)', margin: '0 0.25rem' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
            alt="Json Taylor"
            className="user-avatar"
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.2 }}>Json Taylor</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Web Designer</span>
          </div>
        </div>
      </div>
    </header>
  );
};
