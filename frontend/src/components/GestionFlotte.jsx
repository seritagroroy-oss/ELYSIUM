import React, { useState } from 'react';
import { Car, Key, Calendar, User, Search, MapPin, Gauge, Fuel, CheckCircle2, AlertTriangle, Plus, X } from 'lucide-react';

export default function GestionFlotte() {
  const [vehicules] = useState([
    { id: 'v1', marque: 'Toyota Hilux', plaque: 'AB-123-CD', statut: 'disponible', km: 45200, essence: 80, localisation: 'Parking Sous-sol A1' },
    { id: 'v2', marque: 'Renault Kangoo', plaque: 'EF-456-GH', statut: 'en_mission', km: 112300, essence: 40, chauffeur: 'Kouassi Marc', retour_prevu: '16:00' },
    { id: 'v3', marque: 'Peugeot 3008', plaque: 'IJ-789-KL', statut: 'maintenance', km: 67800, essence: 20, motif: 'Révision 70k' }
  ]);

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedV, setSelectedV] = useState(null);

  const handleAction = (v) => {
    setSelectedV(v);
    setShowModal(true);
  };

  const getStatusStyle = (statut) => {
    switch(statut) {
      case 'disponible': return { color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
      case 'en_mission': return { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
      case 'maintenance': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
      default: return { color: 'white', bg: 'rgba(255,255,255,0.1)' };
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Car size={28} color="#3b82f6" /> Gestion de Flotte (Clés & Réservations)
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Suivez les véhicules de service, gérez la remise des clés et les retours.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {vehicules.map(v => {
          const style = getStatusStyle(v.statut);
          return (
            <div key={v.id} className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: style.bg, borderRadius: '0 0 0 100%', zIndex: 0 }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem' }}>{v.marque}</h3>
                    <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.9)', color: 'black', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace', border: '1px solid #ccc' }}>
                      {v.plaque}
                    </div>
                  </div>
                  <div style={{ background: style.bg, color: style.color, padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {v.statut.replace('_', ' ')}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Gauge size={16} color="var(--muted)" /> {v.km.toLocaleString()} km</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Fuel size={16} color="var(--muted)" /> {v.essence}%</div>
                  
                  {v.statut === 'disponible' ? (
                    <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} color="var(--muted)" /> {v.localisation}</div>
                  ) : v.statut === 'en_mission' ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}><User size={16} /> {v.chauffeur}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}><Clock size={16} /> Retour: {v.retour_prevu}</div>
                    </>
                  ) : (
                    <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}><AlertTriangle size={16} /> {v.motif}</div>
                  )}
                </div>

                {v.statut === 'disponible' && (
                  <button onClick={() => handleAction(v)} style={{ width: '100%', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
                    <Key size={18} /> Remettre les clés (Départ)
                  </button>
                )}
                {v.statut === 'en_mission' && (
                  <button onClick={() => handleAction(v)} style={{ width: '100%', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
                    <CheckCircle2 size={18} /> Enregistrer le Retour
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && selectedV && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedV.statut === 'disponible' ? <><Key size={24} color="#3b82f6" /> Bon de Sortie</> : <><CheckCircle2 size={24} color="#10b981" /> Retour de Véhicule</>}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1.1rem' }}>{selectedV.marque}</strong>
              <span style={{ fontFamily: 'monospace', background: 'white', color: 'black', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{selectedV.plaque}</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowModal(false); }} style={{ display: 'grid', gap: '16px' }}>
              {selectedV.statut === 'disponible' ? (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Chauffeur / Agent *</label>
                    <input type="text" required className="form-input" placeholder="Nom complet" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Motif du déplacement</label>
                    <input type="text" className="form-input" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Heure de retour prévue</label>
                    <input type="time" required className="form-input" />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px', background: '#3b82f6', border: 'none', color: 'white', fontWeight: 'bold' }}>Valider le départ</button>
                </>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Kilométrage au retour *</label>
                    <input type="number" required className="form-input" defaultValue={selectedV.km + 15} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Niveau d'essence restant (%)</label>
                    <input type="range" min="0" max="100" step="10" defaultValue={selectedV.essence} style={{ width: '100%', accentColor: '#10b981' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Observations (dégâts, incidents...)</label>
                    <textarea className="form-input" rows="2" placeholder="Rien à signaler"></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px', background: '#10b981', border: 'none', color: '#0f172a', fontWeight: 'bold' }}>Valider le retour de clé</button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
