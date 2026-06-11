import React, { useState } from 'react';
import { ScrollText, Search, Filter, ShieldAlert, User, Clock, ArrowRight } from 'lucide-react';

export default function DGAudit() {
  const [logs] = useState([
    { id: 1, action: 'Validation de Paie', user: 'Comptabilité (Admin)', details: 'Validation globale des salaires de Mai 2026', date: '06/06/2026 14:32', risk: 'high' },
    { id: 2, action: 'Modification de Profil', user: 'RH (Manager)', details: 'Mise à jour du contrat de KOUASSI Jean', date: '06/06/2026 11:15', risk: 'medium' },
    { id: 3, action: 'Alerte Sécurité', user: 'Secrétariat (Accueil)', details: 'Déclenchement d\'une procédure d\'évacuation', date: '05/06/2026 09:45', risk: 'critical' },
    { id: 4, action: 'Consultation Archives', user: 'RH (Assistant)', details: 'Lecture du rapport Avril 2026', date: '04/06/2026 16:20', risk: 'low' },
    { id: 5, action: 'Ajout de Matériel', user: 'Logistique', details: 'Ajout de 10 radios au stock', date: '04/06/2026 10:05', risk: 'low' }
  ]);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return { bg: 'rgba(168,85,247,0.1)', text: '#a855f7' };
      case 'high': return { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' };
      case 'medium': return { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' };
      case 'low': return { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' };
      default: return { bg: 'rgba(255,255,255,0.1)', text: 'white' };
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#eab308' }}>
            <ScrollText size={32} /> Audit & Traçabilité
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1.05rem', maxWidth: '600px', lineHeight: '1.5' }}>
            Journal complet des actions sensibles effectuées sur l'ensemble de la plateforme. Aucun événement n'échappe à la direction.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }} />
            <input 
              type="text" 
              placeholder="Rechercher une action, un utilisateur..." 
              className="form-input"
              style={{ width: '100%', paddingLeft: '40px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} /> Tous les risques
            </button>
            <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} /> 7 derniers jours
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--muted)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '500' }}>Date & Heure</th>
                <th style={{ padding: '16px 20px', fontWeight: '500' }}>Utilisateur / Service</th>
                <th style={{ padding: '16px 20px', fontWeight: '500' }}>Action effectuée</th>
                <th style={{ padding: '16px 20px', fontWeight: '500' }}>Niveau de Risque</th>
                <th style={{ padding: '16px 20px', fontWeight: '500', textAlign: 'right' }}>Détails</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const colors = getRiskColor(log.risk);
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover-bg">
                    <td style={{ padding: '20px', color: 'var(--muted)', fontSize: '0.9rem' }}>{log.date}</td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '50%' }}>
                          <User size={14} />
                        </div>
                        {log.user}
                      </div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ color: 'white', fontWeight: '500', marginBottom: '4px' }}>{log.action}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{log.details}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ background: colors.bg, color: colors.text, padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {log.risk}
                      </span>
                    </td>
                    <td style={{ padding: '20px', textAlign: 'right' }}>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '8px' }}>
                        <ArrowRight size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
