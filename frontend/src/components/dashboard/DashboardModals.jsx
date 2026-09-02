import React, { Suspense } from 'react';
import { Edit2 } from 'lucide-react';
import ReleveScheduleModal from '../modals/ReleveScheduleModal';
import ReleveSupplModal from '../modals/ReleveSupplModal';
import ExternalSuppModal from '../modals/ExternalSuppModal';
import TransferModal from '../modals/TransferModal';
import ZoneConfigModal from '../modals/ZoneConfigModal';
import MoveAgentZoneModal from '../modals/MoveAgentZoneModal';
import ClosedMonthModal from '../modals/ClosedMonthModal';
import CpInfoModal from '../modals/CpInfoModal';
import PermissionDetailsModal from '../modals/PermissionDetailsModal';
import ExternalSuppDetailsModal from '../modals/ExternalSuppDetailsModal';
import TransferDetailsModal from '../modals/TransferDetailsModal';
import VerificationModal from '../modals/VerificationModal';
import PointageCalendarModal from '../modals/PointageCalendarModal';
import { apiCall } from '../../api'; // Make sure apiCall is imported

export default function DashboardModals({ state, actions }) {
  const {
    scheduleModalAgent, sites, period, releveSupplModal, externalSuppModal, siteData, activeSiteId,
    transferModal, zoneConfigModalData, functions, moveZoneAgent, showRenameAgentModal, renameAgentNewName,
    renameAgentTarget, showReadOnlyAlert, showClosedMonthModal, cpInfoModal, permissionDetailsModal,
    externalSuppDetailsModal, showTransferModal, transferModalData, showTransferDetailsModal, transferDetailsData,
    showVerificationModal, cycleStart, showCalendar
  } = state;

  const {
    setScheduleModalAgent, loadSiteData, setReleveSupplModal, handleCellClick, setExternalSuppModal,
    setTransferModal, setZoneConfigModalData, setShowManageFunctionsModal, handleUpdateSubsiteConfig,
    setMoveZoneAgent, loadDashboardData, setShowRenameAgentModal, setRenameAgentNewName, setShowReadOnlyAlert,
    setShowClosedMonthModal, setCpInfoModal, setPermissionDetailsModal, setExternalSuppDetailsModal,
    setShowTransferModal, setTransferModalData, setShowTransferDetailsModal, setTransferDetailsData,
    setShowVerificationModal, setShowCalendar
  } = actions;

  return (
    <>
              {/* ============ MODAL RELÈVE SUPPLÉMENTAIRE ============ */}
              {scheduleModalAgent && (
                <ReleveScheduleModal
                  agent={scheduleModalAgent}
                  sites={sites}
                  period={period}
                  onClose={() => setScheduleModalAgent(null)}
                  onSuccess={() => {
                    setScheduleModalAgent(null);
                    loadSiteData();
                  }}
                />
              )}

              {releveSupplModal && (
                <ReleveSupplModal
                  data={releveSupplModal}
                  sites={sites}
                  period={period}
                  onClose={() => setReleveSupplModal(null)}
                  onSubmit={(replacedAgentId, motif) => {
                    const newStatus = `REL_1|${releveSupplModal.destSite}|${replacedAgentId}|${motif}`;
                    handleCellClick(releveSupplModal.agentId, releveSupplModal.dateKey, releveSupplModal.shiftCode, releveSupplModal.status, newStatus);
                    setReleveSupplModal(null);
                  }}
                />
              )}

              {/* Modal : External Supp */}
              {externalSuppModal && (
                <ExternalSuppModal
                  period={period}
                  agents={siteData.flatMap(sub => sub.agents || [])} 
                  sites={sites}
                  currentSiteId={activeSiteId}
                  onClose={() => setExternalSuppModal(null)}
                  onSubmit={(data) => {
                    const payload = {
                      ...data,
                      period,
                      site_origine_id: activeSiteId
                    };
                    // 1. Injection IMMÉDIATE dans la mémoire pour un affichage instantané (0ms)
                    actions.injectOptimisticExternalSupp(payload);
                    
                    // 2. Fermeture immédiate de la modale
                    setExternalSuppModal(null);
                    
                    // 3. Envoi au serveur en arrière-plan
                    apiCall('add_external_supp', payload).then(res => {
                      if (res.success) {
                        loadDashboardData(true); // Rafraîchissement silencieux
                      } else {
                        alert(res.message || "Erreur lors de l'ajout du supplémentaire externe.");
                      }
                    }).catch(err => {
                      alert("Erreur réseau: " + err.message);
                    });
                  }}
                />
              )}

              {transferModal && (
                <TransferModal
                  data={transferModal}
                  sites={sites}
                  onClose={() => setTransferModal(null)}
                  onSubmit={(destSiteId) => {
                    const siteObj = sites.find(s => String(s.id) === String(destSiteId));
                    const destName = siteObj ? siteObj.name : destSiteId;
                    // 1. Save the T on the original site
                    handleCellClick(transferModal.agentId, transferModal.dateKey, transferModal.shiftCode, transferModal.currentStatus, 'T');
                    // 2. We also need to send REL_T| to the destination site.
                    apiCall('update_attendance', {
                      agent_id: transferModal.agentId,
                      date: transferModal.dateKey,
                      shift_code: transferModal.shiftCode,
                      status: 'REL_T|' + destName,
                      period: period
                    });
                    setTransferModal(null);
                  }}
                />
              )}

              {zoneConfigModalData && (
                <ZoneConfigModal
                  zoneConfigModalData={zoneConfigModalData}
                  setZoneConfigModalData={setZoneConfigModalData}
                  functions={functions}
                  setShowManageFunctionsModal={setShowManageFunctionsModal}
                  handleUpdateSubsiteConfig={handleUpdateSubsiteConfig}
                />
              )}

              {moveZoneAgent && (
                <MoveAgentZoneModal
                  isOpen={!!moveZoneAgent}
                  onClose={() => setMoveZoneAgent(null)}
                  agent={moveZoneAgent}
                  siteId={activeSiteId}
                  subsites={siteData}
                  onSuccess={() => {
                    setMoveZoneAgent(null);
                    loadDashboardData(true);
                  }}
                  onZoneCreated={loadDashboardData}
                />
              )}

              {/* Modal Rename Agent */}
              {showRenameAgentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: '#1e293b', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '16px', padding: '30px', width: '450px', maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                    <h3 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Edit2 size={24} color="#38bdf8" /> Modifier le nom de l'agent
                    </h3>
                    <div>
                      <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>Nouveau nom complet</label>
                      <input
                        type="text"
                        value={renameAgentNewName}
                        onChange={e => setRenameAgentNewName(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #475569', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1.1rem', outline: 'none' }}
                        autoFocus
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                      <button className="btn btn-secondary" onClick={() => setShowRenameAgentModal(false)} style={{ padding: '10px 20px' }}>Annuler</button>
                      <button className="btn btn-primary" onClick={async () => {
                        if (!renameAgentNewName.trim()) { alert("Le nom ne peut pas être vide"); return; }
                        try {
                          const res = await apiCall('update_agent_info', {
                            agent_id: renameAgentTarget.id, field: 'name', value: renameAgentNewName.trim(), period: period
                          });
                          if (res.success) { loadDashboardData(); setShowRenameAgentModal(false); }
                          else { alert("Erreur lors de la modification du nom : " + (res.message || res.error || 'Erreur inconnue')); }
                        } catch (e) { console.error(e); alert("Erreur de connexion"); }
                      }} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', border: 'none' }}>
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Read-Only Alert */}
              {showReadOnlyAlert && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <div style={{ background: '#1e293b', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '16px', padding: '30px', width: '400px', maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
                    <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '1.4rem' }}>Mode Lecture activé</h3>
                    <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.5', marginBottom: '24px' }}>
                      Le pointage est actuellement verrouillé contre les modifications.<br /><br />
                      Veuillez cliquer sur le bouton <strong>🔒 Mode Lecture</strong> (en haut de l'écran à côté du mois) pour le déverrouiller et pouvoir ajouter un agent.
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowReadOnlyAlert(false)} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', width: '100%', fontSize: '1.05rem', fontWeight: 'bold' }}>
                      J'ai compris
                    </button>
                  </div>
                </div>
              )}

              {/* ============ MODAL RELÈVE SUPPLÉMENTAIRE ============ */}
              {scheduleModalAgent && (
                <ReleveScheduleModal
                  agent={scheduleModalAgent}
                  sites={sites}
                  period={period}
                  onClose={() => setScheduleModalAgent(null)}
                  onSuccess={() => {
                    setScheduleModalAgent(null);
                    loadSiteData();
                  }}
                />
              )}

              {releveSupplModal && (
                <ReleveSupplModal
                  data={releveSupplModal}
                  sites={sites}
                  period={period}
                  onClose={() => setReleveSupplModal(null)}
                  onSubmit={(replacedAgentId, motif) => {
                    const newStatus = `REL_1|${releveSupplModal.destSite}|${replacedAgentId}|${motif}`;
                    handleCellClick(releveSupplModal.agentId, releveSupplModal.dateKey, releveSupplModal.shiftCode, releveSupplModal.status, newStatus);
                    setReleveSupplModal(null);
                  }}
                />
              )}

              {/* Modal : External Supp */}
              {externalSuppModal && (
                <ExternalSuppModal
                  period={period}
                  agents={siteData.flatMap(sub => sub.agents || [])} 
                  sites={sites}
                  currentSiteId={activeSiteId}
                  onClose={() => setExternalSuppModal(null)}
                  onSubmit={(data) => {
                    const payload = {
                      ...data,
                      period,
                      site_origine_id: activeSiteId
                    };
                    setExternalSuppModal(null);
                    apiCall('add_external_supp', payload).then(res => {
                      if (res.success) {
                        loadDashboardData(true); // silent=true
                      } else {
                        alert(res.message || "Erreur lors de l'ajout du supplémentaire externe.");
                      }
                    }).catch(err => {
                      alert("Erreur réseau: " + err.message);
                    });
                  }}
                />
              )}

              {transferModal && (
                <TransferModal
                  data={transferModal}
                  sites={sites}
                  onClose={() => setTransferModal(null)}
                  onSubmit={(destSiteId) => {
                    const siteObj = sites.find(s => String(s.id) === String(destSiteId));
                    const destName = siteObj ? siteObj.name : destSiteId;
                    // 1. Save the T on the original site
                    handleCellClick(transferModal.agentId, transferModal.dateKey, transferModal.shiftCode, transferModal.currentStatus, 'T');
                    // 2. We also need to send REL_T| to the destination site.
                    apiCall('update_attendance', {
                      agent_id: transferModal.agentId,
                      date: transferModal.dateKey,
                      shift_code: transferModal.shiftCode,
                      status: 'REL_T|' + destName,
                      period: period
                    });
                    setTransferModal(null);
                  }}
                />
              )}

              {zoneConfigModalData && (
                <ZoneConfigModal
                  zoneConfigModalData={zoneConfigModalData}
                  setZoneConfigModalData={setZoneConfigModalData}
                  functions={functions}
                  setShowManageFunctionsModal={setShowManageFunctionsModal}
                  handleUpdateSubsiteConfig={handleUpdateSubsiteConfig}
                />
              )}

              {moveZoneAgent && (
                <MoveAgentZoneModal
                  isOpen={!!moveZoneAgent}
                  onClose={() => setMoveZoneAgent(null)}
                  agent={moveZoneAgent}
                  siteId={activeSiteId}
                  subsites={siteData}
                  onSuccess={() => {
                    setMoveZoneAgent(null);
                    loadDashboardData(true);
                  }}
                  onZoneCreated={loadDashboardData}
                />
              )}

              {/* Modal Rename Agent */}
              {showRenameAgentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: '#1e293b', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '16px', padding: '30px', width: '450px', maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                    <h3 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Edit2 size={24} color="#38bdf8" /> Modifier le nom de l'agent
                    </h3>
                    <div>
                      <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '0.9rem' }}>Nouveau nom complet</label>
                      <input
                        type="text"
                        value={renameAgentNewName}
                        onChange={e => setRenameAgentNewName(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #475569', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1.1rem', outline: 'none' }}
                        autoFocus
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                      <button className="btn btn-secondary" onClick={() => setShowRenameAgentModal(false)} style={{ padding: '10px 20px' }}>Annuler</button>
                      <button className="btn btn-primary" onClick={async () => {
                        if (!renameAgentNewName.trim()) { alert("Le nom ne peut pas être vide"); return; }
                        try {
                          const res = await apiCall('update_agent_info', {
                            agent_id: renameAgentTarget.id, field: 'name', value: renameAgentNewName.trim(), period: period
                          });
                          if (res.success) { loadDashboardData(); setShowRenameAgentModal(false); }
                          else { alert("Erreur lors de la modification du nom : " + (res.message || res.error || 'Erreur inconnue')); }
                        } catch (e) { console.error(e); alert("Erreur de connexion"); }
                      }} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', border: 'none' }}>
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Read-Only Alert */}
              {showReadOnlyAlert && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <div style={{ background: '#1e293b', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '16px', padding: '30px', width: '400px', maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
                    <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '1.4rem' }}>Mode Lecture activé</h3>
                    <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.5', marginBottom: '24px' }}>
                      Le pointage est actuellement verrouillé contre les modifications.<br /><br />
                      Veuillez cliquer sur le bouton <strong>🔒 Mode Lecture</strong> (en haut de l'écran à côté du mois) pour le déverrouiller et pouvoir ajouter un agent.
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowReadOnlyAlert(false)} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', width: '100%', fontSize: '1.05rem', fontWeight: 'bold' }}>
                      J'ai compris
                    </button>
                  </div>
                </div>
              )}

              {showClosedMonthModal && (
                <ClosedMonthModal
                  onClose={() => setShowClosedMonthModal(false)}
                />
              )}

              {cpInfoModal && (
                <CpInfoModal
                  cpInfoModal={cpInfoModal}
                  actions={actions}
                />
              )}

              {permissionDetailsModal && (
                <PermissionDetailsModal
                  permissionDetailsModal={permissionDetailsModal}
                  actions={actions}
                />
              )}

              {externalSuppDetailsModal && (
                <ExternalSuppDetailsModal
                  data={externalSuppDetailsModal}
                  agents={siteData.flatMap(sub => sub.agents || [])}
                  onClose={(deleted) => {
                    setExternalSuppDetailsModal(null);
                    if (deleted) loadSiteData();
                  }}
                />
              )}

              {showTransferModal && (
                <TransferModal
                  data={transferModalData}
                  sites={sites}
                  period={period}
                  onClose={() => { setShowTransferModal(false); setTransferModalData(null); }}
                  onSave={async (mutation) => {
                    const { agentId, dateKey, shiftCode, targetSite, replacedAgent, motif } = mutation;
                    const newStatus = `T|${targetSite}|${replacedAgent}|${motif}`;
                    await handleCellClick(agentId, dateKey, shiftCode, '', newStatus);
                    setShowTransferModal(false);
                    setTransferModalData(null);
                  }}
                />
              )}

              {showTransferDetailsModal && (
                <TransferDetailsModal
                  data={transferDetailsData}
                  onClose={() => { setShowTransferDetailsModal(false); setTransferDetailsData(null); }}
                  onDelete={async (data) => {
                    await handleCellClick(data.agentId, data.dateKey, data.shiftCode, 'T', '1');
                    setShowTransferDetailsModal(false);
                    setTransferDetailsData(null);
                  }}
                />
              )}

              {/* ============ MODAL VERIFICATION STRICTE ============ */}
              {showVerificationModal && (
                <Suspense fallback={null}>
                  <VerificationModal 
                    sites={sites}
                    period={period}
                    cycleStart={cycleStart}
                    onClose={() => setShowVerificationModal(false)} 
                  />
                </Suspense>
              )}
              
              {showCalendar && (
                <PointageCalendarModal 
                  isOpen={showCalendar} 
                  onClose={() => setShowCalendar(false)} 
                  period={period} 
                />
              )}
    </>
  );
}
