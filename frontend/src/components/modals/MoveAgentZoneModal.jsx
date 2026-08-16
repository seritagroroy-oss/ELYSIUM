import React, { useState } from 'react';
import { apiCall } from '../../api';

export default function MoveAgentZoneModal({ isOpen, onClose, agent, siteId, subsites, onSuccess, onZoneCreated }) {
  const isFromHeader = agent?.from_header;
  const allAgents = subsites.flatMap(sub => sub.agents || []);
  
  const [selectedAgentId, setSelectedAgentId] = useState(isFromHeader ? '' : agent.id);
  const [targetSubsiteId, setTargetSubsiteId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [extraSubsites, setExtraSubsites] = useState([]);
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen || !agent) return null;

  const currentAgent = isFromHeader ? allAgents.find(a => String(a.id) === String(selectedAgentId)) : agent;
  const currentSubsiteId = currentAgent ? currentAgent.subsite_id : agent.subsite_id;

  // Filter out the agent's current subsite
  const availableSubsites = [...subsites, ...extraSubsites].filter(sub => sub.id !== currentSubsiteId);

  const handleCreateZone = async () => {
    if (!newZoneName.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const response = await apiCall('add_subsite', { site_id: siteId, name: newZoneName.trim() });
      if (response.success) {
        setExtraSubsites([...extraSubsites, { id: response.id, name: response.name }]);
        setTargetSubsiteId(response.id);
        setIsCreatingZone(false);
        setNewZoneName('');
        if (onZoneCreated) onZoneCreated();
      } else {
        setError(response.message || response.error || "Erreur lors de la création de la zone.");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgentId) {
      setError("Veuillez sélectionner un agent.");
      return;
    }
    if (!targetSubsiteId) {
      setError("Veuillez sélectionner une zone de destination.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiCall('move_agent_zone', {
        agent_id: selectedAgentId,
        new_subsite_id: targetSubsiteId
      });

      if (response.success) {
        onSuccess();
      } else {
        setError(response.error || "Une erreur est survenue lors du déplacement.");
      }
    } catch (err) {
      console.error("Erreur lors du déplacement de l'agent:", err);
      setError("Erreur de connexion au serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', zIndex: 1, background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.7)', overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '500px', animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🔄</span> Changer la zone
          </h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }} onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div style={{ padding: '32px', overflowY: 'auto', maxHeight: '70vh' }}>
          {!isFromHeader && (
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.5' }}>
              Vous êtes sur le point de déplacer <strong>{agent.name}</strong> vers une autre zone.
            </p>
          )}

          <form onSubmit={handleSubmit}>
            {isFromHeader && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '8px', letterSpacing: '0.02em' }}>Agent à déplacer</label>
                <select
                  value={selectedAgentId}
                  onChange={e => setSelectedAgentId(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  required
                >
                  <option value="" disabled style={{ background: '#1e293b' }}>Sélectionnez un agent...</option>
                  {allAgents.map(a => (
                    <option key={a.id} value={a.id} style={{ background: '#1e293b' }}>
                      {a.name} ({a.function})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>Zone de destination</label>
                <button type="button" onClick={() => setIsCreatingZone(!isCreatingZone)} style={{ background: 'transparent', border: 'none', color: '#0ea5e9', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                  {isCreatingZone ? 'Annuler' : '+ Créer une zone'}
                </button>
              </div>

              {isCreatingZone ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={newZoneName} 
                    onChange={e => setNewZoneName(e.target.value)} 
                    placeholder="Nom de la nouvelle zone..."
                    style={{ flex: 1, padding: '14px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                    autoFocus
                  />
                  <button type="button" onClick={handleCreateZone} disabled={isCreating || !newZoneName.trim()} style={{ padding: '0 20px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>
                    {isCreating ? 'Création...' : 'Créer'}
                  </button>
                </div>
              ) : (
                <select
                  value={targetSubsiteId}
                  onChange={e => setTargetSubsiteId(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  required
                >
                  <option value="" disabled style={{ background: '#1e293b' }}>Sélectionnez une nouvelle zone...</option>
                  {availableSubsites.map(sub => (
                    <option key={sub.id} value={sub.id} style={{ background: '#1e293b' }}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button type="button" onClick={onClose} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                Annuler
              </button>
              <button type="submit" disabled={isSubmitting} style={{ padding: '12px 24px', background: isSubmitting ? 'rgba(14, 165, 233, 0.5)' : '#0ea5e9', color: 'white', border: 'none', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseOver={e => { if (!isSubmitting) e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseOut={e => { if (!isSubmitting) e.currentTarget.style.transform = 'translateY(0)'; }}>
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                    Déplacement...
                  </>
                ) : 'Déplacer l\'agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
