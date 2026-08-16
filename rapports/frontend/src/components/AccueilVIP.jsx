import React, { useState } from 'react';
import { Crown, Calendar, Clock, MapPin, Coffee, CarFront, CheckCircle2, Search, Plus, Bell } from 'lucide-react';

export default function AccueilVIP() {
  const [vips] = useState([
    { id: 1, nom: 'M. Jean-Luc DUPONT', fonction: 'Directeur Général Groupe', entreprise: 'HQ Paris', date: 'Aujourd\'hui', heure: '10:30', parking: 'Place P1 (Réservée)', repas: 'Plateau Repas Premium (12h30)', statut: 'attendu' },
    { id: 2, nom: 'Délégation Ministerielle', fonction: 'Cabinet Ministre', entreprise: 'Gouvernement', date: 'Demain', heure: '09:00', parking: 'Places P2 à P5', repas: 'Cocktail d\'accueil (Salle A)', statut: 'planifie' }
  ]);

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Crown size={28} color="#eab308" /> Protocole & Accueil VIP
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Planification et gestion sur mesure des visites de haut rang.</p>
        </div>
        <button style={{ background: '#eab308', color: '#0f172a', border: 'none', padding: '12px 22px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(234,179,8,0.3)' }}>
          <Plus size={20} /> Nouvelle Visite VIP
        </button>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {vips.map(v => (
          <div key={v.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header VIP */}
            <div style={{ background: 'linear-gradient(90deg, rgba(234,179,8,0.15) 0%, rgba(0,0,0,0) 100%)', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(234,179,8,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(234,179,8,0.2)' }}>
                  <Crown size={28} color="#eab308" />
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: 'white' }}>{v.nom}</h2>
                  <div style={{ color: '#eab308', fontWeight: 600, fontSize: '0.95rem' }}>{v.fonction} <span style={{ color: 'var(--muted)', fontWeight: 'normal' }}>• {v.entreprise}</span></div>
                </div>
              </div>
              {v.statut === 'attendu' ? (
                <button style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} /> Marquer Présent
                </button>
              ) : (
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>Planifié</span>
              )}
            </div>

            {/* Détails Protocole */}
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Clock size={20} color="var(--muted)" />
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '2px' }}>Arrivée prévue</div>
                  <strong style={{ color: 'white' }}>{v.date} à {v.heure}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <CarFront size={20} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '2px' }}>Protocole Parking</div>
                  <strong style={{ color: 'white' }}>{v.parking}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Coffee size={20} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '2px' }}>Restauration / Traiteur</div>
                  <strong style={{ color: 'white' }}>{v.repas}</strong>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 20px', display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.02)' }}>
              <button style={{ background: 'transparent', border: '1px solid var(--border)', color: 'white', padding: '6px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bell size={14} /> Prévenir la Direction
              </button>
              <button style={{ background: 'transparent', border: '1px solid var(--border)', color: 'white', padding: '6px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} /> Voir le planning de visite
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
