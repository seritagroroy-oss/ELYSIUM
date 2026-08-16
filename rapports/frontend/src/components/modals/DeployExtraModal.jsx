import React, { useState } from 'react';

export default function DeployExtraModal({
  extraAgents,
  onClose,
  onSubmit
}) {
  const [searchExtraText, setSearchExtraText] = useState('');
  const [showExtraDropdown, setShowExtraDropdown] = useState(false);
  const [deployExtraAgentId, setDeployExtraAgentId] = useState('');
  const [deployExtraDate, setDeployExtraDate] = useState('');
  const [deployExtraShift, setDeployExtraShift] = useState('AUTO');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!deployExtraAgentId) return;
    
    onSubmit({
      agentId: deployExtraAgentId,
      date: deployExtraDate,
      shift: deployExtraShift
    });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(5px)' }}>
      <div className="modal-content" style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%)', padding: '32px', borderRadius: '16px', width: '450px', border: '1px solid rgba(99, 102, 241, 0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: '20px' }}>
            👁
          </div>
          <h3 style={{ margin: 0, color: 'white', fontSize: '1.3rem' }}>Déployer un Extra</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Rechercher l'Agent Extra</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Tapez le nom de l'agent..."
              value={searchExtraText} 
              onChange={e => {
                setSearchExtraText(e.target.value);
                setShowExtraDropdown(true);
                if (e.target.value === '') setDeployExtraAgentId('');
              }}
              onFocus={() => setShowExtraDropdown(true)}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px', color: 'white', fontSize: '1rem' }}
              required={!deployExtraAgentId}
            />
            
            {showExtraDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10 }}>
                {extraAgents.filter(ag => ag.name.toLowerCase().includes(searchExtraText.toLowerCase())).length === 0 ? (
                  <div style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textAlign: 'center' }}>Aucun agent trouvé</div>
                ) : (
                  extraAgents.filter(ag => ag.name.toLowerCase().includes(searchExtraText.toLowerCase())).map(ag => (
                    <div 
                      key={ag.id}
                      style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                         setDeployExtraAgentId(ag.id);
                        setSearchExtraText(`${ag.name} (${ag.function})`);
                        setShowExtraDropdown(false);
                      }}
                    >
                      <div style={{ color: 'white', fontWeight: '500' }}>{ag.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{ag.function} • Vacation: {ag.shift_type}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Vacation / Shift</label>
            <select
              className="form-input"
              value={deployExtraShift}
              onChange={e => setDeployExtraShift(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: 'pointer' }}
            >
              <option value="AUTO">Automatique (Vacation de l'agent)</option>
              <option value="J">Jour (12h)</option>
              <option value="N">Nuit (12h)</option>
              <option value="24h">24 Heures</option>
              <option value="48h">48 Heures</option>
              <option value="72h">72 Heures</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>À partir du</label>
            <input 
              type="date" 
              className="form-input" 
              value={deployExtraDate} 
              onChange={e => setDeployExtraDate(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: 'text' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>Confirmer l'ajout</button>
          </div>
        </form>
      </div>
    </div>
  );
}
