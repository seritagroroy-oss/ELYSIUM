import React from 'react';

const StatusChangeInfoModal = ({
  statusChangeInfoModal,
  setStatusChangeInfoModal,
  deleteStatusChangeConfirmAgent,
  setDeleteStatusChangeConfirmAgent,
  handleDeleteChgtStatut,
  executeDeleteChgtStatut,
  siteData,
  datesList,
  formatDateKey,
  salaryGrid
}) => {
  return (
    <>
      {statusChangeInfoModal && (() => {
        let scObj = {};
        try {
          scObj = JSON.parse(statusChangeInfoModal.status_change);
        } catch (e) { }

        let assigned_days_old = 0;
        let assigned_days_new = 0;
        let abs_old = 0;
        let abs_new = 0;
        let mutated_away_days = 0;
        let assigned_days = 0;

        const currentAgent = siteData.flatMap(s => s.agents || []).find(a => a.id === statusChangeInfoModal.id) || statusChangeInfoModal;
        const attMap = {};
        (currentAgent.attendance || []).forEach(att => {
          if (!attMap[att.shift_code]) attMap[att.shift_code] = {};
          attMap[att.shift_code][att.date] = att.status;
        });

        if (scObj && scObj.date) {
          datesList.forEach(d => {
            const dk = formatDateKey(d);
            const sJ = attMap['J']?.[dk] || '';
            const sN = attMap['N']?.[dk] || '';
            if (sJ !== '' || sN !== '') {
              assigned_days++;
              if (sJ.startsWith('M|') || sJ.startsWith('PM|') || sN.startsWith('M|') || sN.startsWith('PM|')) {
                mutated_away_days++;
              } else {
                if (dk < scObj.date) {
                  assigned_days_old++;
                  if (['A', 'MAP', 'P', 'AT', 'M', 'CP'].includes(sJ) || ['A', 'MAP', 'P', 'AT', 'M', 'CP'].includes(sN)) abs_old++;
                } else {
                  assigned_days_new++;
                  if (['A', 'MAP', 'P', 'AT', 'M', 'CP'].includes(sJ) || ['A', 'MAP', 'P', 'AT', 'M', 'CP'].includes(sN)) abs_new++;
                }
              }
            }
          });
        }

        const real_active = assigned_days - mutated_away_days;
        const total_assigned = assigned_days_old + assigned_days_new;
        let active_days_old = 0;
        let active_days_new = 0;
        let active_days_total = 0;

        if (datesList.length > 0) {
          active_days_total = Math.round((real_active * 30) / datesList.length);
          if (total_assigned > 0) {
            active_days_old = Math.round((assigned_days_old / total_assigned) * active_days_total);
            active_days_new = active_days_total - active_days_old;
          } else {
            let countOld = 0, countNew = 0;
            datesList.forEach(d => {
              if (formatDateKey(d) < scObj.date) countOld++;
              else countNew++;
            });
            active_days_old = Math.round((countOld / datesList.length) * active_days_total);
            active_days_new = active_days_total - active_days_old;
          }
        }

        const oldSalary = currentAgent.salary ? parseInt(currentAgent.salary) : (parseInt(salaryGrid[scObj.old_function]) || 75000);
        const newSalary = parseInt(salaryGrid[scObj.new_function]) || 75000;

        return (
          <div className="modal-overlay" onClick={() => setStatusChangeInfoModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)', padding: '2rem', borderRadius: '16px', maxWidth: '480px', width: '90%', border: '1px solid rgba(234,179,8,0.4)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#facc15', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Détails Changement Statut</h3>
              <p style={{ margin: '10px 0', color: 'white' }}><strong>Agent :</strong> {currentAgent.name}</p>
              <p style={{ margin: '10px 0', color: 'white' }}><strong>Ancienne Fonction :</strong> <span style={{ color: '#ef4444' }}>{scObj.old_function || '-'}</span> <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>(Salaire de base : {oldSalary.toLocaleString('fr-FR')} FCFA)</span></p>
              <p style={{ margin: '10px 0', color: 'white' }}><strong>Nouvelle Fonction :</strong> <span style={{ color: '#22c55e' }}>{scObj.new_function || '-'}</span> <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>(Salaire de base : {newSalary.toLocaleString('fr-FR')} FCFA)</span></p>
              <p style={{ margin: '10px 0', color: 'white' }}><strong>Date d'effet :</strong> {scObj.date ? scObj.date.split('-').reverse().join('/') : '-'}</p>
              <p style={{ margin: '10px 0', color: 'white' }}><strong>Motif :</strong> {scObj.reason || 'Non spécifié'}</p>

              <div style={{ marginTop: '15px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#facc15', fontSize: '0.95rem' }}>Démonstration du calcul de salaire (Prorata)</h4>
                <p style={{ margin: '5px 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  Le système répartit le salaire sur une base de 30 jours, en se basant sur les <strong>jours assignés</strong>. Les absences ne diminuent pas cette base de prorata, elles seront déduites lors du calcul final sur la fiche de paie.
                </p>
                <ul style={{ margin: '10px 0', paddingLeft: '20px', color: 'white', fontSize: '0.85rem' }}>
                  <li><strong>Jours assignés ({scObj.old_function || 'Ancienne'}) :</strong> {assigned_days_old} jour(s) {abs_old > 0 ? <span style={{ color: '#f87171' }}>(dont {abs_old} non travaillés/absents)</span> : ''}</li>
                  <li><strong>Jours assignés ({scObj.new_function || 'Nouvelle'}) :</strong> {assigned_days_new} jour(s) {abs_new > 0 ? <span style={{ color: '#f87171' }}>(dont {abs_new} non travaillés/absents)</span> : ''}</li>
                  <li style={{ marginTop: '8px' }}><strong>Base Prorata ({scObj.old_function || 'Ancienne'}) :</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{active_days_old} jour(s) de salaire</span></li>
                  <li><strong>Base Prorata ({scObj.new_function || 'Nouvelle'}) :</strong> <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{active_days_new} jour(s) de salaire</span></li>
                </ul>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <button 
                  onClick={() => handleDeleteChgtStatut(currentAgent)} 
                  style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.5)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  Supprimer
                </button>
                <button 
                  onClick={() => setStatusChangeInfoModal(null)} 
                  style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {deleteStatusChangeConfirmAgent && (
        <div className="modal-overlay" onClick={() => setDeleteStatusChangeConfirmAgent(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(8px)' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 100%)', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', border: '1px solid rgba(239,68,68,0.5)', boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Confirmation
            </h3>
            <p style={{ color: 'white', marginBottom: '20px', lineHeight: '1.5' }}>
              Êtes-vous sûr de vouloir supprimer le changement de statut pour cet agent sur la période actuelle ?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setDeleteStatusChangeConfirmAgent(null)} 
                style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                Annuler
              </button>
              <button 
                onClick={executeDeleteChgtStatut} 
                style={{ padding: '10px 16px', background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(239,68,68,0.3)' }}
                onMouseOver={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(239,68,68,0.4)'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(239,68,68,0.3)'; }}
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StatusChangeInfoModal;
