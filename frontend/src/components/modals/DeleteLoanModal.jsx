import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function DeleteLoanModal({ loan, onClose, onConfirm }) {
  if (!loan) return null;
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%', maxWidth: '420px',
          padding: '32px 28px',
          borderRadius: '18px',
          border: '1px solid rgba(239,68,68,0.25)',
          boxShadow: '0 8px 40px rgba(239,68,68,0.15), 0 2px 10px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icône */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.05) 100%)',
          border: '1.5px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 0 20px rgba(239,68,68,0.15)',
        }}>
          <Trash2 size={28} color="#ef4444" />
        </div>

        {/* Titre */}
        <h3 style={{ textAlign: 'center', margin: '0 0 10px', fontSize: '1.15rem', fontWeight: '800', color: '#f1f5f9' }}>
          Supprimer ce prêt ?
        </h3>

        {/* Sous-titre */}
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem', margin: '0 0 18px', lineHeight: '1.5' }}>
          L'historique de ses remboursements sera définitivement perdu.
        </p>

        {/* Info card prêt */}
        <div style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.18)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
            <span style={{ color: 'var(--muted)' }}>Agent</span>
            <span style={{ color: '#f1f5f9', fontWeight: '700' }}>{loan.agent_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
            <span style={{ color: 'var(--muted)' }}>Montant</span>
            <span style={{ color: '#f43f5e', fontWeight: '700' }}>
              {parseInt(loan.total_amount).toLocaleString()} XOF
            </span>
          </div>
          {loan.motif && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
              <span style={{ color: 'var(--muted)' }}>Motif</span>
              <span style={{ color: '#f1f5f9' }}>{loan.motif}</span>
            </div>
          )}
        </div>

        {/* Avertissement */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '8px',
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '24px',
          fontSize: '0.8rem',
          color: '#fbbf24',
        }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>Cette action est <strong>irréversible</strong>. Aucune annulation possible après confirmation.</span>
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ flex: 1, padding: '10px', fontWeight: '700' }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px', fontWeight: '700',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontSize: '0.9rem',
              boxShadow: '0 4px 15px rgba(239,68,68,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(239,68,68,0.3)'; }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Trash2 size={15} /> Supprimer
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
