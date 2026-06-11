import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Phone, Mail, Navigation, History, Radio, Eye, Circle, Activity, ChevronRight } from 'lucide-react';

// Simulation de positions GPS pour les agents
const AGENTS_DATA = [
  {
    id: 1,
    nom: 'Koffi Marc',
    role: 'Agent de Sécurité',
    phone: '+225 07 12 34 56',
    email: 'koffi.marc@elysium.ci',
    site: 'Zone Industrielle Yopougon',
    status: 'en_poste',
    battery: 78,
    signal: 'fort',
    lat: 5.3364,
    lng: -4.0263,
    speed: 0,
    historique: [
      { time: '01:30', lat: 5.3360, lng: -4.0260 },
      { time: '01:45', lat: 5.3362, lng: -4.0261 },
      { time: '02:00', lat: 5.3364, lng: -4.0263 },
    ]
  },
  {
    id: 2,
    nom: 'Diallo Ibrahim',
    role: 'Chef d\'Équipe',
    phone: '+225 05 98 76 54',
    email: 'diallo.ibrahim@elysium.ci',
    site: 'Siège Plateau',
    status: 'en_deplacement',
    battery: 45,
    signal: 'moyen',
    lat: 5.3197,
    lng: -4.0160,
    speed: 42,
    historique: [
      { time: '01:15', lat: 5.3150, lng: -4.0100 },
      { time: '01:30', lat: 5.3170, lng: -4.0130 },
      { time: '01:45', lat: 5.3197, lng: -4.0160 },
    ]
  },
  {
    id: 3,
    nom: 'Aya Cissé',
    role: 'Agent de Sécurité',
    phone: '+225 01 23 45 67',
    email: 'aya.cisse@elysium.ci',
    site: 'Port San Pedro',
    status: 'en_poste',
    battery: 12,
    signal: 'faible',
    lat: 4.7478,
    lng: -6.6481,
    speed: 0,
    historique: [
      { time: '00:00', lat: 4.7476, lng: -6.6480 },
      { time: '01:00', lat: 4.7477, lng: -6.6481 },
      { time: '02:00', lat: 4.7478, lng: -6.6481 },
    ]
  },
  {
    id: 4,
    nom: 'Koné Dramane',
    role: 'Contrôleur de Site',
    phone: '+225 07 65 43 21',
    email: 'kone.dramane@elysium.ci',
    site: 'Complexe Agro Bouaké',
    status: 'hors_ligne',
    battery: 3,
    signal: 'perdu',
    lat: 7.6939,
    lng: -5.0311,
    speed: 0,
    historique: [
      { time: '23:30', lat: 7.6935, lng: -5.0308 },
      { time: '00:00', lat: 7.6937, lng: -5.0309 },
      { time: '00:30', lat: 7.6939, lng: -5.0311 },
    ]
  },
  {
    id: 5,
    nom: 'Touré Seydou',
    role: 'Agent de Patrouille',
    phone: '+225 05 11 22 33',
    email: 'toure.seydou@elysium.ci',
    site: 'Résidence Cocody',
    status: 'en_deplacement',
    battery: 60,
    signal: 'fort',
    lat: 5.3629,
    lng: -3.9940,
    speed: 28,
    historique: [
      { time: '01:40', lat: 5.3610, lng: -3.9920 },
      { time: '01:50', lat: 5.3620, lng: -3.9930 },
      { time: '02:00', lat: 5.3629, lng: -3.9940 },
    ]
  },
];

const STATUS_COLORS = {
  en_poste: { color: '#22c55e', label: 'En Poste', glow: '#22c55e' },
  en_deplacement: { color: '#3b82f6', label: 'En Déplacement', glow: '#3b82f6' },
  hors_ligne: { color: '#ef4444', label: 'Hors Ligne', glow: '#ef4444' },
};

export default function PCTracking() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(AGENTS_DATA[0]);
  const [showHistory, setShowHistory] = useState(false);
  const [tick, setTick] = useState(0);

  // Simulation animation live
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredAgents = AGENTS_DATA.filter(a =>
    a.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.phone.includes(searchQuery) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = AGENTS_DATA.filter(a => a.status !== 'hors_ligne').length;
  const movingCount = AGENTS_DATA.filter(a => a.status === 'en_deplacement').length;

  // Coordonnées normalisées pour la "carte" simulée (viewport 100% x 600px)
  const latMin = 4.5, latMax = 8.0;
  const lngMin = -7.0, lngMax = -3.5;
  const toX = (lng) => ((lng - lngMin) / (lngMax - lngMin)) * 100;
  const toY = (lat) => ((latMax - lat) / (latMax - latMin)) * 100;

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', backgroundColor: '#020617', color: '#e2e8f0', borderRadius: '16px', padding: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid rgba(59,130,246,0.3)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(56,189,248,0.4)' }}>
            <Navigation size={32} /> Tracking & Géolocalisation
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>Localisation en direct des agents, contrôleurs et équipages via téléphone, email et signal réseau.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', padding: '10px 20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '1.3rem' }}>{activeCount}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>En Ligne</div>
          </div>
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6', padding: '10px 20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '1.3rem' }}>{movingCount}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>En Mouvement</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>

        {/* Panneau gauche - liste + recherche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Barre de recherche */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={18} color="#38bdf8" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Nom, téléphone ou email..."
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', width: '100%', fontSize: '0.95rem' }}
            />
          </div>

          {/* Liste agents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '520px' }}>
            {filteredAgents.map(agent => (
              <div
                key={agent.id}
                onClick={() => { setSelectedAgent(agent); setShowHistory(false); }}
                style={{
                  background: selectedAgent?.id === agent.id ? 'rgba(56,189,248,0.1)' : '#0f172a',
                  border: `1px solid ${selectedAgent?.id === agent.id ? '#38bdf8' : '#1e293b'}`,
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: STATUS_COLORS[agent.status].color,
                      boxShadow: `0 0 8px ${STATUS_COLORS[agent.status].glow}`,
                      animation: agent.status === 'en_deplacement' ? 'pulse 1.5s infinite' : 'none'
                    }} />
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem' }}>{agent.nom}</div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{agent.role}</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#64748b" />
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {agent.phone}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {agent.email}</span>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: `${STATUS_COLORS[agent.status].color}20`, color: STATUS_COLORS[agent.status].color, border: `1px solid ${STATUS_COLORS[agent.status].color}40`, fontWeight: 'bold' }}>
                    {STATUS_COLORS[agent.status].label}
                    {agent.status === 'en_deplacement' && ` · ${agent.speed} km/h`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carte principale + détail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Carte Interactive Simulée */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden', position: 'relative', height: '400px' }}>
            
            {/* Fond de carte simulé */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }} />
            
            {/* Zones de couleur pour simuler la carte CI */}
            <div style={{ position: 'absolute', top: '30%', left: '15%', width: '70%', height: '55%', background: 'rgba(34,197,94,0.04)', borderRadius: '40%', border: '1px dashed rgba(34,197,94,0.1)' }} />
            <div style={{ position: 'absolute', top: '50%', left: '30%', width: '50%', height: '40%', background: 'rgba(59,130,246,0.06)', borderRadius: '30%' }} />
            
            {/* Label pays */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: 'rgba(255,255,255,0.04)', fontSize: '4rem', fontWeight: 'bold', letterSpacing: '8px', userSelect: 'none' }}>CÔTE D'IVOIRE</div>

            {/* Points agents */}
            {AGENTS_DATA.map(agent => {
              const x = toX(agent.lng);
              const y = toY(agent.lat);
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: isSelected ? 20 : 10
                  }}
                >
                  {/* Halo animé */}
                  {agent.status !== 'hors_ligne' && (
                    <div style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: isSelected ? '36px' : '24px',
                      height: isSelected ? '36px' : '24px',
                      borderRadius: '50%',
                      background: `${STATUS_COLORS[agent.status].color}20`,
                      border: `1px solid ${STATUS_COLORS[agent.status].color}40`,
                      animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                    }} />
                  )}
                  {/* Point central */}
                  <div style={{
                    width: isSelected ? '18px' : '12px',
                    height: isSelected ? '18px' : '12px',
                    borderRadius: '50%',
                    background: STATUS_COLORS[agent.status].color,
                    border: `2px solid ${isSelected ? 'white' : '#020617'}`,
                    boxShadow: `0 0 ${isSelected ? '15px' : '8px'} ${STATUS_COLORS[agent.status].glow}`,
                    transition: 'all 0.3s',
                    position: 'relative', zIndex: 1
                  }} />
                  {/* Label */}
                  {isSelected && (
                    <div style={{ position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(2,6,23,0.9)', color: 'white', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap', border: '1px solid #334155', backdropFilter: 'blur(8px)' }}>
                      {agent.nom}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Badge LIVE */}
            <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', borderRadius: '4px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 'bold', color: '#ef4444' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} /> LIVE
            </div>

            {/* Légende */}
            <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(2,6,23,0.8)', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px 14px', backdropFilter: 'blur(8px)' }}>
              {Object.entries(STATUS_COLORS).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: v.color }} />
                  {v.label}
                </div>
              ))}
            </div>
          </div>

          {/* Fiche Détail Agent Sélectionné */}
          {selectedAgent && (
            <div style={{ background: '#0f172a', border: `1px solid ${STATUS_COLORS[selectedAgent.status].color}40`, borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: STATUS_COLORS[selectedAgent.status].color, boxShadow: `0 0 8px ${STATUS_COLORS[selectedAgent.status].glow}` }} />
                    {selectedAgent.nom}
                    <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '20px', background: `${STATUS_COLORS[selectedAgent.status].color}20`, color: STATUS_COLORS[selectedAgent.status].color, border: `1px solid ${STATUS_COLORS[selectedAgent.status].color}40` }}>
                      {STATUS_COLORS[selectedAgent.status].label}
                    </span>
                  </h3>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{selectedAgent.role} · {selectedAgent.site}</div>
                </div>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ background: showHistory ? 'rgba(56,189,248,0.1)' : 'transparent', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <History size={18} /> {showHistory ? 'Masquer' : 'Historique 24h'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> Téléphone</div>
                  <div style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>{selectedAgent.phone}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> Email</div>
                  <div style={{ color: 'white', fontWeight: '600', fontSize: '0.85rem', wordBreak: 'break-all' }}>{selectedAgent.email}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> Coordonnées</div>
                  <div style={{ color: 'white', fontWeight: '600', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {selectedAgent.lat.toFixed(4)}, {selectedAgent.lng.toFixed(4)}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={14} /> Vitesse</div>
                  <div style={{ color: selectedAgent.speed > 0 ? '#3b82f6' : '#22c55e', fontWeight: '600', fontSize: '1.1rem' }}>
                    {selectedAgent.speed} km/h
                  </div>
                </div>
              </div>

              {/* Historique des positions */}
              {showHistory && (
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px', marginTop: '4px' }}>
                  <h4 style={{ color: '#38bdf8', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={16} /> Trajectoire des dernières positions
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {selectedAgent.historique.map((h, i) => (
                      <React.Fragment key={i}>
                        <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '8px 14px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ color: '#38bdf8', fontWeight: 'bold', fontFamily: 'monospace' }}>{h.time}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            {h.lat.toFixed(3)}, {h.lng.toFixed(3)}
                          </div>
                        </div>
                        {i < selectedAgent.historique.length - 1 && (
                          <ChevronRight size={16} color="#334155" />
                        )}
                      </React.Fragment>
                    ))}
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 14px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ color: '#ef4444', fontWeight: 'bold', fontFamily: 'monospace' }}>MAINTENANT</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {selectedAgent.lat.toFixed(3)}, {selectedAgent.lng.toFixed(3)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
