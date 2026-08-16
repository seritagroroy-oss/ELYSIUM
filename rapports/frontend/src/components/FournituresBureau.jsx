import React, { useState } from 'react';
import { Paperclip, Plus, PackageOpen, Check, X, Search, Edit2 } from 'lucide-react';

export default function FournituresBureau() {
  const [activeTab, setActiveTab] = useState('demandes'); // demandes | stock
  
  const [demandes, setDemandes] = useState([
    { id: 1, agent: 'Bamba Seydou', departement: 'IT', article: 'Cahier A4 & Stylos Bleus', date: 'Aujourd\'hui 09:30', statut: 'en_attente' },
    { id: 2, agent: 'Konan Aya', departement: 'RH', article: 'Cartouche Encre HP 305', date: 'Hier 15:45', statut: 'valide' },
  ]);

  const [stock] = useState([
    { id: 's1', nom: 'Stylos Bille (Boîte de 50)', qte: 12, seuil: 5 },
    { id: 's2', nom: 'Cahiers A4 spirale', qte: 4, seuil: 10 },
    { id: 's3', nom: 'Rames de papier A4', qte: 35, seuil: 20 },
    { id: 's4', nom: 'Surligneurs (Lot de 4)', qte: 8, seuil: 10 },
  ]);

  const handleValidation = (id, isValid) => {
    setDemandes(demandes.map(d => d.id === id ? { ...d, statut: isValid ? 'valide' : 'rejete' } : d));
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Paperclip size={28} color="#8b5cf6" /> Fournitures de Bureau
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Gestion de l'économat : stock matériel et demandes des collaborateurs.</p>
        </div>
        <button style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '12px 22px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }}>
          <Plus size={20} /> Nouvelle Commande Fournisseur
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('demandes')} style={{ background: 'none', border: 'none', padding: '8px 16px', color: activeTab === 'demandes' ? '#8b5cf6' : 'var(--muted)', fontSize: '1rem', fontWeight: 600, borderBottom: activeTab === 'demandes' ? '2px solid #8b5cf6' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
          Demandes Collaborateurs {demandes.filter(d => d.statut === 'en_attente').length > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem', marginLeft: '6px' }}>{demandes.filter(d => d.statut === 'en_attente').length}</span>}
        </button>
        <button onClick={() => setActiveTab('stock')} style={{ background: 'none', border: 'none', padding: '8px 16px', color: activeTab === 'stock' ? '#8b5cf6' : 'var(--muted)', fontSize: '1rem', fontWeight: 600, borderBottom: activeTab === 'stock' ? '2px solid #8b5cf6' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
          État des Stocks
        </button>
      </div>

      {activeTab === 'demandes' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          {demandes.map(d => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: d.statut === 'en_attente' ? 'rgba(255,255,255,0.02)' : 'transparent', borderRadius: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{d.agent} <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>({d.departement})</span></h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>• {d.date}</span>
                </div>
                <p style={{ margin: 0, color: '#38bdf8', fontWeight: 500 }}><PackageOpen size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> {d.article}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {d.statut === 'en_attente' ? (
                  <>
                    <button onClick={() => handleValidation(d.id, true)} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} /> Valider & Préparer</button>
                    <button onClick={() => handleValidation(d.id, false)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><X size={16} /> Refuser</button>
                  </>
                ) : d.statut === 'valide' ? (
                  <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>✅ Distribué</span>
                ) : (
                  <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>❌ Refusé</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'stock' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {stock.map(s => {
            const isLow = s.qte <= s.seuil;
            return (
              <div key={s.id} className="glass-panel" style={{ padding: '20px', borderTop: `4px solid ${isLow ? '#ef4444' : '#10b981'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', paddingRight: '20px' }}>{s.nom}</h3>
                  <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: isLow ? '#ef4444' : 'white', lineHeight: 1 }}>{s.qte}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>en stock</span>
                </div>
                {isLow && (
                  <div style={{ marginTop: '16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PackageOpen size={14} /> Stock d'alerte atteint (Seuil: {s.seuil})
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
