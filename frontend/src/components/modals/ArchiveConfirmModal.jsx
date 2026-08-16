import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function ArchiveConfirmModal({ period, onConfirm, onClose, loading }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, backdropFilter: 'blur(8px)' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#0f172a', padding: '2rem', borderRadius: '16px', maxWidth: '400px', width: '90%', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', textAlign: 'center', animation: 'slideUp 0.3s ease-out' }}>
        <AlertCircle size={48} style={{ color: '#22c55e', margin: '0 auto 16px' }} />
        <h3 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '1.25rem' }}>Confirmer l'archivage</h3>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Êtes-vous sûr de vouloir archiver cet état de paie pour la période <strong style={{ color: 'white' }}>{period}</strong> ?<br/><br/>
          <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Ceci figera les montants et statuts actuels.</span>
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
            disabled={loading}
          >
            Annuler
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.transform = 'translateY(-2px)'; 
              e.currentTarget.style.boxShadow = `0 4px 12px rgba(34,197,94,0.4)`; 
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.boxShadow = 'none'; 
              e.currentTarget.style.filter = 'brightness(1)';
            }}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Archiver'}
          </button>
        </div>
      </div>
    </div>
  );
}
