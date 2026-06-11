import React, { useState } from 'react';
import { Network, ChevronRight, ChevronDown, Users, Banknote, Activity, X } from 'lucide-react';

const ORG_TREE = {
  id: 'dg',
  name: 'Directeur Général',
  role: 'Direction',
  count: 1,
  cost: 0,
  color: '#eab308',
  icon: '🦅',
  children: [
    {
      id: 'rh',
      name: 'Ressources Humaines',
      role: 'Chef de Service',
      count: 42,
      cost: 9450000,
      color: '#38bdf8',
      icon: '👥',
      present: 38,
      children: [
        { id: 'rh_1', name: 'Équipe Paie', role: 'Gestionnaire', count: 8, cost: 1800000, color: '#38bdf8', icon: '💰', present: 7, children: [] },
        { id: 'rh_2', name: 'Équipe Recrutement', role: 'Chargé RH', count: 12, cost: 2600000, color: '#38bdf8', icon: '🎯', present: 11, children: [] },
        { id: 'rh_3', name: 'Équipe Formation', role: 'Formateur', count: 22, cost: 5050000, color: '#38bdf8', icon: '📚', present: 20, children: [] },
      ]
    },
    {
      id: 'compta',
      name: 'Comptabilité',
      role: 'Directeur Financier',
      count: 18,
      cost: 6200000,
      color: '#22c55e',
      icon: '📊',
      present: 17,
      children: [
        { id: 'compta_1', name: 'Comptabilité Générale', role: 'Comptable', count: 10, cost: 3200000, color: '#22c55e', icon: '🧾', present: 10, children: [] },
        { id: 'compta_2', name: 'Contrôle de Gestion', role: 'Contrôleur', count: 8, cost: 3000000, color: '#22c55e', icon: '📈', present: 7, children: [] },
      ]
    },
    {
      id: 'secu',
      name: 'Sécurité / Secrétariat',
      role: 'Chef de Site',
      count: 215,
      cost: 38500000,
      color: '#a855f7',
      icon: '🏢',
      present: 198,
      children: [
        { id: 'secu_1', name: 'Site Plateau Central', role: 'Superviseur', count: 82, cost: 14700000, color: '#a855f7', icon: '🏙️', present: 78, children: [] },
        { id: 'secu_2', name: 'Site Yopougon', role: 'Superviseur', count: 67, cost: 12000000, color: '#a855f7', icon: '🏗️', present: 60, children: [] },
        { id: 'secu_3', name: 'Site Abobo', role: 'Superviseur', count: 66, cost: 11800000, color: '#a855f7', icon: '🏭', present: 60, children: [] },
      ]
    },
    {
      id: 'log',
      name: 'Logistique',
      role: 'Responsable Logistique',
      count: 34,
      cost: 7200000,
      color: '#f59e0b',
      icon: '🚗',
      present: 29,
      children: [
        { id: 'log_1', name: 'Flotte & Véhicules', role: 'Chauffeur / Agent', count: 18, cost: 3800000, color: '#f59e0b', icon: '🚙', present: 15, children: [] },
        { id: 'log_2', name: 'Matériel & Stock', role: 'Magasinier', count: 16, cost: 3400000, color: '#f59e0b', icon: '📦', present: 14, children: [] },
      ]
    }
  ]
};

function OrgNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [detail, setDetail] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const presenceRate = node.present && node.count ? Math.round((node.present / node.count) * 100) : null;

  return (
    <div style={{ marginLeft: depth > 0 ? '32px' : 0, borderLeft: depth > 0 ? `2px solid rgba(255,255,255,0.08)` : 'none', paddingLeft: depth > 0 ? '16px' : 0 }}>
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '10px', cursor: 'pointer', borderLeft: `4px solid ${node.color}`, display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'space-between', transition: 'all 0.2s' }}
        onClick={() => hasChildren ? setExpanded(e => !e) : setDetail(true)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
          <span style={{ fontSize: '1.5rem' }}>{node.icon}</span>
          <div>
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>{node.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{node.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
          {node.count > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontWeight: 'bold' }}>{node.count}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>agents</div>
            </div>
          )}
          {presenceRate !== null && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: presenceRate >= 90 ? '#22c55e' : presenceRate >= 70 ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>{presenceRate}%</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>présents</div>
            </div>
          )}
          {node.cost > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#eab308', fontWeight: 'bold', fontSize: '0.9rem' }}>{(node.cost / 1000000).toFixed(1)}M</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>FCFA/mois</div>
            </div>
          )}
          {hasChildren && (
            <div style={{ color: 'var(--muted)' }}>{expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {detail && !hasChildren && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ padding: '32px', maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: node.color, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{node.icon}</span> {node.name}
              </h2>
              <button onClick={() => setDetail(false)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center' }}>
                <Users size={24} color="#38bdf8" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>{node.count}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Agents total</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center' }}>
                <Activity size={24} color={presenceRate >= 90 ? '#22c55e' : '#f59e0b'} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: presenceRate >= 90 ? '#22c55e' : '#f59e0b' }}>{node.present}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Présents aujourd'hui</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', gridColumn: '1/-1' }}>
                <Banknote size={24} color="#eab308" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#eab308' }}>{(node.cost / 1000000).toFixed(2)}M FCFA</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Coût mensuel estimé</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <OrgNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DGOrganigramme() {
  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#14b8a6' }}>
            <Network size={32} /> Organigramme Live
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.05rem', lineHeight: '1.5' }}>
            Visualisez l'ensemble de la hiérarchie de l'entreprise. Cliquez sur une équipe pour voir ses détails (effectif, présence, coût).
          </p>
        </div>
      </div>
      <OrgNode node={ORG_TREE} depth={0} />
    </div>
  );
}
