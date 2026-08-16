import React, { useState } from 'react';
import { AlertTriangle, Trash, Loader2 } from 'lucide-react';

export default function DeleteSiteModal({ siteName, onClose, onConfirm }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes ds-spin { 100% { transform: rotate(360deg); } }
      `}</style>
      <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', border: '1px solid rgba(239,68,68,0.4)', padding: '24px', borderRadius: '12px' }}>
        <h3 style={{ color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', margin: 0, paddingBottom: '16px' }}>
          <AlertTriangle size={24} /> Suppression de site
        </h3>
        <p style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.9)', fontSize: '1rem', lineHeight: '1.5' }}>
          Voulez-vous vraiment supprimer ce site ? Tous les agents et historiques liés seront effacés !
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onClick={onClose} disabled={isLoading}>
            Annuler
          </button>
          <button 
            className="btn" 
            style={{ flex: 1, background: isLoading ? 'rgba(239,68,68,0.5)' : '#ef4444', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }} 
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#dc2626' }} 
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = '#ef4444' }} 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={16} style={{ animation: 'ds-spin 1s linear infinite' }} /> : <Trash size={16} />} 
            {isLoading ? 'Suppression...' : 'Oui, Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}
