import React from 'react';

export const TargetProgressCard: React.FC = () => {
  const percentage = 48;
  const strokeDashoffset = 283 - (283 * percentage) / 100;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #5c67f7, #8c57ff)',
      color: '#ffffff',
      borderRadius: 'var(--radius-md)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 8px 20px rgba(92, 103, 247, 0.3)'
    }}>
      <div style={{ zIndex: 2, maxWidth: '65%' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
          Your target is incomplete
        </h3>
        <p style={{ fontSize: '0.8rem', opacity: 0.9, lineHeight: 1.4 }}>
          You have completed 48% of the given target, you can also check your status.
        </p>
        <button className="btn" style={{
          background: '#ffffff',
          color: '#5c67f7',
          fontWeight: 600,
          fontSize: '0.8rem',
          marginTop: '1rem',
          padding: '0.4rem 0.9rem'
        }}>
          Click here
        </button>
      </div>

      <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="90" height="90" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="45" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="10" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#ffffff"
            strokeWidth="10"
            fill="none"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span style={{ position: 'absolute', fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>
          48%
        </span>
      </div>
    </div>
  );
};
