import React from 'react';
import { apiCall } from '../../api';

const CpInfoModal = ({
  cpInfoModal,
  setCpInfoModal,
  deleteCpConfirm,
  setDeleteCpConfirm,
  isDeletingCp,
  setIsDeletingCp,
  cpWarningModal,
  setCpWarningModal,
  setCreateNewCpMode,
  setEditingCpLeaveId,
  setCpAgentId,
  setCpAgentName,
  setCpStartDate,
  setCpEndDate,
  setShowCpModal,
  setLeaves,
  loadSiteData
}) => {
  return (
    <>
      {cpInfoModal && (
        <div className="modal-overlay" onClick={() => setCpInfoModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)', padding: '2rem', borderRadius: '24px', maxWidth: '450px', width: '90%', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.8rem' }}>🏖️</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#c4b5fd', fontSize: '1.3rem', fontWeight: 700 }}>Détails du Congé</h3>
                  <div style={{ color: '#fff', fontSize: '0.9rem', opacity: 0.8 }}>Agent : {cpInfoModal.agent.name}</div>
                </div>
              </div>
              <button onClick={() => setCpInfoModal(null)} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.2s', cursor: 'default' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span style={{ color: '#a78bfa', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Période</span>
                  <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>
                    Du {cpInfoModal.leave.start_date.split('-').reverse().join('/')} au {cpInfoModal.leave.end_date.split('-').reverse().join('/')}
                  </div>
                </div>
              </div>

              {cpInfoModal.leave.id && cpInfoModal.leave.id.includes('_') && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.2s', cursor: 'default' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Enregistré le</span>
                    <div style={{ color: '#e5e7eb', fontSize: '1rem', fontWeight: 500 }}>
                      {(() => {
                        const tsStr = cpInfoModal.leave.id.split('_')[1];
                        const ts = parseInt(tsStr, 10);
                        if (!isNaN(ts)) {
                          const date = new Date(ts);
                          return date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        }
                        return 'Date inconnue';
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setCpInfoModal(null)}
                style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', flex: 1 }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >Fermer</button>
              <button onClick={() => {
                const { agent, leave } = cpInfoModal;
                setCpInfoModal(null);
                setCreateNewCpMode(false);
                setEditingCpLeaveId(leave.id || null);
                setCpAgentId(agent.id);
                setCpAgentName(agent.name);
                setCpStartDate(leave.start_date);
                setCpEndDate(leave.end_date);
                setShowCpModal(true);
              }}
                style={{ padding: '12px 20px', background: '#8b5cf6', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(139,92,246,0.3)', flex: 1 }}
                onMouseOver={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#8b5cf6'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >Modifier</button>
              <button onClick={() => setDeleteCpConfirm(cpInfoModal)}
                style={{ padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', flex: 1 }}
                onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
              >Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {deleteCpConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={() => !isDeletingCp && setDeleteCpConfirm(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} />
          <div style={{ position: 'relative', background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '24px', padding: '2rem', maxWidth: '450px', width: '100%', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7)', animation: 'fadeIn 0.2s ease-out' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#f87171', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⚠️</div>
              Confirmation
            </h3>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '1.05rem', lineHeight: 1.6 }}>
                Voulez-vous vraiment supprimer ce congé ? L'agent retrouvera ses vacations d'origine sur cette période.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setDeleteCpConfirm(null)} 
                disabled={isDeletingCp}
                style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontWeight: 600, cursor: isDeletingCp ? 'not-allowed' : 'pointer', opacity: isDeletingCp ? 0.5 : 1, transition: 'all 0.2s' }}
                onMouseOver={e => { if(!isDeletingCp) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={e => { if(!isDeletingCp) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >Non, annuler</button>
              <button 
                disabled={isDeletingCp}
                onClick={async () => {
                  setIsDeletingCp(true);
                  try {
                    const res = await apiCall('delete_leave', { leave_id: deleteCpConfirm.leave.id });
                    if (res.success) {
                      setDeleteCpConfirm(null);
                      setCpInfoModal(null);
                      const leavesRes = await apiCall('get_leaves', {}, 'GET');
                      if (leavesRes && leavesRes.success) setLeaves(leavesRes.leaves || []);
                      await loadSiteData();
                    } else {
                      alert(res.message || 'Erreur lors de la suppression');
                    }
                  } catch(e) {
                    alert('Erreur de connexion');
                  } finally {
                    setIsDeletingCp(false);
                  }
                }}
                style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 600, cursor: isDeletingCp ? 'not-allowed' : 'pointer', opacity: isDeletingCp ? 0.7 : 1, transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                onMouseOver={e => { if(!isDeletingCp) e.currentTarget.style.background = '#dc2626'; }}
                onMouseOut={e => { if(!isDeletingCp) e.currentTarget.style.background = '#ef4444'; }}
              >
                {isDeletingCp ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Suppression...
                  </>
                ) : 'Oui, supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cpWarningModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={() => setCpWarningModal(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', zIndex: 1, background: '#1e293b', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '20px', padding: '30px', maxWidth: '420px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.7)', animation: 'fadeIn 0.2s ease-out' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#60a5fa', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span> Congé déjà existant
            </h3>
            <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '25px' }}>
              L'agent <strong style={{ color: '#fff' }}>{cpWarningModal.agent.name}</strong> a déjà un Congé Payé enregistré du <strong style={{ color: '#fff' }}>{cpWarningModal.existingLeave.start_date.split('-').reverse().join('/')}</strong> au <strong style={{ color: '#fff' }}>{cpWarningModal.existingLeave.end_date.split('-').reverse().join('/')}</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                className="hover-bg-light"
                style={{ padding: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', fontWeight: 600 }}
                onClick={() => {
                  setCreateNewCpMode(false);
                  setCpAgentId(cpWarningModal.agent.id);
                  setCpAgentName(cpWarningModal.agent.name);
                  setCpStartDate(cpWarningModal.existingLeave.start_date);
                  setCpEndDate(cpWarningModal.existingLeave.end_date);
                  setCpWarningModal(null);
                  setShowCpModal(true);
                }}
              >
                ✏️ Modifier l'ancien congé
              </button>
              <button
                style={{ padding: '12px', background: '#3b82f6', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
                onClick={() => {
                  setCreateNewCpMode(true);
                  setCpAgentId(cpWarningModal.agent.id);
                  setCpAgentName(cpWarningModal.agent.name);
                  setCpStartDate(cpWarningModal.dateKey);
                  setCpEndDate(cpWarningModal.dateKey);
                  setCpWarningModal(null);
                  setShowCpModal(true);
                }}
              >
                ➕ Créer un nouveau à cette date
              </button>
              <button
                style={{ padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginTop: '4px', fontWeight: 600 }}
                onClick={() => setCpWarningModal(null)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CpInfoModal;
