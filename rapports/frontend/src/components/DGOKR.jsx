import React, { useState } from 'react';
import { Target, Plus, X, CheckCircle2, Clock, AlertTriangle, ChevronRight } from 'lucide-react';

const initialObjectives = [
  {
    id: 1,
    dept: 'Ressources Humaines',
    icon: '👥',
    color: '#38bdf8',
    goal: 'Réduire l\'absentéisme sous 2%',
    current: 4.8,
    target: 2.0,
    unit: '%',
    deadline: '31/12/2026',
    lower_is_better: true,
  },
  {
    id: 2,
    dept: 'Logistique',
    icon: '📦',
    color: '#f59e0b',
    goal: 'Zéro perte de matériel',
    current: 7,
    target: 0,
    unit: ' pièces perdues',
    deadline: '31/10/2026',
    lower_is_better: true,
  },
  {
    id: 3,
    dept: 'Secrétariat',
    icon: '🏢',
    color: '#a855f7',
    goal: '100% des courriers pointés en <1h',
    current: 72,
    target: 100,
    unit: '%',
    deadline: '31/08/2026',
    lower_is_better: false,
  },
  {
    id: 4,
    dept: 'Comptabilité',
    icon: '📊',
    color: '#22c55e',
    goal: 'Clôture salariale avant le 5 du mois',
    current: 80,
    target: 100,
    unit: '% des mois',
    deadline: '31/12/2026',
    lower_is_better: false,
  },
];

export default function DGOKR() {
  const [objectives] = useState(initialObjectives);

  const getProgress = (obj) => {
    if (obj.lower_is_better) {
      if (obj.current <= obj.target) return 100;
      const range = (obj.current - obj.target);
      const start = obj.id === 1 ? 6 : 10; // rough max
      return Math.max(0, Math.min(100, ((start - obj.current) / (start - obj.target)) * 100));
    }
    return Math.max(0, Math.min(100, (obj.current / obj.target) * 100));
  };

  const getColor = (progress) => {
    if (progress >= 75) return '#22c55e';
    if (progress >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getStatus = (progress) => {
    if (progress >= 75) return { icon: <CheckCircle2 size={16} />, label: 'En bonne voie', color: '#22c55e' };
    if (progress >= 40) return { icon: <Clock size={16} />, label: 'À surveiller', color: '#f59e0b' };
    return { icon: <AlertTriangle size={16} />, label: 'En retard', color: '#ef4444' };
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#f97316' }}>
            <Target size={32} /> Objectifs Stratégiques (OKR)
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Suivez la progression des objectifs de chaque département vers leurs cibles annuelles.
          </p>
        </div>
        <button style={{ background: '#f97316', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
          <Plus size={18} /> Nouvel Objectif
        </button>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {objectives.map((obj) => {
          const progress = getProgress(obj);
          const color = getColor(progress);
          const status = getStatus(progress);

          return (
            <div key={obj.id} className="glass-panel" style={{ padding: '28px', borderLeft: `4px solid ${obj.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: `rgba(255,255,255,0.05)`, fontSize: '2rem', padding: '12px', borderRadius: '12px' }}>
                    {obj.icon}
                  </div>
                  <div>
                    <div style={{ color: obj.color, fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>{obj.dept}</div>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '1.15rem' }}>{obj.goal}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Échéance : {obj.deadline}</div>
                  <span style={{ background: `rgba(${status.color === '#22c55e' ? '34,197,94' : status.color === '#f59e0b' ? '245,158,11' : '239,68,68'},0.1)`, color: status.color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {status.icon} {status.label}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                  <span>Valeur actuelle : <strong style={{ color: 'white' }}>{obj.current}{obj.unit}</strong></span>
                  <span>Cible : <strong style={{ color: color }}>{obj.target}{obj.unit}</strong></span>
                </div>
                <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(to right, ${color}88, ${color})`, borderRadius: '8px', transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ textAlign: 'right', color, fontWeight: 'bold', marginTop: '6px', fontSize: '0.9rem' }}>{progress.toFixed(0)}% atteint</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
