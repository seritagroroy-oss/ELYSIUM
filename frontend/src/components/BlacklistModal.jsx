import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { X, Search, ShieldAlert, ShieldCheck, MapPinOff, Calendar } from 'lucide-react';
import './lost-site-card.css';

const BlacklistModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('agents'); // 'agents' or 'sites'
  const [agents, setAgents] = useState([]);
  const [lostSites, setLostSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'agents') {
        const res = await apiCall('get_archived_agents');
        if (res && res.success) {
          setAgents(res.agents || []);
        }
      } else {
        const res = await apiCall('get_lost_sites');
        if (res && res.success) {
          setLostSites(res.lost_sites || []);
        }
      }
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const toggleBlacklist = async (agentId, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      const res = await apiCall('toggle_blacklist', { agent_id: agentId, is_blacklisted: newStatus });
      if (res && res.success) {
        setAgents(agents.map(a => a.id === agentId ? { ...a, is_blacklisted: newStatus } : a));
      }
    } catch (e) {
      console.error("Failed to toggle blacklist status:", e);
      alert("Erreur lors de la modification du statut.");
    }
  };

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredSites = lostSites.filter(s => {
    const siteName = s.site_name || '';
    const subsiteName = s.name || '';
    return siteName.toLowerCase().includes(searchTerm.toLowerCase()) || subsiteName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '98%', maxWidth: '1600px', height: '96vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button 
              onClick={() => setActiveTab('agents')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'agents' ? '#ef4444' : 'rgba(255,255,255,0.5)',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: activeTab === 'agents' ? '2px solid #ef4444' : '2px solid transparent',
                paddingBottom: '4px',
                transition: 'all 0.2s'
              }}
            >
              <ShieldAlert size={24} /> Annuaire des Anciens / Liste Noire
            </button>
            <button 
              onClick={() => setActiveTab('sites')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'sites' ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: activeTab === 'sites' ? '2px solid #f59e0b' : '2px solid transparent',
                paddingBottom: '4px',
                transition: 'all 0.2s'
              }}
            >
              <MapPinOff size={24} /> Sites Perdus
            </button>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            className="form-input"
            placeholder={activeTab === 'agents' ? "Rechercher un agent par nom..." : "Rechercher un site par nom..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '45px' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Chargement...</div>
          ) : activeTab === 'agents' ? (
            filteredAgents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Aucun agent trouvé.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredAgents.map(agent => (
                  <div key={agent.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: agent.is_blacklisted === 1 ? '#ef4444' : '#fff' }}>{agent.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                        Fonction: {agent.function || 'N/A'} • Sortie le {agent.exit_date ? new Date(agent.exit_date).toLocaleDateString('fr-FR') : 'N/A'} • Motif: {agent.exit_reason?.replace('SORTANT_', '') || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'rgba(99,179,237,0.8)', marginTop: '3px' }}>
                        📍 {agent.site_name
                          ? (agent.subsite_name && agent.subsite_name !== agent.site_name
                              ? `${agent.site_name} › ${agent.subsite_name}`
                              : agent.site_name)
                          : 'Site non renseigné'}
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleBlacklist(agent.id, agent.is_blacklisted)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        background: agent.is_blacklisted === 1 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: agent.is_blacklisted === 1 ? '#ef4444' : '#10b981',
                        transition: 'all 0.2s'
                      }}
                    >
                      {agent.is_blacklisted === 1 ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                      {agent.is_blacklisted === 1 ? 'Blacklisté' : 'Autorisé'}
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredSites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Aucun site perdu trouvé.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' }}>
                {filteredSites.map(site => (
                  <div key={site.id} className="lost-site-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px', borderRadius: '10px', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPinOff size={20} /> {site.site_name} - {site.name}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Calendar size={16} color="var(--muted)" /> 
                      Fin de contrat: {site.contract_end_date ? new Date(site.contract_end_date).toLocaleDateString('fr-FR') : 'Non définie'}
                    </div>
                    {site.contract_end_motif && (
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', marginTop: '5px' }}>
                        <strong>Motif: </strong>
                        {site.contract_end_motif}
                      </div>
                    )}
                    {site.lost_agents_summary && site.lost_agents_summary.length > 0 && (
                      <div style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '8px', padding: '10px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', border: '1px dashed rgba(239, 68, 68, 0.3)' }}>
                        <strong>Agents perdus: </strong>
                        <div style={{ marginTop: '4px', marginLeft: '8px' }}>
                          {site.lost_agents_summary.map((line, idx) => (
                            <div key={idx} style={{ marginBottom: '2px' }}>{line}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BlacklistModal;
