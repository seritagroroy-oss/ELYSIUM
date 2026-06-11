import React, { useState } from 'react';
import { Scale, AlertTriangle, Clock, User, FileText, ChevronRight, ShieldAlert } from 'lucide-react';

const LITIGES = [
  {
    id: 1,
    type: 'Heures Supplémentaires',
    icon: '⏰',
    severity: 'critical',
    title: 'Dépassement légal : Pôle Logistique',
    desc: '3 agents ont dépassé la limite légale de 48h/semaine (Code du Travail, Art. 24). Risque de contentieux prud\'homal.',
    agents: ['KOFFI Maurice', 'BAMBA Drissa', 'COULIBALY Lamine'],
    since: 'Il y a 3 jours',
    action: 'Régulariser immédiatement'
  },
  {
    id: 2,
    type: 'CDD Expirant',
    icon: '📋',
    severity: 'high',
    title: '5 CDD à renouveler dans 5 jours',
    desc: 'Aucune action de la RH n\'a été détectée sur ces contrats. Un non-renouvellement sans notification peut être qualifié de licenciement abusif.',
    agents: ['KONÉ Fatou', 'DIALLO Ibrahim', 'N\'GORAN Aline', 'TRAORÉ Roger', 'YEO Nathalie'],
    since: 'Expire le 12/06/2026',
    action: 'Alerter la RH'
  },
  {
    id: 3,
    type: 'Réclamation Non Résolue',
    icon: '⚠️',
    severity: 'high',
    title: 'Réclamation paie : +72h sans réponse',
    desc: 'Une réclamation de paie publiée par le site "Alpha-Nord" n\'a reçu aucune réponse de la Comptabilité. Délai maximum recommandé : 48h.',
    agents: ['Site Alpha-Nord'],
    since: 'Depuis le 04/06/2026',
    action: 'Relancer la comptabilité'
  },
  {
    id: 4,
    type: 'Pointage Manquant',
    icon: '📍',
    severity: 'medium',
    title: '12 agents sans pointage de la semaine',
    desc: '12 agents en statut "actif" n\'ont aucun enregistrement de pointage sur les 5 derniers jours ouvrables.',
    agents: ['Voir liste complète'],
    since: 'Depuis lundi',
    action: 'Vérifier en RH'
  }
];

export default function DGLitiges() {
  const [dismissed, setDismissed] = useState([]);

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical': return { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.4)', badgeBg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'CRITIQUE' };
      case 'high': return { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.4)', badgeBg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'ÉLEVÉ' };
      case 'medium': return { bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.4)', badgeBg: 'rgba(56,189,248,0.15)', color: '#38bdf8', label: 'MOYEN' };
      default: return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', badgeBg: 'rgba(255,255,255,0.1)', color: '#64748b', label: 'INFO' };
    }
  };

  const active = LITIGES.filter(l => !dismissed.includes(l.id));

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
            <Scale size={32} /> Litiges & Alertes Légales
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Radar des situations à risque juridique ou social identifiées automatiquement par le système.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>
            {active.length} alertes actives
          </div>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <ShieldAlert size={48} color="#22c55e" style={{ marginBottom: '16px' }} />
          <h2 style={{ color: 'white', margin: '0 0 8px 0' }}>Aucun litige en cours</h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>L'entreprise est en conformité totale.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {active.map((litige) => {
            const style = getSeverityStyle(litige.severity);
            return (
              <div key={litige.id} className="glass-panel" style={{ padding: '28px', background: style.bg, border: `1px solid ${style.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '2rem' }}>{litige.icon}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ background: style.badgeBg, color: style.color, padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '0.05em' }}>{style.label}</span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>• {litige.type}</span>
                      </div>
                      <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem' }}>{litige.title}</h3>
                    </div>
                  </div>
                  <button onClick={() => setDismissed(d => [...d, litige.id])} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ✓ Traiter
                  </button>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 16px 0', lineHeight: '1.6', borderLeft: `3px solid ${style.color}`, paddingLeft: '12px' }}>
                  {litige.desc}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {litige.agents.map((a, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.07)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={12} /> {a}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    <span><Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />{litige.since}</span>
                    <button style={{ background: style.color, border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {litige.action} <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
