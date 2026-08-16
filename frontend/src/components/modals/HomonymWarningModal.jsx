import React from 'react';
import { AlertTriangle, UserCheck, Edit3, CheckCircle2 } from 'lucide-react';

export default function HomonymWarningModal({
  homonyms = [],
  onConfirm,
  onModify
}) {
  if (!homonyms || homonyms.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '560px',
        padding: '24px 28px',
        background: '#0f172a',
        border: '1px solid rgba(234, 179, 8, 0.4)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85)',
        color: '#f8fafc',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(234, 179, 8, 0.15)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#facc15',
            flexShrink: 0
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#fef08a' }}>
              Homonyme{homonyms.length > 1 ? 's' : ''} Détecté{homonyms.length > 1 ? 's' : ''}
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>
              {homonyms.length > 1
                ? `${homonyms.length} agents portent déjà ce nom exact dans le système :`
                : `Un agent porte déjà ce nom exact dans le système :`}
            </p>
          </div>
        </div>

        {/* Liste des homonymes */}
        <div style={{
          maxHeight: '180px',
          overflowY: 'auto',
          margin: '16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '4px'
        }}>
          {homonyms.map((h, idx) => (
            <div key={h.id || idx} style={{
              padding: '10px 14px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.9rem'
            }}>
              <div>
                <strong style={{ color: '#ffffff' }}>{h.name}</strong>
                <div style={{ color: '#38bdf8', fontSize: '0.83rem', marginTop: '2px' }}>
                  {h.fullLocation}
                </div>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(148, 163, 184, 0.15)',
                color: '#cbd5e1',
                border: '1px solid rgba(148, 163, 184, 0.2)'
              }}>
                Poste: {h.function}
              </span>
            </div>
          ))}
        </div>

        {/* Texte de conseil & recommandation */}
        <div style={{
          margin: '16px 0 24px 0',
          padding: '12px 14px',
          background: 'rgba(234, 179, 8, 0.08)',
          border: '1px solid rgba(234, 179, 8, 0.25)',
          borderRadius: '10px',
          color: '#e2e8f0',
          fontSize: '0.85rem',
          lineHeight: '1.45'
        }}>
          <strong style={{ color: '#fde047', display: 'block', marginBottom: '4px' }}>💡 Conseil :</strong>
          Vous pouvez ajouter un signe ou une lettre de distinction au nom (ex: <em>{homonyms[0]?.name} (2)</em> ou <em>{homonyms[0]?.name} B</em>), ou écrire le NOM en majuscules et le Prénom en minuscules, pour le repérer plus facilement dans vos listes.
          <span style={{ display: 'block', marginTop: '4px', color: '#94a3b8', fontSize: '0.8rem' }}>
            * Cela reste facultatif car le système gère déjà automatiquement les identifiants uniques et la séparation des fiches en paie.
          </span>
        </div>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onModify}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Edit3 size={16} />
            Modifier le nom
          </button>

          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle2 size={16} />
            Continuer avec ce nom
          </button>
        </div>
      </div>
    </div>
  );
}
