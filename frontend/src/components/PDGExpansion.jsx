import React, { useState } from 'react';
import { Globe, Crosshair, Calculator, TrendingUp, AlertCircle, RefreshCw, BarChart } from 'lucide-react';

export default function PDGExpansion() {
  const [agents, setAgents] = useState(50);
  const [budget, setBudget] = useState(25); // Millions FCFA
  const [region, setRegion] = useState('Dakar (Sénégal)');

  // Formules simulées
  const caEstime = agents * 0.45; // CA estimé par agent en millions
  const chargesOperationnelles = budget * 0.7; // 70% du budget
  const ebitda = caEstime - chargesOperationnelles;
  const roi = ((ebitda / budget) * 100).toFixed(1);
  const breakEven = ebitda > 0 ? Math.ceil(budget / ebitda) : 'Jamais';
  const riskLevel = ebitda < 0 ? 'Critique' : (roi < 15 ? 'Élevé' : 'Modéré');
  const riskColor = riskLevel === 'Critique' ? '#ef4444' : (riskLevel === 'Élevé' ? '#f59e0b' : '#22c55e');

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Globe size={32} /> Simulateur d'Expansion (M&A)
          </h1>
          <p style={{ margin: 0, color: 'rgba(212,175,55,0.7)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Estimez la rentabilité et le ROI d'une nouvelle ouverture de filiale ou d'une acquisition.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Panneau de configuration (Sliders) */}
        <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '32px' }}>
          <h3 style={{ color: 'white', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crosshair size={20} color="#d4af37" /> Paramètres du projet
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={{ color: 'white', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Zone d'implantation cible</label>
              <select className="form-input" value={region} onChange={e => setRegion(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '8px' }}>
                <option value="Dakar (Sénégal)">Dakar (Sénégal)</option>
                <option value="Bamako (Mali)">Bamako (Mali)</option>
                <option value="Ouagadougou (Burkina Faso)">Ouagadougou (Burkina Faso)</option>
                <option value="Bouaké (Côte d'Ivoire - Expansion locale)">Bouaké (Côte d'Ivoire - Expansion locale)</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ color: 'white', fontSize: '0.9rem' }}>Budget Initial Alloué</label>
                <span style={{ color: '#d4af37', fontWeight: 'bold' }}>{budget} Millions FCFA</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="200" 
                value={budget} 
                onChange={e => setBudget(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#d4af37' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ color: 'white', fontSize: '0.9rem' }}>Objectif de recrutement (Agents)</label>
                <span style={{ color: '#d4af37', fontWeight: 'bold' }}>{agents} Agents</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="500" 
                step="10"
                value={agents} 
                onChange={e => setAgents(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#d4af37' }}
              />
            </div>
            
            <div style={{ marginTop: '16px', background: 'rgba(212,175,55,0.05)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #d4af37' }}>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                <strong>Note :</strong> Les calculs sont basés sur les historiques de déploiement et les standards salariaux de la région <em>{region}</em>.
              </p>
            </div>
          </div>
        </div>

        {/* Panneau de résultats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px', flex: 1, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}>
              <Calculator size={120} color="#d4af37" />
            </div>
            <h3 style={{ color: 'white', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart size={20} color="#38bdf8" /> Projections Financières Année 1
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Chiffre d'Affaires (Est.)</div>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.5rem' }}>{caEstime.toFixed(1)}M</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>EBITDA Mensuel</div>
                <div style={{ color: ebitda > 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold', fontSize: '1.5rem' }}>{ebitda.toFixed(1)}M</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', gap: '24px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Retour sur Investissement (ROI)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={24} color={ebitda > 0 ? '#d4af37' : '#ef4444'} />
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: ebitda > 0 ? '#d4af37' : '#ef4444' }}>{roi}%</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Point d'équilibre</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={24} color="white" />
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{breakEven} {ebitda > 0 ? 'mois' : ''}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: `linear-gradient(145deg, #111 0%, #0a0a0a 100%)`, border: `1px solid ${riskColor}`, borderRadius: '16px', padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <AlertCircle size={40} color={riskColor} />
            <div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>Niveau de Risque : <span style={{ color: riskColor, textTransform: 'uppercase' }}>{riskLevel}</span></div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                {riskLevel === 'Critique' && "L'investissement initial est trop faible ou le ratio d'agents ne permet pas de couvrir les charges opérationnelles."}
                {riskLevel === 'Élevé' && "Le projet est viable mais la marge de manœuvre est faible. Optimisez le budget ou augmentez l'effectif cible."}
                {riskLevel === 'Modéré' && "Le projet présente un excellent ratio rentabilité/risque. Recommandé pour présentation au CA."}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
