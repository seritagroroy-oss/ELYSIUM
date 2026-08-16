import React from 'react';
import { CalendarDays, Edit } from 'lucide-react';

const NextMonthModal = ({
  showNextMonthModal,
  setShowNextMonthModal,
  period,
  sitesToKeepHS,
  setShowKeepHSModal,
  handleNextMonth,
  initializing,
  initProgress,
  getSafePeriod
}) => {
  if (!showNextMonthModal) return null;

  let [y, m] = getSafePeriod(period).split('-').map(Number);
  m += 1; 
  if (m > 12) { m = 1; y += 1; }
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const currentMonthName = monthNames[Number(getSafePeriod(period).split('-')[1]) - 1];
  const nextMonthName = monthNames[m - 1];

  const start = new Date(y, m - 2, 21);
  const end = new Date(y, m - 1, 20);
  const fmtDate = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={() => setShowNextMonthModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
      <div className="next-month-modal-container" style={{
        position: 'relative', zIndex: 1,
        background: 'linear-gradient(145deg, #0a1628 0%, #111827 50%, #0f1a2e 100%)',
        border: '1px solid rgba(245,158,11,0.4)', borderRadius: '24px', padding: '28px 32px',
        maxWidth: '500px', width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 60px rgba(245,158,11,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '72px', height: '72px', margin: '0 auto 16px', background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))', border: '2px solid rgba(245,158,11,0.4)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 8px 25px rgba(245,158,11,0.2)' }}>📅</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>Passage au mois suivant</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '6px' }}>{currentMonthName} → <span style={{ color: '#f59e0b', fontWeight: 700 }}>{nextMonthName} {y}</span></p>
        </div>

        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <CalendarDays size={28} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Nouvelle période de pointage</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{fmtDate(start)} → {fmtDate(end)}</div>
          </div>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Ce qui va se passer :</p>
          {[
            { icon: '✅', color: '#22c55e', text: 'La structure de vos sites et agents est conservée' },
            { icon: '✅', color: '#22c55e', text: 'Les vacations et fonctions sont maintenues' },
            { icon: '🗑️', color: '#ef4444', text: 'Les absences sont remises à zéro' },
            { icon: '🗑️', color: '#ef4444', text: 'Les heures supplémentaires sont effacées', hasEdit: true },
            { icon: '🔄', color: '#38bdf8', text: 'Le calendrier est recalculé pour la nouvelle période' }
          ].map((item, i) => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', flex: 1 }}>{item.text}</span>
              {item.hasEdit && (
                <button onClick={() => setShowKeepHSModal(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} title="Sélectionner les sites pour lesquels conserver les HS">
                  <Edit size={16} />
                  {sitesToKeepHS.length > 0 && <span style={{ fontSize: '0.75rem', background: '#eab308', color: '#000', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{sitesToKeepHS.length} site(s)</span>}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="next-month-buttons" style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowNextMonthModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>Annuler</button>
          <button onClick={handleNextMonth} disabled={initializing} style={{ flex: 2, padding: initializing ? '10px 14px' : '14px', borderRadius: '12px', background: initializing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', color: initializing ? 'rgba(255,255,255,0.8)' : '#fff', border: 'none', cursor: initializing ? 'not-allowed' : 'pointer', fontSize: '0.95rem', fontWeight: 700, transition: 'all 0.2s', boxShadow: initializing ? 'none' : '0 4px 20px rgba(245,158,11,0.4)', display: 'flex', flexDirection: initializing ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onMouseEnter={e => { if (!initializing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(245,158,11,0.5)'; } }} onMouseLeave={e => { if (!initializing) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.4)'; } }}>
            {initializing ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span>Initialisation en cours... {initProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${initProgress}%`, height: '100%', background: '#fff', transition: 'width 0.1s linear' }} />
                </div>
              </div>
            ) : (
              <><CalendarDays size={18} /> Confirmer — Passer à {nextMonthName}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NextMonthModal;
