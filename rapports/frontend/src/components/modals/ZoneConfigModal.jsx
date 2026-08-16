import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function ZoneConfigModal({
  zoneConfigModalData,
  setZoneConfigModalData,
  functions,
  setShowManageFunctionsModal,
  handleUpdateSubsiteConfig
}) {
  const [isFunctionsExpanded, setIsFunctionsExpanded] = useState(false);
  const [isRuptureExpanded, setIsRuptureExpanded] = useState(false);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <h3 style={{ marginBottom: '16px', color: 'white', fontSize: '1.4rem' }}>Configuration de la zone</h3>
        <p style={{ marginBottom: '20px', color: 'var(--muted)', fontSize: '1.05rem' }}>Zone : <strong style={{ color: 'white' }}>{zoneConfigModalData.name}</strong></p>
        
        <label 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div>
            <strong style={{ display: 'block', color: 'var(--text)', fontSize: '1.05rem', marginBottom: '4px' }}>Bouton "Costume"</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Afficher le bouton Costume</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              checked={zoneConfigModalData.costume_enabled === 1}
              onChange={(e) => setZoneConfigModalData({ ...zoneConfigModalData, costume_enabled: e.target.checked ? 1 : 0 })}
              style={{ width: '22px', height: '22px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>
        </label>

        <div 
          onClick={() => setIsFunctionsExpanded(!isFunctionsExpanded)}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '24px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}
        >
          <h4 style={{ color: 'white', fontSize: '1.2rem', margin: 0, flex: 1 }}>Fonctions (Postes)</h4>
          {isFunctionsExpanded ? <ChevronDown size={20} color="white" /> : <ChevronRight size={20} color="white" />}
        </div>

        {isFunctionsExpanded && (
          <div style={{ animation: 'fadeInDown 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px', marginBottom: '32px' }}>
              {functions.map(f => {
                 if (f.type === 'admin') return null; // Ne pas afficher les rôles admin
                 const isEnabled = Array.isArray(zoneConfigModalData.enabled_functions) && zoneConfigModalData.enabled_functions.includes(f.id);
                 return (
                     <label 
                       key={f.id} 
                       style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.03)', padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                       onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)'; }}
                       onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                     >
                       <div>
                         <strong style={{ display: 'block', color: 'var(--text)', fontSize: '0.95rem' }}>
                           {f.icon !== undefined ? f.icon : ({'AS': '👤', 'GA': '🔫', 'MC': '🐕', 'CP': '⭐', 'Q': '⏱️', 'D': '👟', 'VT': '🚘'}[f.id] || '')} {f.fullName || f.id} <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 'normal', marginLeft: '4px' }}>({f.id})</span>
                         </strong>
                       </div>
                     <div style={{ display: 'flex', alignItems: 'center' }}>
                       <input 
                         type="checkbox" 
                         checked={isEnabled}
                         onChange={(e) => {
                            let arr = Array.isArray(zoneConfigModalData.enabled_functions) ? [...zoneConfigModalData.enabled_functions] : [];
                            if (e.target.checked) arr.push(f.id);
                            else arr = arr.filter(id => id !== f.id);
                            setZoneConfigModalData({ ...zoneConfigModalData, enabled_functions: arr });
                         }}
                         style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                       />
                     </div>
                   </label>
                 );
              })}
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px dashed rgba(56, 189, 248, 0.4)', color: '#38bdf8', marginBottom: '20px' }}
              onClick={(e) => {
                e.preventDefault();
                setShowManageFunctionsModal(true);
              }}
            >
              ➕ Ajouter ou Gérer d'autres Postes
            </button>
          </div>
        )}

        <div 
          onClick={() => setIsRuptureExpanded(!isRuptureExpanded)}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '24px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}
        >
          <h4 style={{ color: '#ef4444', fontSize: '1.2rem', margin: 0, flex: 1 }}>Rupture / Fin de contrat</h4>
          {isRuptureExpanded ? <ChevronDown size={20} color="#ef4444" /> : <ChevronRight size={20} color="#ef4444" />}
        </div>

        {isRuptureExpanded && (
          <div style={{ animation: 'fadeInDown 0.3s ease', marginBottom: '32px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', marginBottom: '8px', fontWeight: 'bold' }}>Date de fin de contrat</label>
              <input 
                type="date" 
                className="form-input" 
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                value={zoneConfigModalData.contract_end_date || ''}
                onChange={(e) => setZoneConfigModalData({ ...zoneConfigModalData, contract_end_date: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.9)', marginBottom: '8px', fontWeight: 'bold' }}>Motif de rupture / fin</label>
              <textarea 
                className="form-input" 
                rows="3"
                placeholder="Indiquez la raison (ex: Fin de chantier, Non-renouvellement...)"
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', resize: 'vertical' }}
                value={zoneConfigModalData.contract_end_motif || ''}
                onChange={(e) => setZoneConfigModalData({ ...zoneConfigModalData, contract_end_motif: e.target.value })}
              ></textarea>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={() => setZoneConfigModalData(null)}>Annuler</button>
          <button className="btn btn-primary" onClick={async () => {
             await handleUpdateSubsiteConfig(
               zoneConfigModalData.id, 
               zoneConfigModalData.costume_enabled === 1, 
               zoneConfigModalData.enabled_functions || [],
               zoneConfigModalData.contract_end_date || null,
               zoneConfigModalData.contract_end_motif || null
             );
             setZoneConfigModalData(null);
          }}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
