import React from 'react';

const FirstVisitModal = ({
  showFirstVisitModal,
  period,
  getSafePeriod,
  handleFirstVisitNon,
  handleFirstVisitOui
}) => {
  if (!showFirstVisitModal) return null;

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const safePeriod = getSafePeriod ? getSafePeriod(period) : period;
  const [y, m] = safePeriod.split('-').map(Number);
  const currentMonthName = monthNames[m - 1];
  const nextD = new Date(y, m, 1);
  const nextMonthName = monthNames[nextD.getMonth()];
  const nextYear = nextD.getFullYear();

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} />
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(56,189,248,0.3)', borderRadius: '24px', padding: '32px',
        maxWidth: '520px', width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗓️</div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginBottom: '16px' }}>Première connexion — Pointage</h2>
        <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '16px' }}>
          Avez-vous déjà <strong>traité et publié</strong> le pointage du mois de{' '}
          <strong style={{ color: '#38bdf8' }}>{currentMonthName} {y}</strong> ?
        </p>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
          Si oui, nous basculons directement sur <strong style={{ color: 'white' }}>{nextMonthName} {nextYear}</strong> pour le nouveau cycle.<br />
          Si non, vous travaillerez sur <strong style={{ color: 'white' }}>{currentMonthName} {y}</strong> normalement.
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleFirstVisitNon} className="btn btn-secondary" style={{ flex: 1, padding: '12px', fontSize: '0.95rem' }}>
            ❌ Non, commencer {currentMonthName}
          </button>
          <button onClick={handleFirstVisitOui} className="btn btn-primary" style={{ flex: 1, padding: '12px', fontSize: '0.95rem' }}>
            ✅ Oui, passer à {nextMonthName}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirstVisitModal;
