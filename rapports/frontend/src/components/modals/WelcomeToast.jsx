import React from 'react';

export default function WelcomeToast({ showWelcomeToast, welcomeMonthName, onClose }) {
  if (!showWelcomeToast) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      zIndex: 99998, animation: 'slideUpFadeIn 0.5s ease',
      background: 'linear-gradient(135deg, #0f2744 0%, #1e3a5f 100%)',
      border: '1px solid rgba(34,197,94,0.4)',
      borderRadius: 16, padding: '20px 32px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.2)',
      display: 'flex', alignItems: 'center', gap: 16, minWidth: 340,
    }}>
      <style>{`@keyframes slideUpFadeIn { from { opacity:0; transform:translateX(-50%) translateY(30px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      {/* Icône */}
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🎉</div>
      {/* Texte */}
      <div>
        <div style={{ color: '#22c55e', fontWeight: 800, fontSize: '0.95rem', marginBottom: 3 }}>Bienvenue en {welcomeMonthName} !</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Le nouveau cycle de pointage est initialisé.</div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginTop: 2 }}>Vous pouvez commencer à saisir le pointage.</div>
      </div>
      {/* Bouton fermer */}
      <button
        onClick={onClose}
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.4)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, alignSelf: 'flex-start' }}
      >✕</button>
      {/* Barre de progression */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, background: 'rgba(34,197,94,0.4)', borderRadius: '0 0 16px 16px', animation: 'shrinkBar 5s linear forwards' }} />
      <style>{`@keyframes shrinkBar { from { width:100%; } to { width:0%; } }`}</style>
    </div>
  );
}
