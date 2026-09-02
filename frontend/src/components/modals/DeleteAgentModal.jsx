import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { apiCall } from '../../api';

export default function DeleteAgentModal({
  agent,
  onClose,
  onConfirm
}) {
  const [loading, setLoading] = useState(false);
  const [multiSites, setMultiSites] = useState([]);
  
  let isSpecial = false;
  try {
    const p = typeof agent.profile_data === 'string' ? JSON.parse(agent.profile_data) : agent.profile_data;
    isSpecial = p?.special_service && p.special_service !== "false" && p.special_service !== "0";
  } catch (e) {}

  useEffect(() => {
    if (isSpecial && agent?.name) {
      setLoading(true);
      apiCall('check_agent_multisite', { name: agent.name }).then(res => {
        if (res && res.success && res.sites && res.sites.length > 1) {
          setMultiSites(res.sites);
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [agent]);

  if (loading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '30px', color: 'white' }}>
          Vérification de l'agent...
        </div>
      </div>
    );
  }

  const isMulti = multiSites.length > 1;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: isMulti ? '500px' : '400px', textAlign: 'center', padding: '30px' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#ef4444' }}>
          <Trash2 size={32} />
        </div>
        <h3 style={{ marginBottom: '10px' }}>Supprimer l'agent {agent?.name ? agent.name : ''} ?</h3>
        
        {isMulti ? (
          <div style={{ marginBottom: '24px', textAlign: 'left', background: 'rgba(234, 179, 8, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <p style={{ color: '#eab308', fontWeight: 'bold', margin: '0 0 10px 0' }}>
              ⚠️ Cet agent à temps partiel est également présent sur d'autres sites :
            </p>
            <ul style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: '0 0 15px 0', paddingLeft: '20px' }}>
              {multiSites.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
              Souhaitez-vous le supprimer uniquement d'ici, ou de tous ses sites ?
            </p>
          </div>
        ) : (
          <p className="subtitle" style={{ marginBottom: '24px' }}>
            Cette action est définitive. L'agent ainsi que tout son historique de pointage seront effacés de la base de données.
          </p>
        )}

        {isMulti ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button type="button" className="btn btn-primary" onClick={() => onConfirm(false)} style={{ background: '#3b82f6', color: 'white', border: 'none' }}>Supprimer uniquement de ce site</button>
            <button type="button" className="btn btn-primary" onClick={() => onConfirm(true)} style={{ background: '#ef4444', color: 'white', border: 'none' }}>Supprimer de TOUS les sites</button>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ marginTop: '10px' }}>Annuler</button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
            <button type="button" className="btn btn-primary" onClick={() => onConfirm(false)} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none' }}>Supprimer</button>
          </div>
        )}
      </div>
    </div>
  );
}
