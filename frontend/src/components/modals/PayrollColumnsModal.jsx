import React, { useState } from 'react';
import { X, Eye, EyeOff, Settings2, Check, Loader2 } from 'lucide-react';

// Définition complète des colonnes configurables, groupées par catégorie
export const COLUMN_GROUPS = [
  {
    key: 'identite',
    label: '👤 Identité',
    color: '#38bdf8',
    columns: [
      { key: 'nom',   label: 'Nom & Prénom' },
      { key: 'poste', label: 'Poste' },
    ]
  },
  {
    key: 'presences',
    label: '📅 Présences',
    color: '#f59e0b',
    columns: [
      { key: 'jours',      label: 'Jours Trav.' },
      { key: 'absences',   label: 'Absences' },
      { key: 'map',        label: 'MAP' },
      { key: 'permission', label: 'Permission' },
      { key: 'conges',     label: 'Congés' },
    ]
  },
  {
    key: 'remuneration',
    label: '💰 Rémunération',
    color: '#22c55e',
    columns: [
      { key: 'base',       label: 'Base (XOF)' },
      { key: 'retenues',   label: 'Retenues' },
      { key: 'prime_site', label: 'Prime Site' },
      { key: 'suppl',      label: 'Suppl.' },
      { key: 'anciennete', label: 'Ancienneté', },
      { key: 'sursalaire', label: 'Sursalaire', conditional: 'enable_sursalaire' },
      { key: 'brut',       label: 'Brut' },
    ]
  },
  {
    key: 'fiscalite',
    label: '🏛️ Fiscalité',
    color: '#ef4444',
    columns: [
      { key: 'cnps_sal',  label: 'CNPS Sal.',  conditional: 'enable_cnps_salarial' },
      { key: 'cmu_sal',   label: 'CMU Sal.',   conditional: 'enable_cmu_employe' },
      { key: 'its',       label: 'ITS',        conditional: 'enable_its' },
      { key: 'cnps_pat',  label: 'CNPS Pat.',  conditional: 'enable_cnps_patronal' },
      { key: 'cmu_pat',   label: 'CMU Pat.',   conditional: 'enable_cmu_employeur' },
      { key: 'acc_trav',  label: 'Acc. Trav.', conditional: 'enable_accidents_travail' },
      { key: 'fdfp',      label: 'FDFP',       conditional: 'enable_fdfp' },
      { key: 'taxe_appr', label: 'Taxe Appr.', conditional: 'enable_taxe_apprentissage' },
    ]
  },
  {
    key: 'resultat',
    label: '✅ Résultat',
    color: '#a855f7',
    columns: [
      { key: 'av_prets', label: 'Av/Prêts' },
      { key: 'net',      label: 'Net à Payer' },
      { key: 'statut',   label: 'Statut' },
    ]
  }
];

// Valeurs par défaut : toutes les colonnes visibles sauf Ancienneté
export const DEFAULT_VISIBLE_COLS = {
  ...Object.fromEntries(
    COLUMN_GROUPS.flatMap(g => g.columns.map(c => [c.key, true]))
  ),
  anciennete: false,  // masquée par défaut
};

export default function PayrollColumnsModal({ isOpen, visibleCols, payrollSettings, onChange, onClose, saveStatus }) {
  const [hoveredKey, setHoveredKey] = useState(null);

  if (!isOpen) return null;

  const cols = visibleCols ?? DEFAULT_VISIBLE_COLS;

  const toggle = (key) => {
    onChange({ ...cols, [key]: !cols[key] });
  };

  const showAll = () => {
    const all = {};
    COLUMN_GROUPS.forEach(g => g.columns.forEach(c => { all[c.key] = true; }));
    onChange(all);
  };

  const hideAll = () => {
    const none = {};
    COLUMN_GROUPS.forEach(g => g.columns.forEach(c => { none[c.key] = c.key === 'nom'; }));
    onChange(none);
  };

  const isColAvailable = (col) => {
    if (!col.conditional) return true;
    return payrollSettings?.[col.conditional] !== false;
  };

  const visibleCount = COLUMN_GROUPS.flatMap(g => g.columns).filter(c => isColAvailable(c) && cols[c.key] !== false).length;
  const totalCount   = COLUMN_GROUPS.flatMap(g => g.columns).filter(c => isColAvailable(c)).length;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pcm_fadeIn 0.15s ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          width: '560px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(56,189,248,0.08)',
          animation: 'pcm_slideUp 0.2s ease',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(56,189,248,0.05))',
              border: '1px solid rgba(56,189,248,0.3)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Settings2 size={18} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                Colonnes visibles
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(148,163,184,0.7)' }}>
                {visibleCount} / {totalCount} colonnes affichées
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {saveStatus === 'saving' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(148,163,184,0.6)', fontSize: '0.75rem' }}>
                <Loader2 size={12} style={{ animation: 'pcm_spin 1s linear infinite' }} />
                Sauvegarde…
              </div>
            )}
            {saveStatus === 'saved' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#22c55e', fontSize: '0.75rem' }}>
                <Check size={12} />
                Sauvegardé
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'rgba(148,163,184,0.7)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex', alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(148,163,184,0.7)'; }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Actions rapides ── */}
        <div style={{
          padding: '12px 24px',
          display: 'flex', gap: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0
        }}>
          <button
            onClick={showAll}
            style={{
              flex: 1, padding: '7px 12px', fontSize: '0.8rem', fontWeight: 600,
              background: 'rgba(34,197,94,0.08)', color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.08)'; }}
          >
            <Eye size={13} /> Tout afficher
          </button>
          <button
            onClick={hideAll}
            style={{
              flex: 1, padding: '7px 12px', fontSize: '0.8rem', fontWeight: 600,
              background: 'rgba(239,68,68,0.08)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          >
            <EyeOff size={13} /> Tout masquer
          </button>
        </div>

        {/* ── Liste des colonnes ── */}
        <div style={{ overflowY: 'auto', padding: '16px 24px 24px', flex: 1 }}>
          {COLUMN_GROUPS.map(group => {
            const availableCols = group.columns.filter(c => isColAvailable(c));
            if (availableCols.length === 0) return null;

            return (
              <div key={group.key} style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: group.color,
                  marginBottom: '10px', paddingBottom: '6px',
                  borderBottom: `1px solid ${group.color}22`
                }}>
                  {group.label}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {availableCols.map(col => {
                    const isOn      = cols[col.key] !== false;
                    const isHovered = hoveredKey === col.key;
                    const locked    = col.key === 'nom';

                    return (
                      <button
                        key={col.key}
                        onClick={() => !locked && toggle(col.key)}
                        onMouseEnter={() => setHoveredKey(col.key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '9px 12px',
                          background: isOn
                            ? `linear-gradient(135deg, ${group.color}12, ${group.color}05)`
                            : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isOn ? group.color + '35' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: '10px',
                          cursor: locked ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                          transform: isHovered && !locked ? 'translateY(-1px)' : 'none',
                          opacity: locked ? 0.45 : 1,
                          textAlign: 'left'
                        }}
                      >
                        <span style={{
                          fontSize: '0.82rem', fontWeight: 600,
                          color: isOn ? 'white' : 'rgba(148,163,184,0.45)',
                          transition: 'color 0.15s'
                        }}>
                          {col.label}
                          {locked && <span style={{ fontSize: '0.65rem', marginLeft: '4px', opacity: 0.5 }}>🔒</span>}
                        </span>

                        {/* Toggle switch */}
                        <div style={{
                          width: '36px', height: '20px',
                          background: isOn ? group.color : 'rgba(148,163,184,0.2)',
                          borderRadius: '10px',
                          position: 'relative',
                          flexShrink: 0,
                          transition: 'background 0.2s ease',
                          boxShadow: isOn ? `0 0 8px ${group.color}55` : 'none'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '3px',
                            left: isOn ? '19px' : '3px',
                            width: '14px', height: '14px',
                            background: 'white',
                            borderRadius: '50%',
                            transition: 'left 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'flex-end',
          flexShrink: 0
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 28px', fontSize: '0.85rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
              border: 'none', borderRadius: '10px', color: 'white',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(56,189,248,0.3)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(56,189,248,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(56,189,248,0.3)'; }}
          >
            Fermer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pcm_fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes pcm_slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pcm_spin    { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </div>
  );
}
