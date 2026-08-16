import React from 'react';
import { TrendingUp, BarChart, DollarSign, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';

export default function PDGBilan() {
  const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Déc'];
  const BUDGET = [280, 280, 280, 280, 280, 280, 280, 280, 280, 280, 280, 280]; // en millions
  const REEL = [275, 278, 282, 281, 285, 290, 0, 0, 0, 0, 0, 0];

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <TrendingUp size={32} /> Performance Financière
          </h1>
          <p style={{ margin: 0, color: 'rgba(212,175,55,0.7)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Bilan consolidé : Budget prévisionnel vs Dépenses réelles.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Graphique de consommation budgétaire (simulé) */}
        <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '24px', gridColumn: '1 / -1' }}>
          <h3 style={{ color: 'white', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart size={20} color="#d4af37" /> Consommation Budgétaire (en Millions FCFA)
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '250px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {MONTHS.map((m, i) => {
              const b = BUDGET[i];
              const r = REEL[i];
              const max = 320;
              const hB = (b / max) * 100;
              const hR = r ? (r / max) * 100 : 0;
              
              return (
                <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100%', width: '100%', justifyContent: 'center' }}>
                    <div style={{ width: '30%', background: 'rgba(255,255,255,0.1)', height: `${hB}%`, borderRadius: '4px 4px 0 0' }} title={`Budget: ${b}M`} />
                    {r > 0 && <div style={{ width: '30%', background: r > b ? '#ef4444' : '#d4af37', height: `${hR}%`, borderRadius: '4px 4px 0 0' }} title={`Réel: ${r}M`} />}
                  </div>
                  <div style={{ position: 'absolute', bottom: '-24px', color: 'var(--muted)', fontSize: '0.8rem' }}>{m}</div>
                </div>
              );
            })}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.9rem' }}>
              <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }} /> Budget Prévisionnel
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.9rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#d4af37', borderRadius: '2px' }} /> Dépense Réelle
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.9rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }} /> Dépassement
            </div>
          </div>
        </div>

        {/* Postes de dépenses */}
        <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '1.1rem' }}>Répartition des charges</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>Salaires de base</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>82% du total</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '1.1rem' }}>2.3Md</div>
                <div style={{ color: '#22c55e', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowDownRight size={14} /> -1.2%</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>Heures Supplémentaires</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>14% du total</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '1.1rem' }}>392M</div>
                <div style={{ color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowUpRight size={14} /> +8.4%</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>Primes & Avantages</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>4% du total</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '1.1rem' }}>112M</div>
                <div style={{ color: '#22c55e', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowDownRight size={14} /> -0.5%</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '1.1rem' }}>Indicateurs de Rentabilité</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'rgba(212,175,55,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div style={{ color: 'rgba(212,175,55,0.8)', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase' }}>Objectif EBE (Excédent Brut d'Exploitation)</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d4af37', lineHeight: '1' }}>480M</div>
                <div style={{ color: 'var(--muted)', paddingBottom: '4px' }}>/ 500M cible</div>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{ width: '96%', height: '100%', background: '#d4af37', borderRadius: '3px' }} />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '8px' }}>Coût moyen / Agent</div>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>234K FCFA</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '8px' }}>ROI Formation</div>
                <div style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '1.2rem' }}>1.4x</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
