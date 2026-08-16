import React from 'react';
import { Edit2 } from 'lucide-react';

export default function RenameAgentModal({
  renameAgentTarget,
  renameAgentNewName,
  setRenameAgentNewName,
  onClose,
  onSubmit
}) {
  return (
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
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '10px 20px' }}>Annuler</button>
          <button className="btn btn-primary" onClick={onSubmit} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', border: 'none' }}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
