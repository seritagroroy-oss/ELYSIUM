import React, { useState } from 'react';
import { CreditCard, Plus, Search, AlertCircle, Clock, User, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

export default function BadgesProvisoires() {
  const [badges] = useState([
    { id: 1, type: 'Employé', nom: 'Konan Aya', badgeNum: '04', heure_pret: '08:15', statut: 'en_cours', motif: 'Oubli de badge' },
    { id: 2, type: 'Prestataire', nom: 'Equipe Ménage (Aziz)', badgeNum: '12', heure_pret: '06:00', statut: 'en_cours', motif: 'Nettoyage quotidien' },
    { id: 3, type: 'Employé', nom: 'Traoré Seydou', badgeNum: '07', heure_pret: 'Hier 14:00', statut: 'retard', motif: 'Perte de badge' },
    { id: 4, type: 'Visiteur', nom: 'M. Leroy', badgeNum: '01', heure_pret: '09:00', statut: 'rendu', heure_rendu: '11:30' }
  ]);
  
  const [filter, setFilter] = useState('actifs');
  
  const filtered = badges.filter(b => {
    if (filter === 'actifs') return b.statut === 'en_cours' || b.statut === 'retard';
    if (filter === 'retard') return b.statut === 'retard';
    return true;
  });

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={28} color="#f59e0b" /> Badges Provisoires
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Prêts de badges aux employés (oublis) et prestataires.</p>
        </div>
        <button style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '12px 22px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>
          <Plus size={20} /> Prêter un Badge
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setFilter('actifs')} style={{ padding: '8px 16px', borderRadius: '8px', background: filter==='actifs'?'rgba(245,158,11,0.15)':'transparent', border: `1px solid ${filter==='actifs'?'#f59e0b':'var(--border)'}`, color: filter==='actifs'?'#f59e0b':'var(--muted)', cursor: 'pointer', fontWeight: 600 }}>Prêts en cours</button>
        <button onClick={() => setFilter('retard')} style={{ padding: '8px 16px', borderRadius: '8px', background: filter==='retard'?'rgba(239,68,68,0.15)':'transparent', border: `1px solid ${filter==='retard'?'#ef4444':'var(--border)'}`, color: filter==='retard'?'#ef4444':'var(--muted)', cursor: 'pointer', fontWeight: 600 }}>Non rendus (Alertes)</button>
        <button onClick={() => setFilter('tous')} style={{ padding: '8px 16px', borderRadius: '8px', background: filter==='tous'?'rgba(255,255,255,0.1)':'transparent', border: `1px solid ${filter==='tous'?'white':'var(--border)'}`, color: filter==='tous'?'white':'var(--muted)', cursor: 'pointer', fontWeight: 600 }}>Historique complet</button>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--muted)' }}>
              <th style={{ padding: '16px' }}>Bénéficiaire</th>
              <th style={{ padding: '16px' }}>Badge N°</th>
              <th style={{ padding: '16px' }}>Prêt</th>
              <th style={{ padding: '16px' }}>Retour</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'white' }}>{b.nom}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{b.type} • {b.motif}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ background: '#f59e0b', color: 'black', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    #{b.badgeNum}
                  </span>
                </td>
                <td style={{ padding: '16px', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LogIn size={16} color="var(--muted)" /> {b.heure_pret}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  {b.statut === 'rendu' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
                      <LogOut size={16} /> {b.heure_rendu}
                    </div>
                  ) : b.statut === 'retard' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>
                      <AlertCircle size={16} /> Retard / Oubli
                    </div>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>En possession</span>
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  {b.statut !== 'rendu' ? (
                    <button style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} /> Restituer
                    </button>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Archivé</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
