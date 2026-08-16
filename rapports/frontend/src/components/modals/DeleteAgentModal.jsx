import React from 'react';
import { Trash2 } from 'lucide-react';

export default function DeleteAgentModal({
  onClose,
  onConfirm
}) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#ef4444' }}>
          <Trash2 size={32} />
        </div>
        <h3 style={{ marginBottom: '10px' }}>Supprimer l'agent ?</h3>
        <p className="subtitle" style={{ marginBottom: '24px' }}>
          Cette action est définitive. L'agent ainsi que tout son historique de pointage seront effacés de la base de données.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none' }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}
