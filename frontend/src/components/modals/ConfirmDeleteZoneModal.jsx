import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export default function ConfirmDeleteZoneModal({
  isOpen,
  onClose,
  onConfirm
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 11000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div 
        onClick={e => e.stopPropagation()} 
        style={{
          background: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '24px',
          width: '100%', maxWidth: '440px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.02)',
          overflow: 'hidden',
          animation: 'modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444'
            }}>
              <AlertTriangle size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              Suppression
            </h3>
          </div>
          <button 
            onClick={!isDeleting ? onClose : undefined} 
            className="close-btn-hover" 
            style={{
              background: 'transparent', border: 'none', color: '#94a3b8',
              cursor: isDeleting ? 'not-allowed' : 'pointer', padding: '6px', display: 'flex', borderRadius: '8px',
              opacity: isDeleting ? 0.5 : 1
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '28px', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6' }}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#ef4444', fontWeight: 600 }}>Attention :</strong> supprimer cette zone supprimera également <strong style={{ color: '#f8fafc' }}>tous les agents qu'elle contient</strong>.
          </p>
          <p style={{ margin: '12px 0 0 0' }}>
            Cette action est irréversible. Voulez-vous vraiment continuer ?
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 28px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.15)'
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            onMouseEnter={(e) => {
              if (!isDeleting) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) e.currentTarget.style.background = 'transparent';
            }}
            style={{
              flex: 1, padding: '12px', background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px',
              color: '#f8fafc', fontSize: '0.95rem', fontWeight: 600,
              cursor: isDeleting ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              opacity: isDeleting ? 0.5 : 1
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = '#dc2626';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.transform = 'none';
              }
            }}
            style={{
              flex: 1, padding: '12px', background: isDeleting ? '#b91c1c' : '#ef4444',
              border: 'none', borderRadius: '10px',
              color: '#ffffff', fontSize: '0.95rem', fontWeight: 600,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
              opacity: isDeleting ? 0.8 : 1
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={18} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 size={18} />
                Supprimer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
