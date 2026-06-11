import React, { useState, useEffect } from 'react';
import { Eye, TrendingUp, Users, Activity, Banknote, ShieldAlert, CheckCircle2, ChevronRight, BarChart3, PieChart } from 'lucide-react';

export default function DGVision() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des KPIs globaux
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#eab308' }}>
            <Eye size={32} /> Vision 360° Exécutive
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.05rem', maxWidth: '600px', lineHeight: '1.5' }}>
            Tableau de bord stratégique. Suivez en temps réel la santé globale de l'entreprise, les finances et la performance opérationnelle.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
          <Activity size={48} className="pulse" color="#eab308" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>Agrégation des données...</h3>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Veuillez patienter pendant l'analyse globale.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Top KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(59,130,246,0.1)', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}>
                  <Users size={24} />
                </div>
                <div style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  +2.4% ce mois
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ margin: '0 0 4px 0', color: 'var(--muted)', fontSize: '0.95rem' }}>Effectif Global</h3>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>4,285</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>Sur 12 sites opérationnels</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #eab308' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(234,179,8,0.1)', padding: '12px', borderRadius: '12px', color: '#eab308' }}>
                  <Banknote size={24} />
                </div>
                <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  +1.2% (Hors budget)
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ margin: '0 0 4px 0', color: 'var(--muted)', fontSize: '0.95rem' }}>Masse Salariale Estimée</h3>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>8.4M <span style={{ fontSize: '1.2rem', color: '#64748b' }}>FCFA</span></div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>Projection du mois en cours</div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '12px', color: '#ef4444' }}>
                  <TrendingUp size={24} />
                </div>
                <div style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  Attention
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ margin: '0 0 4px 0', color: 'var(--muted)', fontSize: '0.95rem' }}>Taux d'Absentéisme</h3>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>4.8%</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>Légère hausse sur le site Administration</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <BarChart3 size={20} color="#38bdf8" /> Évolution de la Performance
                </h3>
              </div>
              <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: '40px', gap: '10px' }}>
                {/* Mock Chart */}
                {[65, 78, 59, 80, 81, 95, 85].map((val, i) => (
                  <div key={i} style={{ width: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '100%', height: `${val}%`, background: 'linear-gradient(to top, rgba(56,189,248,0.2), rgba(56,189,248,0.8))', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', color: 'white', fontWeight: 'bold' }}>{val}%</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>M{i+1}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={20} color="#ef4444" /> Points d'Attention
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', fontWeight: 'bold', marginBottom: '8px' }}>
                    <ShieldAlert size={16} /> Fluctuation Anormale
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'white' }}>+12 heures supplémentaires non justifiées au pôle logistique.</div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '8px' }}>
                    <Activity size={16} /> Matériel Manquant
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'white' }}>5 tenues et 2 radios manquantes à l'inventaire du jour.</div>
                </div>
                <button style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', cursor: 'pointer', marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                  Voir tous les rapports <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
