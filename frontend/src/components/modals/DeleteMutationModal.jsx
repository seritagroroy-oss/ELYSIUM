import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteMutationModal({ agent, onClose, onConfirm }) {
  if (!agent) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
      <div
        style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(145deg, #0f1a2e 0%, #111827 100%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '50%', color: '#ef4444' }}>
            <AlertTriangle size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>
              Retirer {agent.is_extra ? "l'extra" : (agent.is_releve ? "la relève" : "l'agent muté")}
            </h3>
            <p style={{ margin: '0 0 16px 0', color: 'var(--muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Vous êtes sur le point de retirer <strong>{agent.name}</strong> de ce site.
            </p>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '12px 16px', borderRadius: '0 8px 8px 0', marginBottom: '24px' }}>
              <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Cette action supprimera toutes ses lignes de pointage liées à cette affectation sur ce site, <strong>ainsi que sur son site d'origine</strong> (suppression du statut "Suppl" et des entrées associées).
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button
            onClick={onClose}
            style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: '12px 24px', borderRadius: '12px', background: '#ef4444', border: '1px solid rgba(239,68,68,0.5)', color: 'white', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'; }}
          >
            Oui, supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
