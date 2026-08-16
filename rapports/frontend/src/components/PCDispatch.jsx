import React, { useState } from 'react';
import { ShieldAlert, Car, MapPin, Phone, CheckCircle2, Clock, Map } from 'lucide-react';

export default function PCDispatch() {
  const [patrouilles, setPatrouilles] = useState([
    { id: 'P-01', type: 'Véhicule Blindé', status: 'disponible', location: 'Plateau', eta: null },
    { id: 'P-02', type: 'Pickup Intervention', status: 'en_mission', location: 'En route vers Vridi', eta: '12 min' },
    { id: 'M-01', type: 'Moto Rapide', status: 'disponible', location: 'Cocody', eta: null },
    { id: 'M-02', type: 'Moto Rapide', status: 'en_mission', location: 'Sur site (Marcory)', eta: 'Arrivé' }
  ]);

  const [mission, setMission] = useState({ site: '', urgence: 'Haute' });
  const [dispatched, setDispatched] = useState(null);

  const handleDispatch = (patrouilleId) => {
    if (!mission.site) return;
    setPatrouilles(p => p.map(unit => unit.id === patrouilleId ? { ...unit, status: 'en_mission', location: `En route vers ${mission.site}`, eta: 'Calcul...' } : unit));
    setDispatched(patrouilleId);
    setTimeout(() => {
      setPatrouilles(p => p.map(unit => unit.id === patrouilleId ? { ...unit, eta: '15 min' } : unit));
      setDispatched(null);
      setMission({ site: '', urgence: 'Haute' });
    }, 2000);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', backgroundColor: '#020617', color: '#e2e8f0', borderRadius: '16px', padding: '24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid rgba(245,158,11,0.3)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '2px' }}>
            <ShieldAlert size={32} /> Dispatch & Patrouilles
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>Gestion de la flotte d'intervention rapide et liaison avec les Forces de l'Ordre.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid #3b82f6', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Phone size={18} /> Appeler Police (111)
          </button>
          <button style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Phone size={18} /> Appeler Gendarmerie (114)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Assigner une mission */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Map size={20} color="#f59e0b" /> Ordre de Mission
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Site en détresse</label>
              <input 
                type="text" 
                className="form-input" 
                value={mission.site} 
                onChange={e => setMission({ ...mission, site: e.target.value })} 
                placeholder="Ex: Entrepôt Vridi" 
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white' }} 
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Niveau d'Urgence</label>
              <select 
                className="form-input" 
                value={mission.urgence} 
                onChange={e => setMission({ ...mission, urgence: e.target.value })} 
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white' }}
              >
                <option value="Haute">Haute (Intrusion avérée, SOS)</option>
                <option value="Moyenne">Moyenne (Vérification levée de doute)</option>
                <option value="Basse">Basse (Ronde de routine)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(245,158,11,0.05)', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5' }}>
              Sélectionnez une patrouille disponible ci-contre pour l'assigner à cette mission. Les temps de trajet (ETA) sont calculés en fonction du trafic actuel.
            </p>
          </div>
        </div>

        {/* Flotte */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {patrouilles.map(p => (
            <div key={p.id} style={{ 
              background: '#0f172a', 
              border: `1px solid ${p.status === 'disponible' ? '#22c55e' : '#3b82f6'}`, 
              borderRadius: '12px', 
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: dispatched === p.id ? '0 0 20px rgba(245,158,11,0.3)' : 'none',
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: p.status === 'disponible' ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={24} color={p.status === 'disponible' ? '#22c55e' : '#3b82f6'} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {p.id} - {p.type}
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: p.status === 'disponible' ? '#22c55e' : '#3b82f6', color: p.status === 'disponible' ? '#020617' : 'white', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', color: '#94a3b8', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={16} /> {p.location}</span>
                    {p.eta && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: p.eta === 'Calcul...' ? '#f59e0b' : '#3b82f6' }}><Clock size={16} /> ETA: {p.eta}</span>}
                  </div>
                </div>
              </div>

              {p.status === 'disponible' ? (
                <button 
                  onClick={() => handleDispatch(p.id)}
                  disabled={!mission.site}
                  style={{ background: mission.site ? '#f59e0b' : '#1e293b', color: mission.site ? '#0a0a0a' : '#64748b', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: mission.site ? 'pointer' : 'not-allowed', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                  Assigner
                </button>
              ) : (
                <div style={{ color: '#3b82f6', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={20} /> Unité Déployée
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
