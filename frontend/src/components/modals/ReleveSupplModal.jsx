import React, { useState, useEffect } from 'react';
import { apiCall } from '../../api';

export default function ReleveSupplModal({ data, sites, period, onClose, onSubmit }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState(data.replacedAgentId || '');
  const [motif, setMotif] = useState(data.motif || '');

  useEffect(() => {
    async function fetchAgents() {
      if (!data.destSite) return;
      const destSiteObj = sites.find(s => s.name === data.destSite);
      if (!destSiteObj) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiCall('get_site_data', { site_id: destSiteObj.id, period }, 'GET');
        if (Array.isArray(res)) {
          let loadedAgents = [];
          res.forEach(sub => {
            if (sub.agents) loadedAgents = loadedAgents.concat(sub.agents);
          });
          setAgents(loadedAgents.filter(a => !a.is_releve && !a.is_extra));
        }
      } catch (e) {
        console.error("Erreur de chargement des agents du site", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, [data.destSite, sites, period]);

  const handleSubmit = () => {
    onSubmit(selectedAgentId, motif);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)' }}
    >
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '16px', maxWidth: '450px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(59,130,246,0.3)' }}
      >
        <h3 style={{ margin: '0 0 1rem 0', color: '#60a5fa', fontSize: '1.3rem' }}>Détails de la Relève Supplémentaire</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Site de destination : <strong style={{ color: 'white' }}>{data.destSite}</strong>
        </p>

        {loading ? (
          <p style={{ color: 'white' }}>Chargement des agents titulaires...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '0.9rem' }}>À la place de qui ?</label>
              <select 
                value={selectedAgentId} 
                onChange={e => setSelectedAgentId(e.target.value)} 
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: 'white' }}
              >
                <option value="">Sélectionnez un titulaire (optionnel)</option>
                {agents.map(ag => (
                  <option key={ag.id} value={ag.id}>{ag.name} ({ag.function})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '0.9rem' }}>Motif (facultatif)</label>
              <input 
                type="text" 
                value={motif} 
                onChange={e => setMotif(e.target.value)} 
                placeholder="Ex: Remplacement maladie"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: 'white' }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSubmit} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}
