import React from 'react';
import { Zap, AlertTriangle, ShieldAlert, Target, ShieldCheck, Activity } from 'lucide-react';

export default function PDGMenaces() {
  const THREATS = [
    {
      id: 1,
      title: "Dépendance Client Majeur (Risque de Concentration)",
      description: "Le contrat 'Zone Industrielle Yopougon' représente 28% du Chiffre d'Affaires global de l'entreprise.",
      impact: "Pertes de revenus massives, licenciement économique massif de 120 agents.",
      probability: "Faible",
      severity: "Critique",
      recommendation: "Accélérer la diversification du portefeuille client (Objectif: aucun client > 15%)."
    },
    {
      id: 2,
      title: "Risque de Liquidité à court terme",
      description: "Les délais de paiement moyens (DSO) des clients étatiques ont augmenté de 45 à 72 jours ce trimestre.",
      impact: "Difficulté potentielle à payer la masse salariale du mois prochain (2.3Md FCFA).",
      probability: "Élevée",
      severity: "Haute",
      recommendation: "Négocier une ligne d'escompte bancaire d'urgence ou durcir le recouvrement."
    },
    {
      id: 3,
      title: "Mouvement Social (Risque de Grève)",
      description: "L'inflation locale impacte le pouvoir d'achat des agents. Des rumeurs de syndicalisation non-officielle circulent sur le site du Port Autonome.",
      impact: "Rupture de service chez les clients majeurs, pénalités contractuelles lourdes, image dégradée.",
      probability: "Moyenne",
      severity: "Haute",
      recommendation: "Déclencher la 'Prime de Vie Chère' anticipée (budget estimé : 15M FCFA/mois)."
    }
  ];

  const getColorBySeverity = (severity) => {
    switch(severity) {
      case 'Critique': return '#ef4444';
      case 'Haute': return '#f59e0b';
      case 'Modérée': return '#eab308';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Zap size={32} /> Radar des Menaces Existentieles
          </h1>
          <p style={{ margin: 0, color: 'rgba(239,68,68,0.8)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Vue macro-économique des risques majeurs pouvant impacter la pérennité de l'entreprise.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
        
        {/* Panneau de statut global */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
            <Activity size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '1.5rem' }}>Niveau d'Alerte : ÉLEVÉ</h2>
            <p style={{ color: 'var(--muted)', margin: 0 }}>3 menaces majeures détectées par l'IA Exécutive ce trimestre.</p>
          </div>

          <div style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#d4af37" /> Matrice de Résilience
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>Trésorerie de secours</span>
                  <span style={{ color: '#22c55e' }}>2.5 mois couverts</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                  <div style={{ width: '80%', height: '100%', background: '#22c55e', borderRadius: '3px' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>Diversification Clientèle</span>
                  <span style={{ color: '#ef4444' }}>Faible</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                  <div style={{ width: '30%', height: '100%', background: '#ef4444', borderRadius: '3px' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>Climat Social Interne</span>
                  <span style={{ color: '#f59e0b' }}>Tendu</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                  <div style={{ width: '60%', height: '100%', background: '#f59e0b', borderRadius: '3px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des menaces */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {THREATS.map(threat => (
            <div key={threat.id} style={{ background: 'linear-gradient(145deg, #111 0%, #0a0a0a 100%)', border: `1px solid ${getColorBySeverity(threat.severity)}40`, borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: getColorBySeverity(threat.severity) }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ShieldAlert size={24} color={getColorBySeverity(threat.severity)} />
                  {threat.title}
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)' }}>Probabilité: {threat.probability}</span>
                  <span style={{ background: `${getColorBySeverity(threat.severity)}20`, color: getColorBySeverity(threat.severity), padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', border: `1px solid ${getColorBySeverity(threat.severity)}40` }}>Sévérité: {threat.severity}</span>
                </div>
              </div>

              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '16px' }}>
                {threat.description}
              </div>

              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>Impact Potentiel :</div>
                <div style={{ color: 'white', fontSize: '0.95rem' }}>{threat.impact}</div>
              </div>

              <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={16} /> Recommandation Stratégique IA :
                </div>
                <div style={{ color: 'white', fontSize: '0.95rem' }}>{threat.recommendation}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
