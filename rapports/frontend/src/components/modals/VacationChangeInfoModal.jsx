import React from 'react';
import { apiCall } from '../../api';

const VacationChangeInfoModal = ({
  shiftChangeInfoModal,
  setShiftChangeInfoModal,
  deleteShiftChangeConfirm,
  setDeleteShiftChangeConfirm,
  isDeletingShiftChange,
  setIsDeletingShiftChange,
  period,
  loadSiteData
}) => {
  return (
    <>
      {shiftChangeInfoModal && (() => {
        const { agent, changes } = shiftChangeInfoModal;
        const vacIcons = { 'Jour': '☀️', 'Nuit': '🌙', '24h': '🔄', '48h': '⏳', '72h': '⌛' };
        const vacColors = { 'Jour': '#facc15', 'Nuit': '#818cf8', '24h': '#34d399', '48h': '#f97316', '72h': '#ec4899' };
        return (
          <div className="modal-overlay" onClick={() => setShiftChangeInfoModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)', padding: '2rem', borderRadius: '16px', maxWidth: '460px', width: '90%', border: '1px solid rgba(56,189,248,0.4)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Changement(s) de Vacation
              </h3>
              <p style={{ margin: '0 0 1rem 0', color: 'white' }}><strong>Agent :</strong> {agent.name}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                {changes.map((ch, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${(vacColors[ch.type] || '#38bdf8')}30` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.5rem' }}>{vacIcons[ch.type] || '🔄'}</span>
                      <div>
                        <div style={{ color: vacColors[ch.type] || 'white', fontWeight: 'bold', fontSize: '0.95rem' }}>{ch.type}</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>À partir du {ch.from ? ch.from.split('-').reverse().join('/') : '-'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteShiftChangeConfirm({ agent, change: ch })}
                      style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShiftChangeInfoModal(null)}
                  style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >Fermer</button>
              </div>
            </div>
          </div>
        );
      })()}

      {deleteShiftChangeConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteShiftChangeConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(8px)' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', border: '1px solid rgba(239,68,68,0.5)', boxShadow: '0 25px 50px -12px rgba(239,68,68,0.25)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Confirmation
            </h3>
            <p style={{ color: 'white', marginBottom: '8px', lineHeight: '1.5' }}>Supprimer le changement de vacation :</p>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px' }}>
              <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{deleteShiftChangeConfirm.change.type}</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}> — à partir du {deleteShiftChangeConfirm.change.from?.split('-').reverse().join('/')}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteShiftChangeConfirm(null)}
                style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >Annuler</button>
              <button onClick={async () => {
                const { agent, change } = deleteShiftChangeConfirm;
                setIsDeletingShiftChange(true);
                try {
                  const res = await apiCall('delete_shift_change', { agent_id: agent.id, date: change.from, period: period });
                  if (res && res.success) {
                    setDeleteShiftChangeConfirm(null);
                    setShiftChangeInfoModal(null);
                    await loadSiteData();
                  } else alert(res?.message || 'Erreur lors de la suppression');
                } catch(e) { console.error(e); alert('Erreur de connexion'); }
                finally { setIsDeletingShiftChange(false); }
              }}
                disabled={isDeletingShiftChange}
                style={{ padding: '10px 16px', background: isDeletingShiftChange ? '#b91c1c' : '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: isDeletingShiftChange ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '8px', opacity: isDeletingShiftChange ? 0.85 : 1 }}
                onMouseOver={e => { if (!isDeletingShiftChange) { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(239,68,68,0.4)'; } }}
                onMouseOut={e => { if (!isDeletingShiftChange) { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(239,68,68,0.3)'; } }}
              >
                {isDeletingShiftChange ? (
                  <>
                    <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)"/><path d="M12 2a10 10 0 0 1 10 10" stroke="white"/></svg>
                    Suppression...
                  </>
                ) : 'Oui, supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VacationChangeInfoModal;
