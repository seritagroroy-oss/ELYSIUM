import React, { useState } from 'react';
import { UserCheck, CheckCircle2, XCircle, AlertTriangle, MessageSquare, MapPin, Save, User } from 'lucide-react';

export default function CtrlAudit() {
  const sitesData = {
    'Siège Social Cocody': [
      { id: 101, name: 'Koffi Marc', role: 'Agent de Sécurité', status: 'present', note: '' },
      { id: 102, name: 'Bamba Souleymane', role: 'Contrôleur Accès', status: 'present', note: '' },
      { id: 103, name: 'Yao Kouassi', role: 'Rondeur Nuit', status: 'pending', note: '' },
      { id: 104, name: 'Diallo Alpha', role: 'Opérateur CCTV', status: 'present', note: '' }
    ],
    'Entrepôt Vridi': [
      { id: 201, name: 'Koné Ibrahim', role: 'Chef de Poste', status: 'pending', note: '' },
      { id: 202, name: 'Gnahoré Jean', role: 'Chien Conducteur', status: 'pending', note: '' },
      { id: 203, name: 'Tuho Moussa', role: 'Rondeur Extérieur', status: 'absent', note: 'Non présent à la prise de service. Remplaçant demandé.' },
      { id: 204, name: 'Traoré Fanta', role: 'Agent d\'Accueil', status: 'present', note: '' }
    ],
    'Zone Industrielle Yopougon': [
      { id: 301, name: 'Kouamé Kouassi', role: 'Agent Surveillance', status: 'pending', note: '' },
      { id: 302, name: 'Sanogo Bakary', role: 'Chef de Poste', status: 'anomalie', note: 'Pas de tenue réglementaire (manque rangers).' },
      { id: 303, name: 'Ouattara Fatoumata', role: 'Contrôleur Sacs', status: 'pending', note: '' }
    ]
  };

  const [selectedSite, setSelectedSite] = useState('Siège Social Cocody');
  const [agents, setAgents] = useState(sitesData);
  const [activeNotes, setActiveNotes] = useState({});
  const [showNotification, setShowNotification] = useState(false);

  const handleStatusChange = (agentId, status) => {
    const updated = { ...agents };
    updated[selectedSite] = updated[selectedSite].map(agent => 
      agent.id === agentId ? { ...agent, status } : agent
    );
    setAgents(updated);
  };

  const handleNoteChange = (agentId, text) => {
    setActiveNotes({
      ...activeNotes,
      [agentId]: text
    });
  };

  const saveAgentNote = (agentId) => {
    const updated = { ...agents };
    updated[selectedSite] = updated[selectedSite].map(agent => 
      agent.id === agentId ? { ...agent, note: activeNotes[agentId] || '' } : agent
    );
    setAgents(updated);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  const currentAgents = agents[selectedSite] || [];
  const checkedCount = currentAgents.filter(a => a.status !== 'pending').length;
  const totalCount = currentAgents.length;

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', backgroundColor: '#090d16', color: '#f1f5f9', borderRadius: '16px', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(99, 102, 241, 0.2)', paddingBottom: '20px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#818cf8' }}>
          <UserCheck size={28} /> Contrôle & Audit Agents
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
          Audit terrain en temps réel des agents de garde : pointage de présence et constatation d'anomalies.
        </p>
      </div>

      {/* Selector and Progress */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
        <div style={{ flex: '1 1 300px', backgroundColor: '#111827', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '12px', padding: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#94a3b8', fontWeight: '600' }}>
            Sélectionner le Site à inspecter
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                color: 'white',
                fontSize: '1rem',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            >
              {Object.keys(agents).map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#818cf8' }}>
              <MapPin size={18} />
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 200px', backgroundColor: '#111827', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>
            <span>Statut de l'audit du site</span>
            <span style={{ fontWeight: '700', color: '#818cf8' }}>{checkedCount} / {totalCount} contrôlés</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#1f2937', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(checkedCount / totalCount) * 100}%`, height: '100%', backgroundColor: '#6366f1', borderRadius: '4px', transition: 'width 0.3s' }}></div>
          </div>
        </div>
      </div>

      {/* Agents Audit List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {currentAgents.map((agent) => {
          const noteText = activeNotes[agent.id] !== undefined ? activeNotes[agent.id] : agent.note;
          return (
            <div
              key={agent.id}
              style={{
                backgroundColor: '#111827',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Agent info and buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50px', backgroundColor: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <User size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '700', color: 'white' }}>{agent.name}</h3>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{agent.role}</span>
                  </div>
                </div>

                {/* Audit Buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleStatusChange(agent.id, 'present')}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid ' + (agent.status === 'present' ? '#10b981' : '#1f2937'),
                      backgroundColor: agent.status === 'present' ? 'rgba(16, 185, 129, 0.15)' : '#1f2937',
                      color: agent.status === 'present' ? '#10b981' : '#94a3b8',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CheckCircle2 size={16} /> Présent
                  </button>
                  <button
                    onClick={() => handleStatusChange(agent.id, 'absent')}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid ' + (agent.status === 'absent' ? '#ef4444' : '#1f2937'),
                      backgroundColor: agent.status === 'absent' ? 'rgba(239, 68, 68, 0.15)' : '#1f2937',
                      color: agent.status === 'absent' ? '#ef4444' : '#94a3b8',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <XCircle size={16} /> Absent
                  </button>
                  <button
                    onClick={() => handleStatusChange(agent.id, 'anomalie')}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid ' + (agent.status === 'anomalie' ? '#f59e0b' : '#1f2937'),
                      backgroundColor: agent.status === 'anomalie' ? 'rgba(245, 158, 11, 0.15)' : '#1f2937',
                      color: agent.status === 'anomalie' ? '#f59e0b' : '#94a3b8',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <AlertTriangle size={16} /> Anomalie
                  </button>
                </div>
              </div>

              {/* Note Section */}
              <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <MessageSquare size={18} color="#94a3b8" />
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => handleNoteChange(agent.id, e.target.value)}
                  placeholder="Ajouter un constat d'anomalie ou observation terrain..."
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                />
                {(noteText !== agent.note) && (
                  <button
                    onClick={() => saveAgentNote(agent.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#6366f1',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    <Save size={14} /> Enregistrer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Save Notification */}
      {showNotification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: '700',
          fontSize: '0.9rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1000
        }}>
          <CheckCircle2 size={18} />
          Note enregistrée avec succès !
        </div>
      )}
    </div>
  );
}
