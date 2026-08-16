import React from 'react';

const PublishSuccessModal = ({
  showPublishSuccess,
  setShowPublishSuccess,
  setShowPublishReport,
  period
}) => {
  if (!showPublishSuccess) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0f172a', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: 36, width: 440, boxShadow: '0 25px 60px rgba(0,0,0,0.7)', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
        {/* Icône succès animée */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2rem' }}>✅</div>
        <h2 style={{ margin: '0 0 8px 0', color: '#22c55e', fontSize: '1.3rem', fontWeight: 800 }}>Pointage Publié !</h2>
        <p style={{ margin: '0 0 6px 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
          Le pointage de <strong style={{ color: '#e2e8f0' }}>{(() => { const [y, m] = period.split('-'); return ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][parseInt(m) - 1] + ' ' + y; })()}</strong> a été publié avec succès.
        </p>
        <p style={{ margin: '0 0 28px 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Les agents du service vérification peuvent maintenant le consulter.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => { setShowPublishSuccess(false); setShowPublishReport(true); }}
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >📋 Voir le Rapport de Pointage</button>
          <button
            onClick={() => setShowPublishSuccess(false)}
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontWeight: 500, fontSize: '0.88rem' }}
          >Fermer</button>
        </div>
      </div>
    </div>
  );
};

export default PublishSuccessModal;
