import React from 'react';
import { BarChart, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

export default function PDGBenchmark() {
  const BENCHMARKS = [
    {
      metric: "Coût Mensuel Moyen par Agent",
      internal: "234 000 FCFA",
      market: "220 000 FCFA",
      delta: "+14 000 FCFA",
      status: "warning",
      note: "Notre politique salariale est au-dessus du marché (fidélisation)."
    },
    {
      metric: "Taux d'Absentéisme",
      internal: "4.8%",
      market: "6.5%",
      delta: "-1.7%",
      status: "good",
      note: "Très bonne performance. Le secteur souffre d'un fort absentéisme."
    },
    {
      metric: "Turnover (Rotation du personnel)",
      internal: "12%",
      market: "25%",
      delta: "-13%",
      status: "good",
      note: "Fidélisation exceptionnelle grâce aux conditions salariales."
    },
    {
      metric: "Marge Opérationnelle (Sécurité)",
      internal: "18.4%",
      market: "15.0%",
      delta: "+3.4%",
      status: "good",
      note: "Rentabilité supérieure malgré des salaires plus élevés."
    },
    {
      metric: "Heures Supplémentaires / Agent",
      internal: "18h / mois",
      market: "12h / mois",
      delta: "+6h",
      status: "warning",
      note: "Risque de surmenage et surcoût. À optimiser."
    }
  ];

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <BarChart size={32} /> Comparatif Concurrentiel
          </h1>
          <p style={{ margin: 0, color: 'rgba(212,175,55,0.7)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Benchmark de vos performances par rapport à la moyenne du secteur de la sécurité privée en Afrique de l'Ouest.
          </p>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(212,175,55,0.1)' }}>
              <th style={{ padding: '20px', color: '#d4af37', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Indicateur Clé</th>
              <th style={{ padding: '20px', color: '#d4af37', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Interne (Nous)</th>
              <th style={{ padding: '20px', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Marché (Moyenne)</th>
              <th style={{ padding: '20px', color: '#d4af37', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Écart</th>
              <th style={{ padding: '20px', color: '#d4af37', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Analyse</th>
            </tr>
          </thead>
          <tbody>
            {BENCHMARKS.map((b, i) => (
              <tr key={i} style={{ borderBottom: i < BENCHMARKS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.2s' }}>
                <td style={{ padding: '20px', color: 'white', fontWeight: '500' }}>{b.metric}</td>
                <td style={{ padding: '20px', color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{b.internal}</td>
                <td style={{ padding: '20px', color: 'var(--muted)', fontSize: '1.05rem' }}>{b.market}</td>
                <td style={{ padding: '20px' }}>
                  <span style={{ 
                    background: b.status === 'good' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', 
                    color: b.status === 'good' ? '#22c55e' : '#f59e0b', 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontWeight: 'bold', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px' 
                  }}>
                    {b.status === 'good' ? <TrendingUp size={16} /> : <TrendingDown size={16} />} {b.delta}
                  </span>
                </td>
                <td style={{ padding: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <Info size={16} color="#d4af37" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{b.note}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>
        Données sectorielles agrégées et mises à jour trimestriellement. Source: Observatoire de la Sécurité Privée (Q1 2026).
      </div>
    </div>
  );
}
