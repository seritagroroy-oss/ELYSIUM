import React, { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Sliders, Percent, Users, Banknote } from 'lucide-react';

const BASE_MASS = 8400000;
const BASE_ABSENT = 4.8;

export default function DGPredictive() {
  const [increase, setIncrease] = useState(0);
  const [recruitment, setRecruitment] = useState(0);

  const newMass = BASE_MASS * (1 + increase / 100) + recruitment * 250000;
  const delta = newMass - BASE_MASS;
  const absentPrediction = BASE_ABSENT * (recruitment > 0 ? 0.97 : 1.01);

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#8b5cf6' }}>
            <Sparkles size={32} /> Analyse Prédictive
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Simulez l'impact de vos décisions avant de les prendre. Modifiez les paramètres et voyez les projections en temps réel.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Simulateur */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ color: 'white', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={20} color="#8b5cf6" /> Paramètres de Simulation
          </h3>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label style={{ color: 'white', fontWeight: '500' }}>Augmentation salariale globale</label>
              <span style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '1.1rem' }}>{increase}%</span>
            </div>
            <input type="range" min={0} max={20} step={0.5} value={increase} onChange={e => setIncrease(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#8b5cf6', height: '6px', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '4px' }}>
              <span>0%</span><span>10%</span><span>20%</span>
            </div>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label style={{ color: 'white', fontWeight: '500' }}>Nouvelles embauches</label>
              <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '1.1rem' }}>{recruitment} agents</span>
            </div>
            <input type="range" min={0} max={50} step={1} value={recruitment} onChange={e => setRecruitment(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#3b82f6', height: '6px', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '4px' }}>
              <span>0</span><span>25</span><span>50</span>
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Coût mensuel par embauche estimé</div>
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>250 000 FCFA / agent</div>
          </div>
        </div>

        {/* Résultats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderTop: `4px solid ${delta >= 0 ? '#ef4444' : '#22c55e'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Banknote size={16} /> Masse salariale projetée
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white' }}>
                  {(newMass / 1000000).toFixed(2)}M <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>FCFA</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>vs actuellement</div>
                <div style={{ color: delta >= 0 ? '#ef4444' : '#22c55e', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  {delta >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  {delta >= 0 ? '+' : ''}{(delta / 1000).toFixed(0)}K FCFA
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderTop: '4px solid #3b82f6' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} /> Effectif projeté
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'white' }}>
              {4285 + recruitment} <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>agents</span>
            </div>
            {recruitment > 0 && <div style={{ color: '#22c55e', marginTop: '8px', fontWeight: 'bold' }}>+{recruitment} nouvelles recrues</div>}
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderTop: `4px solid ${absentPrediction > 5 ? '#ef4444' : '#22c55e'}` }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Percent size={16} /> Taux d'absentéisme anticipé
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: absentPrediction > 5 ? '#ef4444' : '#22c55e' }}>
              {absentPrediction.toFixed(1)}%
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '8px' }}>
              {absentPrediction > 5 ? '⚠️ Dépasse le seuil d\'alerte de 5%' : '✅ Sous le seuil d\'alerte de 5%'}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.1) 100%)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div style={{ color: '#8b5cf6', fontWeight: 'bold', marginBottom: '8px', fontSize: '1.1rem' }}>💡 Recommandation DG</div>
            {increase === 0 && recruitment === 0
              ? <div style={{ color: 'var(--muted)' }}>Ajustez les curseurs pour générer une recommandation automatique.</div>
              : increase > 10
              ? <div style={{ color: 'white', lineHeight: '1.6' }}>⚠️ Une augmentation de <strong style={{ color: '#ef4444' }}>{increase}%</strong> représente un risque budgétaire significatif. Envisagez un seuil de 5-7% pour préserver la trésorerie.</div>
              : <div style={{ color: 'white', lineHeight: '1.6' }}>✅ La combinaison de <strong style={{ color: '#8b5cf6' }}>{increase}% d'augmentation</strong> et <strong style={{ color: '#3b82f6' }}>{recruitment} embauches</strong> est dans les marges budgétaires raisonnables.</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
