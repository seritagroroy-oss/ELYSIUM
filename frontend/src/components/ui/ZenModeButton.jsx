import React from 'react';

export default function ZenModeButton({ isZenMode, setIsZenMode }) {
  return (
    <button
      onClick={() => setIsZenMode(!isZenMode)}
      title={isZenMode ? "Quitter le Mode Zen" : "Mode Zen (Plein écran)"}
      style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999,
        width: '56px', height: '56px', borderRadius: '50%',
        background: isZenMode ? 'rgba(56,189,248,0.2)' : '#1e293b',
        border: `1px solid ${isZenMode ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
        color: isZenMode ? '#38bdf8' : 'white', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)', transition: 'all 0.3s'
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <span style={{ fontSize: '1.4rem' }}>{isZenMode ? '🔍' : '👁️'}</span>
    </button>
  );
}
