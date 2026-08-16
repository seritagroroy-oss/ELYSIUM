import React from 'react';
import { CalendarDays, Loader2, Check } from 'lucide-react';

const PublishPointageModal = ({
  showPublishModal,
  setShowPublishModal,
  publishing,
  publishProgress,
  period,
  sites,
  stats,
  handlePublishPeriod,
  getSafePeriod,
}) => {
  if (!showPublishModal) return null;

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const [yr, mn] = getSafePeriod(period).split('-').map(Number);
  const monthName = monthNames[mn - 1];
  const startD = new Date(yr, mn - 2, 21);
  const endD = new Date(yr, mn - 1, 20);
  const fmtD = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={() => !publishing && setShowPublishModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
      {publishing ? (
        <div style={{
          position: 'relative', zIndex: 1,
          background: 'linear-gradient(145deg, #7f1d1d 0%, #450a0a 100%)',
          border: '1px solid rgba(239,68,68,0.5)', borderRadius: '24px', padding: '40px',
          maxWidth: '500px', width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 60px rgba(239,68,68,0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '20px', animation: 'pulse 2s infinite' }}>📡</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fef2f2', margin: '0 0 10px 0' }}>Publication en cours...</h2>
          <p style={{ color: 'rgba(254,226,226,0.7)', fontSize: '1rem', marginBottom: '30px' }}>Transmission sécurisée des données vers le serveur de traitement centralisé.</p>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#fca5a5', fontSize: '0.9rem', fontWeight: 700 }}>
            <span>Progression</span>
            <span>{publishProgress}%</span>
          </div>
          <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${publishProgress}%`, height: '100%', background: '#ef4444', transition: 'width 0.1s linear' }} />
          </div>
        </div>
      ) : (
        <div style={{
          position: 'relative', zIndex: 1,
          background: 'linear-gradient(145deg, #0a1628 0%, #111827 50%, #0f1a2e 100%)',
          border: '1px solid rgba(34,197,94,0.3)', borderRadius: '24px', padding: '28px 32px',
          maxWidth: '500px', width: '100%',
          maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 60px rgba(34,197,94,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '72px', height: '72px', margin: '0 auto 16px', background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(56,189,248,0.15))', border: '2px solid rgba(34,197,94,0.4)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 8px 25px rgba(34,197,94,0.2)' }}>🚀</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>Publier le pointage</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '6px' }}>
              Mois de <span style={{ color: '#22c55e', fontWeight: 700 }}>{monthName} {yr}</span>
            </p>
          </div>

          {/* Période card */}
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <CalendarDays size={28} style={{ color: '#22c55e', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Période concernée</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{fmtD(startD)} → {fmtD(endD)}</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>{sites.length}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Site(s)</div>
            </div>
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e' }}>{stats?.totalAgents ?? 0}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>Agent(s)</div>
            </div>
          </div>

          {/* Checklist */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>En publiant :</p>
            {[
              { icon: '📤', text: 'Le pointage sera visible pour le service de traitement' },
              { icon: '📦', text: 'Une archive automatique sera créée' },
              { icon: '🔒', text: 'Le bouton "Mois Suivant" sera débloqué' },
            ].map((item, i) => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.72)' }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowPublishModal(false)} disabled={publishing}
              style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >Annuler</button>
            <button
              onClick={() => handlePublishPeriod(true)}
              disabled={publishing}
              style={{
                flex: 2, padding: '14px', borderRadius: '12px',
                background: publishing ? 'rgba(34,197,94,0.3)' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff', border: 'none',
                cursor: publishing ? 'wait' : 'pointer',
                fontSize: '0.95rem', fontWeight: 700, transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
              onMouseEnter={e => { if (!publishing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(34,197,94,0.5)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(34,197,94,0.4)'; }}
            >
              {publishing ? (
                <><Loader2 size={18} className="animate-spin" /> Publication en cours...</>
              ) : (
                <><Check size={18} /> Confirmer la publication</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishPointageModal;
