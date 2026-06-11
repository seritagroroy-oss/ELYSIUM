import React, { useState } from 'react';
import { ClipboardList, PlusCircle, MapPin, Clock, CheckCircle2, AlertTriangle, Filter } from 'lucide-react';

const INITIAL_INCIDENTS = [
  { id: 'INC-047', type: 'Intrusion', site: 'Zone Industrielle Yopougon', agent: 'Koffi Marc', heure: '02:12', statut: 'en_cours', detail: 'Alarme périmètre déclenchée. Individu non identifié repéré sur la clôture Ouest.' },
  { id: 'INC-046', type: 'Malaise Agent', site: 'Siège Plateau', agent: 'Diallo Ibrahim', heure: '01:48', statut: 'resolu', detail: 'Agent pris de vertiges en poste. SAMU appelé. Situation maîtrisée.' },
  { id: 'INC-045', type: 'Perte Signal Radio', site: 'Complexe Agro Bouaké', agent: 'Koné Dramane', heure: '01:30', statut: 'en_cours', detail: 'Perte de contact avec l\'équipe de nuit. Répéteur radio potentiellement défaillant.' },
  { id: 'INC-044', type: 'Tentative Effraction Véhicule', site: 'Port San Pedro', agent: 'Gbagbo Pierre', heure: '23:55', statut: 'resolu', detail: 'Tentative sur 2 camions en zone de stationnement. Suspects en fuite. Police notifiée.' },
  { id: 'INC-043', type: 'Ronde de Routine', site: 'Résidence Cocody', agent: 'Touré Seydou', heure: '23:00', statut: 'resolu', detail: 'RAS. Ronde complète effectuée. Toutes les accès sécurisés.' },
];

export default function PCMainCourante() {
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [filter, setFilter] = useState('tous');
  const [showForm, setShowForm] = useState(false);
  const [newInc, setNewInc] = useState({ type: '', site: '', agent: '', detail: '' });

  const filtered = incidents.filter(inc => filter === 'tous' || inc.statut === filter);

  const addIncident = () => {
    if (!newInc.type || !newInc.site) return;
    const id = `INC-${String(Math.floor(Math.random() * 900) + 100)}`;
    setIncidents([{
      id,
      type: newInc.type,
      site: newInc.site,
      agent: newInc.agent || 'PC Central',
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      statut: 'en_cours',
      detail: newInc.detail
    }, ...incidents]);
    setNewInc({ type: '', site: '', agent: '', detail: '' });
    setShowForm(false);
  };

  const resolveIncident = (id) => {
    setIncidents(incidents.map(inc => inc.id === id ? { ...inc, statut: 'resolu' } : inc));
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', backgroundColor: '#020617', color: '#e2e8f0', borderRadius: '16px', padding: '24px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid rgba(59,130,246,0.3)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '2px' }}>
            <ClipboardList size={32} /> Registre Central des Incidents
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>Supervision globale de toutes les mains courantes. {incidents.filter(i => i.statut === 'en_cours').length} incident(s) en cours.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1rem' }}>
          <PlusCircle size={20} /> Déclarer un Incident
        </button>
      </div>

      {/* Formulaire de déclaration */}
      {showForm && (
        <div style={{ background: '#0f172a', border: '1px solid #3b82f6', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#3b82f6' }}>Nouveau Rapport d'Incident</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Type d'incident *</label>
              <input type="text" value={newInc.type} onChange={e => setNewInc({ ...newInc, type: e.target.value })} placeholder="Ex: Intrusion, SOS, Malaise..." className="form-input" style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white' }} />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Site concerné *</label>
              <input type="text" value={newInc.site} onChange={e => setNewInc({ ...newInc, site: e.target.value })} placeholder="Ex: Port San Pedro" className="form-input" style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white' }} />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Agent déclarant</label>
              <input type="text" value={newInc.agent} onChange={e => setNewInc({ ...newInc, agent: e.target.value })} placeholder="Nom de l'agent" className="form-input" style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white' }} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Détail du rapport</label>
            <textarea value={newInc.detail} onChange={e => setNewInc({ ...newInc, detail: e.target.value })} placeholder="Décrivez l'incident précisément..." className="form-input" style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white', minHeight: '80px', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Annuler</button>
            <button onClick={addIncident} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Enregistrer l'Incident</button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[['tous', 'Tous'], ['en_cours', 'En Cours'], ['resolu', 'Résolus']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: filter === val ? 'bold' : 'normal', background: filter === val ? '#3b82f6' : '#1e293b', color: filter === val ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Liste des incidents */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(inc => (
          <div key={inc.id} style={{ background: '#0f172a', border: `1px solid ${inc.statut === 'en_cours' ? '#3b82f6' : '#1e293b'}`, borderRadius: '10px', padding: '20px', display: 'flex', gap: '20px', opacity: inc.statut === 'resolu' ? 0.75 : 1 }}>
            
            <div style={{ width: '4px', borderRadius: '2px', background: inc.statut === 'en_cours' ? '#ef4444' : '#22c55e', flexShrink: 0 }} />

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'monospace', color: '#3b82f6', fontSize: '0.9rem' }}>{inc.id}</span>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{inc.type}</h3>
                    <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px', background: inc.statut === 'en_cours' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)', color: inc.statut === 'en_cours' ? '#ef4444' : '#22c55e', fontWeight: 'bold', textTransform: 'uppercase', border: `1px solid ${inc.statut === 'en_cours' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` }}>
                      {inc.statut.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', color: '#64748b', fontSize: '0.85rem', marginTop: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {inc.site}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {inc.heure}</span>
                    <span>👤 {inc.agent}</span>
                  </div>
                </div>
                {inc.statut === 'en_cours' && (
                  <button onClick={() => resolveIncident(inc.id)} style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid #22c55e', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={16} /> Clôturer
                  </button>
                )}
              </div>
              {inc.detail && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', borderLeft: '2px solid #334155' }}>
                  {inc.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
