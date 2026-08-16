import React from 'react';
import { apiCall } from '../../api';

const PermissionDetailsModal = ({
  permissionDetailsModal,
  setPermissionDetailsModal,
  setEditingMapLeaveId,
  setMapAgentId,
  setMapAgentName,
  setMapStartDate,
  setMapEndDate,
  setMapNavOffset,
  setMapManualDuration,
  setShowMapModal,
  setEditingMaladieLeaveId,
  setMaladieAgentId,
  setMaladieAgentName,
  setMaladieStartDate,
  setMaladieEndDate,
  setShowMaladieModal,
  setEditingPermLeaveId,
  setPermissionAgentId,
  setPermissionAgentName,
  setPermissionStartDate,
  setPermissionEndDate,
  setShowPermissionModal,
  deletePermissionConfirm,
  setDeletePermissionConfirm,
  isDeletingPermission,
  setIsDeletingPermission,
  handleDeleteLeave,
  cycleStart,
  loadSiteData
}) => {
  return (
    <>
      {permissionDetailsModal && (
        <div className="modal-overlay" onClick={() => setPermissionDetailsModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: permissionDetailsModal.type === 'MAP' ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' : (permissionDetailsModal.type === 'M' ? 'linear-gradient(145deg, #2a0f17 0%, #1e0f0f 100%)' : 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)'),
            border: permissionDetailsModal.type === 'MAP' ? '1px solid rgba(249,115,22,0.4)' : (permissionDetailsModal.type === 'M' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(14,165,233,0.4)'),
            borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '420px',
            boxShadow: permissionDetailsModal.type === 'MAP' ? '0 25px 50px -12px rgba(249,115,22,0.3)' : (permissionDetailsModal.type === 'M' ? '0 25px 50px -12px rgba(239,68,68,0.3)' : '0 25px 50px -12px rgba(14,165,233,0.3)'),
            position: 'relative', animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0,
                  background: permissionDetailsModal.type === 'MAP' ? 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(234,88,12,0.2))' : (permissionDetailsModal.type === 'M' ? 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(185,28,28,0.2))' : 'linear-gradient(135deg, rgba(56,189,248,0.25), rgba(14,165,233,0.2))'),
                  border: permissionDetailsModal.type === 'MAP' ? '1px solid rgba(249,115,22,0.3)' : (permissionDetailsModal.type === 'M' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(14,165,233,0.3)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
                  boxShadow: permissionDetailsModal.type === 'MAP' ? '0 8px 16px rgba(234,88,12,0.2)' : (permissionDetailsModal.type === 'M' ? '0 8px 16px rgba(239,68,68,0.2)' : '0 8px 16px rgba(14,165,233,0.2)')
                }}>
                  {permissionDetailsModal.type === 'MAP' ? '⚖️' : (permissionDetailsModal.type === 'M' ? '🩺' : '🎟️')}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: permissionDetailsModal.type === 'MAP' ? '#fdba74' : (permissionDetailsModal.type === 'M' ? '#fca5a5' : '#7dd3fc'), fontSize: '1.3rem', fontWeight: 700 }}>
                    Détails {permissionDetailsModal.type === 'MAP' ? 'de la MAP' : (permissionDetailsModal.type === 'M' ? 'de la Maladie' : 'de la Permission')}
                  </h3>
                  <div style={{ color: '#fff', fontSize: '0.9rem', opacity: 0.8 }}>Agent : {permissionDetailsModal.agent_name || 'Inconnu'}</div>
                </div>
              </div>
              <button onClick={() => setPermissionDetailsModal(null)} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.2s', cursor: 'default' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <span style={{ color: permissionDetailsModal.type === 'MAP' ? '#fb923c' : '#38bdf8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Période</span>
                  <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>
                    Du {permissionDetailsModal.start_date.split('-').reverse().join('/')} au {permissionDetailsModal.end_date.split('-').reverse().join('/')}
                  </div>
                </div>
              </div>

              {permissionDetailsModal.id && permissionDetailsModal.id.includes('_') && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.2s', cursor: 'default' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Enregistré le</span>
                    <div style={{ color: '#e5e7eb', fontSize: '1rem', fontWeight: 500 }}>
                      {(() => {
                        const tsStr = permissionDetailsModal.id.split('_')[1];
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
              <button onClick={() => setPermissionDetailsModal(null)}
                style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', flex: 1 }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >Fermer</button>
              <button onClick={() => {
                const modalData = { ...permissionDetailsModal };
                setPermissionDetailsModal(null);
                if (modalData.type === 'MAP') {
                  setEditingMapLeaveId(modalData.id || null);
                  setMapAgentId(modalData.agent_id);
                  setMapAgentName(modalData.agent_name);
                  setMapStartDate(modalData.start_date);
                  setMapEndDate(modalData.end_date);
                  setMapNavOffset(0);
                  setMapManualDuration('');
                  setShowMapModal(true);
                } else if (modalData.type === 'M') {
                  setEditingMaladieLeaveId(modalData.id || null);
                  setMaladieAgentId(modalData.agent_id);
                  setMaladieAgentName(modalData.agent_name);
                  setMaladieStartDate(modalData.start_date);
                  setMaladieEndDate(modalData.end_date);
                  setShowMaladieModal(true);
                } else {
                  setEditingPermLeaveId(modalData.id || null);
                  setPermissionAgentId(modalData.agent_id);
                  setPermissionAgentName(modalData.agent_name);
                  setPermissionStartDate(modalData.start_date);
                  setPermissionEndDate(modalData.end_date);
                  setShowPermissionModal(true);
                }
              }}
                style={{ padding: '12px 20px', background: permissionDetailsModal.type === 'MAP' ? '#f97316' : (permissionDetailsModal.type === 'M' ? '#ef4444' : '#0ea5e9'), border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: permissionDetailsModal.type === 'MAP' ? '0 4px 12px rgba(249,115,22,0.3)' : '0 4px 12px rgba(14,165,233,0.3)', flex: 1 }}
                onMouseOver={e => { e.currentTarget.style.background = permissionDetailsModal.type === 'MAP' ? '#ea580c' : (permissionDetailsModal.type === 'M' ? '#dc2626' : '#0284c7'); e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseOut={e => { e.currentTarget.style.background = permissionDetailsModal.type === 'MAP' ? '#f97316' : (permissionDetailsModal.type === 'M' ? '#ef4444' : '#0ea5e9'); e.currentTarget.style.transform = 'translateY(0)'; }}
              >Modifier</button>
              <button
                onClick={() => {
                  const leaveType = permissionDetailsModal.type === 'MAP' ? 'cette MAP' : (permissionDetailsModal.type === 'M' ? 'cette Maladie' : 'cette Permission');
                  if (window.confirm(`Voulez-vous vraiment supprimer ${leaveType} ? L'agent retrouvera ses vacations d'origine sur cette période.`)) {
                    apiCall('delete_leave', { leave_id: permissionDetailsModal.id }).then(res => {
                      if (res && res.success) {
                        setPermissionDetailsModal(null);
                        const sCodes = ['J', 'N', 'S', 'SJ', 'SN'];
                        let cursor = new Date(permissionDetailsModal.start_date);
                        const end = new Date(permissionDetailsModal.end_date);
                        const pUpdates = [];
                        while (cursor <= end) {
                          const yyyy = cursor.getFullYear(); const mm = String(cursor.getMonth() + 1).padStart(2, '0'); const dd = String(cursor.getDate()).padStart(2, '0');
                          const dk = `${yyyy}-${mm}-${dd}`;
                          let pM = cursor.getMonth() + 1; let pY = yyyy;
                          if (cursor.getDate() >= cycleStart) { pM += 1; if (pM > 12) { pM = 1; pY += 1; } }
                          const properPeriod = `${pY}-${String(pM).padStart(2, '0')}`;
                          sCodes.forEach(sc => pUpdates.push({ agent_id: permissionDetailsModal.agent_id, date: dk, shift_code: sc, status: '', period: properPeriod }));
                          cursor.setDate(cursor.getDate() + 1);
                        }
                        apiCall('bulk_update_attendance', { updates: pUpdates }).then(() => {
                          loadSiteData();
                        });
                      }
                    });
                  }
                }}
                style={{ padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', flex: 1 }}
                onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
              >Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {deletePermissionConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={() => !isDeletingPermission && setDeletePermissionConfirm(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} />
          <div style={{ position: 'relative', background: deletePermissionConfirm.type === 'MAP' ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)', border: deletePermissionConfirm.type === 'MAP' ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(14,165,233,0.4)', borderRadius: '24px', padding: '2rem', maxWidth: '450px', width: '100%', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7)', animation: 'fadeIn 0.2s ease-out' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: deletePermissionConfirm.type === 'MAP' ? '#f97316' : '#0ea5e9', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: deletePermissionConfirm.type === 'MAP' ? 'rgba(249,115,22,0.2)' : 'rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⚠️</div>
              Confirmation
            </h3>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '1.05rem', lineHeight: 1.6 }}>
                Voulez-vous vraiment supprimer cette {deletePermissionConfirm.type === 'MAP' ? 'MAP' : 'Permission'} ? L'agent retrouvera ses vacations d'origine sur cette période.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setDeletePermissionConfirm(null)} 
                disabled={isDeletingPermission}
                style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontWeight: 600, cursor: isDeletingPermission ? 'not-allowed' : 'pointer', opacity: isDeletingPermission ? 0.5 : 1, transition: 'all 0.2s' }}
                onMouseOver={e => { if(!isDeletingPermission) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={e => { if(!isDeletingPermission) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >Non, annuler</button>
              <button 
                disabled={isDeletingPermission}
                onClick={async () => {
                  setIsDeletingPermission(true);
                  try {
                    await handleDeleteLeave(deletePermissionConfirm.leave);
                    setDeletePermissionConfirm(null);
                    setPermissionDetailsModal(null);
                  } catch (error) {
                    console.error('Error deleting leave:', error);
                    alert("Erreur de connexion lors de la suppression.");
                  } finally {
                    setIsDeletingPermission(false);
                  }
                }}
                style={{ flex: 1, padding: '12px', background: deletePermissionConfirm.type === 'MAP' ? '#f97316' : '#0ea5e9', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 600, cursor: isDeletingPermission ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: deletePermissionConfirm.type === 'MAP' ? '0 4px 12px rgba(249,115,22,0.3)' : '0 4px 12px rgba(14,165,233,0.3)' }}
                onMouseOver={e => { if(!isDeletingPermission) { e.currentTarget.style.background = deletePermissionConfirm.type === 'MAP' ? '#ea580c' : '#0284c7'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseOut={e => { if(!isDeletingPermission) { e.currentTarget.style.background = deletePermissionConfirm.type === 'MAP' ? '#f97316' : '#0ea5e9'; e.currentTarget.style.transform = 'translateY(0)'; } }}
              >
                {isDeletingPermission ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Suppression...
                  </div>
                ) : (
                  'Oui, supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PermissionDetailsModal;
