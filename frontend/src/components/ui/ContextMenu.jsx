import React from 'react';

export default function ContextMenu({
  contextMenu,
  onClose,
  onAction
}) {
  if (!contextMenu) return null;

  const isClassicTheme = document.body.getAttribute('data-theme') === 'classic';

  let defaultOpts = [
    { code: 'T', label: 'Agent Transféré (T)', color: '#f97316', type: 'cell', active: true, readonlyCode: false, group: 'Pointage Rapide' },
    { code: 'VISUAL_T', label: 'Transféré (Titulaire)', color: '#f97316', type: 'cell', active: true, readonlyCode: false, group: 'Pointage Rapide' },
    { code: 'CHGT_STATUT', label: 'Changement de statut', color: '#eab308', type: 'cell', active: true, readonlyCode: true, group: 'Pointage Rapide' },
    { code: 'DEPLOY_RELEVE', label: 'Déployer Relève (SP)', color: '#10b981', type: 'cell', active: true, readonlyCode: false, group: 'Pointage Rapide' },
    { code: 'SUPPL_REMPLACANT', label: 'Ajouter SP Externe', color: '#8b5cf6', type: 'cell', active: true, readonlyCode: false, group: 'Pointage Rapide' },
    { code: 'MOVE_ZONE', label: 'Changer la zone 🔄', color: '#0ea5e9', type: 'agent', active: true, readonlyCode: false, group: 'Pointage Rapide' },
    
    { code: 'A', label: 'Absence Injustifiée', color: '#ff0000', type: 'cell', active: true, readonlyCode: false, group: 'Absences & Congés', danger: true },
    { code: 'M', label: 'Maladie (M)', color: '#ff0000', type: 'cell', active: true, readonlyCode: false, group: 'Absences & Congés', danger: true },
    { code: 'CP', label: 'Congé Payé (CP)', color: '#3b82f6', type: 'cell', active: true, readonlyCode: true, group: 'Absences & Congés' },
    { code: 'P', label: 'Permission (P)', color: '#ff0000', type: 'cell', active: true, readonlyCode: false, group: 'Absences & Congés', danger: true },
    
    { code: 'MAP', label: 'Mise à pied (MAP) / Sanction', color: '#ff0000', type: 'cell', active: true, readonlyCode: false, group: 'Mesures RH', danger: true },

    
    { code: 'ENTRANT', label: 'Agent Entrant', color: '#10b981', type: 'cell', active: true, readonlyCode: false, group: 'Mouvements' },
    { code: 'SORTANT', label: 'Agent Sortant', color: '#f43f5e', type: 'cell', active: true, readonlyCode: false, group: 'Mouvements' },
    { code: 'DELETE_SORTANT', label: 'Annuler l\'abandon (Restaurer)', color: '#ff0000', type: 'cell', active: true, readonlyCode: false, group: 'Mouvements', danger: true },
    { code: 'MUT', label: 'Muter cet agent', color: 'white', type: 'agent', active: true, readonlyCode: true, group: 'Mouvements' },
    { code: 'CHGT_VAC', label: 'Changement de vacation', color: 'var(--c)', type: 'agent', active: true, readonlyCode: true, group: 'Mouvements' },
    
    { code: 'RENAME_AGENT', label: 'Modifier le nom de l\'agent', color: '#38bdf8', type: 'agent', active: true, readonlyCode: false, group: 'Dossier Agent' },
    { code: 'PROFILE', label: 'Consulter le profil complet', color: '#10b981', type: 'agent', active: true, readonlyCode: false, group: 'Dossier Agent' },
    
    { code: 'COPY_WEEK', label: 'Copier la semaine', color: '#6366f1', type: 'cell', active: true, readonlyCode: true, group: 'Actions Rapides' },
    { code: 'PASTE_WEEK', label: 'Coller la semaine', color: '#8b5cf6', type: 'cell', active: true, readonlyCode: true, group: 'Actions Rapides' }
  ];

  let activeOpts = defaultOpts;
  try {
    const saved = localStorage.getItem('pontage_context_menu_opts');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const activeMap = {};
        parsed.forEach(p => activeMap[p.code] = p);
        activeOpts = defaultOpts.map(d => activeMap[d.code] ? { ...d, ...activeMap[d.code] } : d);
      }
    }
  } catch(e) {}
  
  const filteredOpts = activeOpts
    .filter(opt => opt.active !== false)
    .filter(opt => {
      // Si c'est un clic sur un agent (pas de date), on ne garde que les types 'agent'
      if (!contextMenu.dateKey) return opt.type === 'agent';
      
      // Si c'est un clic sur une cellule avec statut d'abandon
      const isSortant = contextMenu.currentStatus && (
        ['ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT'].includes(contextMenu.currentStatus) || 
        String(contextMenu.currentStatus).startsWith('SORTANT_')
      );
      
      if (isSortant) {
        if (opt.code === 'DELETE_SORTANT') return true;
        return false;
      } else {
        if (opt.code === 'DELETE_SORTANT') return false;
        return true;
      }
    });

  if (contextMenu.currentStatus && (
    ['ABANDON', 'DEMISSION', 'RETIRE', 'LICENCIE', 'LICENCIE_ADMIN', 'FIN_CONTRAT'].includes(contextMenu.currentStatus) || 
    String(contextMenu.currentStatus).startsWith('SORTANT_')
  )) {
    let fullMotif = contextMenu.currentStatus;
    if (fullMotif === 'ABANDON') fullMotif = 'ABANDON DE SERVICE / POSTE';
    else if (fullMotif === 'DEMISSION') fullMotif = 'DÉMISSION';
    else if (fullMotif === 'RETIRE') fullMotif = "RETIRÉ DE L'EFFECTIF";
    else if (fullMotif === 'LICENCIE') fullMotif = 'LICENCIÉ';
    else if (fullMotif === 'LICENCIE_ADMIN') fullMotif = "LICENCIÉ PAR L'ADMINISTRATEUR";
    else if (fullMotif === 'FIN_CONTRAT') fullMotif = 'FIN DE STAGE/CONTRAT';
    else if (fullMotif.startsWith('SORTANT_')) fullMotif = fullMotif.substring(8).toUpperCase();

    return (
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', zIndex: 100000, 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 100vmax rgba(0,0,0,0.4)', 
        width: '380px', maxWidth: '95vw', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center'
      }}>
         <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e', fontSize: '1.8rem', marginBottom: '4px' }}>
            ℹ️
         </div>
         <h3 style={{ margin: 0, color: 'white', fontSize: '1.3rem', textAlign: 'center', fontWeight: 'bold' }}>Détails de la sortie</h3>
         <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '16px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motif complet enregistré</span>
            <strong style={{ color: '#f43f5e', fontSize: '1.15rem', letterSpacing: '0.5px' }}>{fullMotif}</strong>
         </div>
         <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textAlign: 'center', lineHeight: '1.5' }}>
            Cet agent a été déclaré comme définitivement sortant à partir de cette date.
         </p>
         
         <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '12px' }}>
            <button onClick={() => onClose()} style={{ flex: 1, padding: '12px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>Fermer</button>
            <button onClick={() => { onAction('EDIT_SORTANT', contextMenu); onClose(); }} style={{ flex: 1, padding: '12px 8px', background: '#3b82f6', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }} onMouseOver={e => e.currentTarget.style.background = '#2563eb'} onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}>Modifier</button>
            <button onClick={() => { onAction('DELETE_SORTANT', contextMenu); onClose(); }} style={{ flex: 1.5, padding: '12px 8px', background: '#f43f5e', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)' }} onMouseOver={e => e.currentTarget.style.background = '#e11d48'} onMouseOut={e => e.currentTarget.style.background = '#f43f5e'}>Annuler la sortie</button>
         </div>
      </div>
    );
  } else if (contextMenu.isEntrant || contextMenu.currentStatus === 'ENTRANT') {
    const eDateRaw = contextMenu.entrantDate || contextMenu.dateKey || '';
    let eDateFormatted = eDateRaw;
    if (eDateRaw) {
        const parts = eDateRaw.split('-');
        if (parts.length === 3) eDateFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return (
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', zIndex: 100000, 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 100vmax rgba(0,0,0,0.4)', 
        width: '380px', maxWidth: '95vw', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center'
      }}>
         <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.8rem', marginBottom: '4px' }}>
            ℹ️
         </div>
         <h3 style={{ margin: 0, color: 'white', fontSize: '1.3rem', textAlign: 'center', fontWeight: 'bold' }}>Agent Entrant</h3>
         <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '16px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date d'entrée fixée au</span>
            <strong style={{ color: '#10b981', fontSize: '1.15rem', letterSpacing: '0.5px' }}>{eDateFormatted || '...'}</strong>
         </div>
         <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textAlign: 'center', lineHeight: '1.5' }}>
            Cet agent est marqué comme nouvellement entré sur le site.
         </p>
         
         <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '12px' }}>
            <button onClick={() => onClose()} style={{ flex: 1, padding: '12px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>Fermer</button>
            <button onClick={() => { onAction('ENTRANT', contextMenu); onClose(); }} style={{ flex: 1, padding: '12px 8px', background: '#3b82f6', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }} onMouseOver={e => e.currentTarget.style.background = '#2563eb'} onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}>Modifier</button>
            <button onClick={() => { onAction('DELETE_ENTRANT', contextMenu); onClose(); }} style={{ flex: 1.5, padding: '12px 8px', background: '#f43f5e', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)' }} onMouseOver={e => e.currentTarget.style.background = '#e11d48'} onMouseOut={e => e.currentTarget.style.background = '#f43f5e'}>Annuler l'entrée</button>
         </div>
      </div>
    );
  }


  const groupedOpts = filteredOpts.reduce((acc, opt) => {
      const g = opt.label.charAt(0).toUpperCase();
      if (!acc[g]) acc[g] = [];
      acc[g].push(opt);
      return acc;
  }, {});

  const groupOrder = Object.keys(groupedOpts).sort();

  return (
    <div style={{
      position: 'fixed', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)', 
      background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', zIndex: 100000, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 100vmax rgba(0,0,0,0.2)', overflowY: 'auto', maxHeight: '90vh', display: 'flex', flexDirection: 'column', width: '800px', maxWidth: '95vw', padding: '12px'
    }}>
      {groupOrder.map((groupName, gIndex) => {
        let groupItems = groupedOpts[groupName];
        if (!groupItems || groupItems.length === 0) return null;
        
        // Trier par ordre alphabétique
        groupItems.sort((a, b) => a.label.localeCompare(b.label));
        
        return (
          <div key={groupName} style={{ marginBottom: gIndex < groupOrder.length - 1 ? '8px' : '0' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', padding: '0 8px 4px', letterSpacing: '0.1em', fontWeight: 700 }}>
              {groupName}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {groupItems.map(opt => (
                <button key={opt.code} style={{
                  padding: '8px 12px',
                  background: opt.danger && isClassicTheme ? '#ff0000' : 'rgba(255,255,255,0.04)',
                  border: opt.danger && isClassicTheme ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  color: opt.danger && isClassicTheme ? '#ffffff' : 'rgba(255,255,255,0.85)',
                  width: '100%',
                  textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }} onClick={(e) => {
                  onAction(opt.code, contextMenu);
                  onClose();
                }} onMouseOver={e => {
                    e.currentTarget.style.background = opt.danger && isClassicTheme ? '#cc0000' : 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                }}
                   onMouseOut={e => {
                    e.currentTarget.style.background = opt.danger && isClassicTheme ? '#ff0000' : 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: opt.danger && isClassicTheme ? '#ffffff' : opt.color, flexShrink: 0, opacity: 0.85 }}></span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
