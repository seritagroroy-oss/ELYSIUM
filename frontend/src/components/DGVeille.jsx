import React, { useState } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const INDICATORS = [
  {
    category: 'Économie Nationale',
    color: '#38bdf8',
    items: [
      { label: 'SMIG en vigueur (Côte d\'Ivoire)', value: '75 000 FCFA/mois', trend: 'up', note: 'Dernière revalorisation : Jan 2026', impact: 'high' },
      { label: 'Taux d\'inflation (IPC)', value: '3.2%', trend: 'up', note: 'Hausse des produits alimentaires. Impact sur le pouvoir d\'achat des agents.', impact: 'medium' },
      { label: 'Taux de croissance PIB', value: '+6.8%', trend: 'up', note: 'Conjoncture favorable. Opportunité d\'expansion.', impact: 'low' },
    ]
  },
  {
    category: 'Marché de l\'Emploi',
    color: '#22c55e',
    items: [
      { label: 'Taux de chômage (15-35 ans)', value: '12.4%', trend: 'down', note: 'Légère baisse. Marché du travail en tension sur les profils qualifiés.', impact: 'medium' },
      { label: 'Coût moyen d\'un agent sécurité', value: '220 000 FCFA/mois', trend: 'up', note: 'En hausse de 5% par rapport à l\'an dernier.', impact: 'high' },
      { label: 'Délai moyen recrutement sécurité', value: '18 jours', trend: 'neutral', note: 'Stable sur le secteur.', impact: 'low' },
    ]
  },
  {
    category: 'Réglementation & Droit du Travail',
    color: '#f59e0b',
    items: [
      { label: 'Durée légale hebdomadaire', value: '40h / semaine', trend: 'neutral', note: 'Inchangé. Vigilance sur le Site Alpha (dépassement détecté).', impact: 'high' },
      { label: 'Congés annuels légaux', value: '2.5 jours / mois', trend: 'neutral', note: 'Vérifier conformité des reliquats avant clôture de l\'année.', impact: 'medium' },
      { label: 'Durée max. d\'un CDD renouvelable', value: '24 mois', trend: 'neutral', note: 'Tout dépassement entraîne automatiquement une CDIsation.', impact: 'high' },
    ]
  },
];

const ACTU = [
  { title: 'Le secteur de la sécurité privée en Côte d\'Ivoire face aux défis de la digitalisation', date: '05/06/2026', source: 'Fraternité Matin', sentiment: 'neutral' },
  { title: 'Nouvelle loi sur le travail de nuit : impacts pour les entreprises de gardiennage', date: '02/06/2026', source: 'Abidjan.net', sentiment: 'warning' },
  { title: 'Hausse des investissements étrangers : une opportunité pour la sécurité des sites industriels', date: '29/05/2026', source: 'Eco d\'Afrique', sentiment: 'positive' },
];

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp size={16} color="#ef4444" />;
  if (trend === 'down') return <TrendingDown size={16} color="#22c55e" />;
  return <Minus size={16} color="#64748b" />;
};

export default function DGVeille() {
  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#f59e0b' }}>
            <Newspaper size={32} /> Veille & Indicateurs Sectoriels
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Restez informé des données économiques, légales et sectorielles pour prendre des décisions éclairées.
          </p>
        </div>
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '10px 18px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> Mise à jour : 07/06/2026
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {INDICATORS.map(cat => (
            <div key={cat.category} className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: cat.color, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color }} />
                {cat.category}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cat.items.map((item, i) => (
                  <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: `1px solid rgba(255,255,255,0.06)`, display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, marginTop: '2px' }}><TrendIcon trend={item.trend} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <div style={{ color: 'white', fontWeight: '500' }}>{item.label}</div>
                        <div style={{ color: cat.color, fontWeight: 'bold', fontSize: '1.05rem', flexShrink: 0 }}>{item.value}</div>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>{item.note}</div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.impact === 'high' ? '#ef4444' : item.impact === 'medium' ? '#f59e0b' : '#22c55e', boxShadow: `0 0 6px ${item.impact === 'high' ? '#ef4444' : item.impact === 'medium' ? '#f59e0b' : '#22c55e'}` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actualités */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Newspaper size={18} color="#f59e0b" /> Actualités Sectorielles
            </h3>
            {ACTU.map((a, i) => (
              <div key={i} style={{ padding: '14px 0', borderBottom: i < ACTU.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '6px' }}>
                  {a.sentiment === 'positive' ? <CheckCircle2 size={14} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} /> : a.sentiment === 'warning' ? <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} /> : <Info size={14} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />}
                  <div style={{ color: 'white', fontSize: '0.9rem', lineHeight: '1.4', fontWeight: '500' }}>{a.title}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.78rem', paddingLeft: '22px' }}>
                  <span>{a.source}</span><span>{a.date}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: 'white', fontSize: '1rem' }}>Légende — Impact</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[['#ef4444', 'Impact Élevé — Décision requise'], ['#f59e0b', 'Impact Moyen — À surveiller'], ['#22c55e', 'Impact Faible — Informatif']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
                  <span style={{ color: 'var(--muted)', fontSize: '0.83rem' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
