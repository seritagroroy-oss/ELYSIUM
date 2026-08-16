import React, { useState } from 'react';

export default function DeployReleveModal({
  releveAgents,
  currentSiteAgents = [],
  onClose,
  onSubmit,
  defaultAgentId = '',
  defaultDate = ''
}) {
  const [deployReleveAgentId, setDeployReleveAgentId] = useState(defaultAgentId);
  const [deployReleveDate, setDeployReleveDate] = useState(defaultDate);
  const [searchReleveText, setSearchReleveText] = useState(() => {
    if (defaultAgentId) {
      const ag = releveAgents.find(a => a.id === defaultAgentId);
      return ag ? `${ag.name} (${ag.function})` : '';
    }
    return '';
  });
  const [showReleveDropdown, setShowReleveDropdown] = useState(false);
  const [deployReleveShift, setDeployReleveShift] = useState('AUTO');

  const [replacedAgentId, setReplacedAgentId] = useState('');
  const [replacedAgentStatus, setReplacedAgentStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!deployReleveAgentId) return;
    
    onSubmit({
      agentId: deployReleveAgentId,
      date: deployReleveDate,
      shift: deployReleveShift,
      replacedAgentId,
      replacedAgentStatus
    });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(5px)' }}>
      <div className="modal-content" style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%)', padding: '32px', borderRadius: '16px', width: '450px', border: '1px solid rgba(99, 102, 241, 0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: '20px' }}>
            👁
          </div>
          <h3 style={{ margin: 0, color: 'white', fontSize: '1.3rem' }}>Déployer une Relève</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Rechercher l'Agent Relève</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Tapez le nom de l'agent..."
              value={searchReleveText} 
              onChange={e => {
                setSearchReleveText(e.target.value);
                setShowReleveDropdown(true);
                if (e.target.value === '') setDeployReleveAgentId('');
              }}
              onFocus={() => setShowReleveDropdown(true)}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px', color: 'white', fontSize: '1rem' }}
              required={!deployReleveAgentId}
            />
            
            {showReleveDropdown && searchReleveText.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10 }}>
                {releveAgents.filter(ag => ag.name.toLowerCase().includes(searchReleveText.toLowerCase())).length === 0 ? (
                  <div style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textAlign: 'center' }}>Aucun agent trouvé</div>
                ) : (
                  releveAgents.filter(ag => ag.name.toLowerCase().includes(searchReleveText.toLowerCase())).map(ag => (
                    <div 
                      key={ag.id}
                      style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                         setDeployReleveAgentId(ag.id);
                        setSearchReleveText(`${ag.name} (${ag.function})`);
                        setShowReleveDropdown(false);
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
              value={deployReleveShift}
              onChange={e => setDeployReleveShift(e.target.value)}
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
              value={deployReleveDate} 
              onChange={e => setDeployReleveDate(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem', cursor: 'text' }}
            />
          </div>

          {/* Section Remplacement (Optionnel) */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#818cf8', fontSize: '1rem' }}>Remplacer un agent (Optionnel)</h4>
            
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Agent remplacé</label>
              <select
                className="form-input"
                value={replacedAgentId}
                onChange={e => setReplacedAgentId(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem' }}
              >
                <option value="">-- Aucun (Déploiement simple) --</option>
                {currentSiteAgents.map(ag => (
                  <option key={ag.id} value={ag.id}>{ag.name} ({ag.function})</option>
                ))}
              </select>
            </div>

            {replacedAgentId && (
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Appliquer un statut à l'agent remplacé</label>
                <select
                  className="form-input"
                  value={replacedAgentStatus}
                  onChange={e => setReplacedAgentStatus(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '1rem' }}
                >
                  <option value="">-- Ne rien appliquer (manuel) --</option>
                  <option value="A">Absence (A)</option>
                  <option value="MAP">Mise À Pied (MAP)</option>
                  <option value="CP">Congé Payé (CP)</option>
                  <option value="P">Permission (P)</option>
                  <option value="M">Maladie (M)</option>
                </select>
              </div>
            )}
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
