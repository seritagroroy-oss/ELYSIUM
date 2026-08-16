import React from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

/**
 * UnverifiedPublishWarningModal
 * Affiché AVANT la modale de publication si le pointage n'a pas été vérifié.
 * L'utilisateur peut annuler ou confirmer "Publier quand même".
 */
export default function UnverifiedPublishWarningModal({
  isOpen,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
        }}
      />

      {/* Carte modale */}
      <div
        style={{
          position: 'relative', zIndex: 1,
          background: 'linear-gradient(145deg, #1a1000 0%, #1c1200 50%, #130e00 100%)',
          border: '1px solid rgba(251,191,36,0.35)',
          borderRadius: '24px',
          padding: '36px 32px',
          maxWidth: '460px',
          width: '100%',
          boxShadow:
            '0 25px 60px rgba(0,0,0,0.8), 0 0 60px rgba(251,191,36,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          <X size={16} />
        </button>

        {/* Icône */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '80px', height: '80px',
              margin: '0 auto 20px',
              background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.08) 100%)',
              border: '2px solid rgba(251,191,36,0.4)',
              borderRadius: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(251,191,36,0.15)',
            }}
          >
            <ShieldAlert size={40} color="#fbbf24" />
          </div>
          <h2
            style={{
              fontSize: '1.5rem', fontWeight: 800,
              color: '#fff', margin: '0 0 10px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Pointage non vérifié
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            Le pointage de cette période n'a pas encore été vérifié via le module{' '}
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>Vérification</span>.
            Il est fortement recommandé de vérifier avant de publier pour éviter toute anomalie.
          </p>
        </div>

        {/* Avertissement visuel */}
        <div
          style={{
            background: 'rgba(251,191,36,0.07)',
            border: '1px solid rgba(251,191,36,0.25)',
            borderRadius: '14px',
            padding: '14px 18px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertTriangle size={20} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            Publier sans vérification peut entraîner des erreurs dans les calculs de salaires et les rapports de pointage.
          </div>
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Annuler */}
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px 16px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              fontSize: '0.95rem', fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            Annuler
          </button>

          {/* Publier quand même */}
          <button
            onClick={onConfirm}
            style={{
              flex: 2, padding: '13px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(251,191,36,0.9) 0%, rgba(245,158,11,0.85) 100%)',
              color: '#000',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem', fontWeight: 700,
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(251,191,36,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(251,191,36,0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(251,191,36,0.3)';
            }}
          >
            Publier quand même →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
