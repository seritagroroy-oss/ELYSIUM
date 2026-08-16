import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import { 
  Users, UserCheck, AlertTriangle, ShieldAlert, Activity, FileText, Upload, Plus, X, Calendar, Search, MapPin
} from 'lucide-react';

export default function PersonnelTrackingView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, agents
  const [agents, setAgents] = useState([]);
  const [alerts, setAlerts] = useState({ absences: [], sanctions: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Agent Dossier State
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [dossierTab, setDossierTab] = useState('sanctions'); // sanctions, absences, mutations
  const [dossierData, setDossierData] = useState({ sanctions: [], absences: [], mutations: [] });
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Forms
  const [showSanctionForm, setShowSanctionForm] = useState(false);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [showMutationForm, setShowMutationForm] = useState(false);

  const [sites, setSites] = useState([]);

  // Check roles flexibly
  const role = user?.role?.toLowerCase() || '';
  const isHR = role === 'admin' || role === 'super_admin' || user?.permissions?.rh || user?.workspace_type === 'RH' || user?.service === 'RH';

  useEffect(() => {
    fetchDashboard();
    fetchSites();
  }, []);

  const fetchSites = async () => {
    const res = await apiCall('get_sites', {}, 'GET');
    if (res && Array.isArray(res)) {
      setSites(res);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_personnel_tracking', {}, 'GET');
      if (res.success) {
        setAlerts({ absences: res.absences || [], sanctions: res.sanctions || [] });
        setAgents(res.agents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDossier = async (agentId) => {
    setLoadingDossier(true);
    try {
      const res = await apiCall('get_agent_dossier', { agent_id: agentId });
      if (res.success) {
        setDossierData({
          sanctions: res.sanctions || [],
          absences: res.absences || [],
          mutations: res.mutations || []
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDossier(false);
    }
  };

  const openDossier = (agent) => {
    setSelectedAgent(agent);
    fetchDossier(agent.id);
  };

  const handleAddSanction = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      agent_id: selectedAgent.id,
      type_sanction: fd.get('type_sanction'),
      motif: fd.get('motif'),
      date_sanction: fd.get('date_sanction'),
      date_fin_mise_a_pied: fd.get('date_fin_mise_a_pied') || null
    };
    const res = await apiCall('add_sanction', data);
    if (res.success) {
      setShowSanctionForm(false);
      fetchDossier(selectedAgent.id);
      fetchDashboard();
    } else {
      alert(res.message || "Erreur");
    }
  };

  const handleAddAbsence = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append('agent_id', selectedAgent.id);
    formData.append('action', 'add_long_absence');

    try {
      const res = await fetch('/api.php', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setShowAbsenceForm(false);
        fetchDossier(selectedAgent.id);
        fetchDashboard();
      } else {
        alert(data.message || "Erreur");
      }
    } catch(err) {
      alert("Erreur réseau");
    }
  };

  const handleAddMutation = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      agent_id: selectedAgent.id,
      nouveau_site_id: fd.get('nouveau_site_id'),
      date_mutation: fd.get('date_mutation'),
      motif: fd.get('motif')
    };
    const res = await apiCall('add_mutation', data);
    if (res.success) {
      setShowMutationForm(false);
      fetchDossier(selectedAgent.id);
      fetchDashboard();
    } else {
      alert(res.message || "Erreur");
    }
  };

  const filteredAgents = agents.filter(a => 
    (a.nom_prenom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.matricule || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto', color: '#f8fafc', animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
        <div style={{ 
          width: '60px', height: '60px', borderRadius: '16px', 
          background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 20px rgba(168, 85, 247, 0.3)'
        }}>
          <UserCheck size={32} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SUIVI DU PERSONNEL
          </h1>
          <p style={{ margin: '5px 0 0', color: '#94a3b8', fontSize: '1.1rem' }}>
            Pilotage des dossiers disciplinaires, absences prolongées et mutations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px' }}>
        <button 
          onClick={() => setActiveTab('dashboard')}
          style={{ 
            padding: '12px 24px', background: 'none', border: 'none', 
            borderBottom: activeTab === 'dashboard' ? '3px solid #3b82f6' : '3px solid transparent', 
            color: activeTab === 'dashboard' ? '#3b82f6' : '#94a3b8', 
            cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}
        >
          <Activity size={20} /> Tableau de Bord Global
        </button>
        <button 
          onClick={() => setActiveTab('agents')}
          style={{ 
            padding: '12px 24px', background: 'none', border: 'none', 
            borderBottom: activeTab === 'agents' ? '3px solid #3b82f6' : '3px solid transparent', 
            color: activeTab === 'agents' ? '#3b82f6' : '#94a3b8', 
            cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}
        >
          <Users size={20} /> Base Dossiers Agents
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Chargement des données du personnel...</div>
      ) : activeTab === 'dashboard' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
          
          {/* Absences Card */}
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', 
            padding: '25px', borderRadius: '20px', border: '1px solid rgba(234, 179, 8, 0.2)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: 0, fontSize: '1.4rem', color: '#fef08a' }}>
              <Activity size={28} color="#eab308" /> Absences Prolongées en cours
            </h3>
            <div style={{ width: '100%', height: '1px', background: 'rgba(234, 179, 8, 0.1)', margin: '15px 0' }} />
            
            {alerts.absences.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                Aucune absence prolongée signalée.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {alerts.absences.map(a => {
                  const agent = agents.find(ag => ag.id === a.agent_id);
                  return (
                    <div key={a.id} style={{ 
                      padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', 
                      borderLeft: '4px solid #eab308', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem', color: 'white' }}>{agent?.nom_prenom || 'Agent Inconnu'}</strong>
                        <div style={{ color: '#eab308', marginTop: '4px', fontWeight: '500' }}>{a.type_absence}</div>
                        <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '4px' }}>
                          Du {a.date_debut} au {a.date_fin_prevue || 'Indéterminé'}
                        </div>
                      </div>
                      {a.file_path && (
                        <a href={`/${a.file_path}`} target="_blank" rel="noopener noreferrer" 
                           style={{ padding: '8px 12px', background: 'rgba(234,179,8,0.1)', color: '#fef08a', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                          <FileText size={16} /> Justificatif
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sanctions Card */}
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', 
            padding: '25px', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: 0, fontSize: '1.4rem', color: '#fca5a5' }}>
              <ShieldAlert size={28} color="#ef4444" /> Sanctions Récentes (3 derniers mois)
            </h3>
            <div style={{ width: '100%', height: '1px', background: 'rgba(239, 68, 68, 0.1)', margin: '15px 0' }} />
            
            {alerts.sanctions.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                Aucune sanction récente enregistrée.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {alerts.sanctions.map(s => {
                  const agent = agents.find(ag => ag.id === s.agent_id);
                  return (
                    <div key={s.id} style={{ 
                      padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', 
                      borderLeft: '4px solid #ef4444'
                    }}>
                      <strong style={{ fontSize: '1.1rem', color: 'white' }}>{agent?.nom_prenom || 'Agent Inconnu'}</strong>
                      <div style={{ color: '#ef4444', marginTop: '4px', fontWeight: '500' }}>{s.type_sanction}</div>
                      <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '6px' }}>Sanctionné le {s.date_sanction}</div>
                      {s.date_fin_mise_a_pied && <div style={{ fontSize: '0.85rem', color: '#fca5a5', marginTop: '4px' }}>Fin de mise à pied: {s.date_fin_mise_a_pied}</div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.3s' }}>
          <div style={{ marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
              <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
              <input 
                type="text" 
                placeholder="Rechercher un agent (Nom ou Matricule)..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', padding: '14px 20px 14px 45px', 
                  background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px', color: 'white', fontSize: '1.05rem', outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredAgents.map(a => (
              <div 
                key={a.id} 
                onClick={() => openDossier(a)} 
                style={{ 
                  background: 'rgba(30, 41, 59, 0.7)', padding: '20px', borderRadius: '16px', 
                  border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', gap: '20px',
                  transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
              >
                <div style={{ 
                  width: '55px', height: '55px', borderRadius: '50%', 
                  background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59,130,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <Users size={26} color="#3b82f6" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'white' }}>{a.nom_prenom}</div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '4px' }}>Matricule: <span style={{ color: '#cbd5e1' }}>{a.matricule}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dossier Modal */}
      {selectedAgent && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1000, 
          display: 'flex', justifyContent: 'flex-end', animation: 'fadeIn 0.2s'
        }}>
          <div style={{ 
            width: '650px', background: '#0f172a', height: '100%', 
            overflowY: 'auto', padding: '0', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            borderLeft: '1px solid rgba(255,255,255,0.1)', animation: 'slideInRight 0.3s ease-out'
          }}>
            
            {/* Modal Header */}
            <div style={{ 
              padding: '30px', background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.1), transparent)',
              borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #3b82f6' }}>
                  <Users size={30} color="#3b82f6" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', color: 'white' }}>{selectedAgent.nom_prenom}</h2>
                  <div style={{ color: '#94a3b8', marginTop: '5px', fontSize: '1rem' }}>Matricule: {selectedAgent.matricule}</div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAgent(null)} 
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '30px' }}>
              
              {/* Modal Tabs */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '12px' }}>
                {[
                  { id: 'sanctions', icon: <ShieldAlert size={18}/>, label: 'Sanctions' },
                  { id: 'absences', icon: <Activity size={18}/>, label: 'Absences Pro.' },
                  { id: 'mutations', icon: <MapPin size={18}/>, label: 'Mutations' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setDossierTab(tab.id)}
                    style={{ 
                      flex: 1, padding: '12px', 
                      background: dossierTab === tab.id ? '#3b82f6' : 'transparent', 
                      color: dossierTab === tab.id ? 'white' : '#94a3b8', 
                      border: 'none', borderRadius: '8px', cursor: 'pointer', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      fontWeight: dossierTab === tab.id ? '600' : '500', transition: 'all 0.2s'
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {loadingDossier ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chargement du dossier...</div>
              ) : (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  
                  {/* SANCTIONS */}
                  {dossierTab === 'sanctions' && (
                    <div>
                      {isHR && (
                        <button 
                          onClick={() => setShowSanctionForm(!showSanctionForm)} 
                          style={{ marginBottom: '20px', padding: '12px 20px', background: showSanctionForm ? 'rgba(239,68,68,0.2)' : '#ef4444', color: showSanctionForm ? '#ef4444' : 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', transition: '0.2s', width: '100%', justifyContent: 'center' }}
                        >
                          {showSanctionForm ? <X size={18} /> : <Plus size={18} />} {showSanctionForm ? 'Annuler' : 'Enregistrer une Sanction'}
                        </button>
                      )}
                      
                      {showSanctionForm && (
                        <form onSubmit={handleAddSanction} style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Type de sanction</label>
                            <select name="type_sanction" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: 'white', outline: 'none' }}>
                              <option value="">Sélectionner...</option>
                              <option value="Avertissement">Avertissement</option>
                              <option value="Blâme">Blâme</option>
                              <option value="Mise à pied">Mise à pied</option>
                              <option value="Licenciement">Licenciement</option>
                            </select>
                          </div>
                          <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Motif</label>
                            <textarea name="motif" required rows="3" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: 'white', outline: 'none', resize: 'vertical' }}></textarea>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Date sanction</label>
                              <input type="date" name="date_sanction" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: 'white', outline: 'none' }} />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Fin mise à pied (opt.)</label>
                              <input type="date" name="date_fin_mise_a_pied" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: 'white', outline: 'none' }} />
                            </div>
                          </div>
                          <button type="submit" style={{ width: '100%', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Confirmer la Sanction</button>
                        </form>
                      )}
                      
                      {dossierData.sanctions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', color: '#94a3b8' }}>Aucune sanction au dossier.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          {dossierData.sanctions.map(s => (
                            <div key={s.id} style={{ background: 'rgba(15,23,42,0.8)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ef4444', borderTop: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 'bold', color: 'white', fontSize: '1.1rem' }}>{s.type_sanction}</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{s.date_sanction}</div>
                              </div>
                              <div style={{ marginTop: '10px', color: '#cbd5e1', lineHeight: '1.5' }}>{s.motif}</div>
                              {s.date_fin_mise_a_pied && <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderRadius: '6px', fontSize: '0.85rem', display: 'inline-block' }}>Mise à pied jusqu'au : {s.date_fin_mise_a_pied}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ABSENCES */}
                  {dossierTab === 'absences' && (
                    <div>
                      {isHR && (
                        <button 
                          onClick={() => setShowAbsenceForm(!showAbsenceForm)} 
                          style={{ marginBottom: '20px', padding: '12px 20px', background: showAbsenceForm ? 'rgba(234,179,8,0.2)' : '#eab308', color: showAbsenceForm ? '#eab308' : '#422006', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', transition: '0.2s', width: '100%', justifyContent: 'center' }}
                        >
                          {showAbsenceForm ? <X size={18} /> : <Plus size={18} />} {showAbsenceForm ? 'Annuler' : 'Déclarer une absence prolongée'}
                        </button>
                      )}
                      
                      {showAbsenceForm && (
                        <form onSubmit={handleAddAbsence} style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Type d'absence</label>
                            <select name="type_absence" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: 'white', outline: 'none' }}>
                              <option value="">Sélectionner...</option>
                              <option value="Maladie">Maladie</option>
                              <option value="Accident de travail">Accident de travail</option>
                              <option value="Maternité">Maternité</option>
                            </select>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Date début</label>
                              <input type="date" name="date_debut" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: 'white', outline: 'none' }} />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Date fin prévue</label>
                              <input type="date" name="date_fin_prevue" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: 'white', outline: 'none' }} />
                            </div>
                          </div>
                          <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Justificatif (PDF/Image)</label>
                            <input type="file" name="justificatif" accept=".pdf,image/*" style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.2)' }} />
                          </div>
                          <button type="submit" style={{ width: '100%', padding: '12px', background: '#eab308', color: '#422006', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Enregistrer l'absence</button>
                        </form>
                      )}
                      
                      {dossierData.absences.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', color: '#94a3b8' }}>Aucune absence prolongée.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          {dossierData.absences.map(a => (
                            <div key={a.id} style={{ background: 'rgba(15,23,42,0.8)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #eab308', borderTop: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ fontWeight: 'bold', color: '#fef08a', fontSize: '1.1rem' }}>{a.type_absence}</div>
                              <div style={{ marginTop: '8px', color: '#cbd5e1' }}>Période : <strong style={{ color: 'white' }}>{a.date_debut}</strong> ➔ <strong style={{ color: 'white' }}>{a.date_fin_prevue || '?'}</strong></div>
                              {a.file_path && (
                                <a href={`/${a.file_path}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '15px', color: '#eab308', textDecoration: 'none', padding: '8px 12px', background: 'rgba(234,179,8,0.1)', borderRadius: '6px', fontSize: '0.9rem' }}>
                                  <FileText size={16} /> Voir le justificatif fourni
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* MUTATIONS */}
                  {dossierTab === 'mutations' && (
                    <div>
                      {isHR && (
                        <button 
                          onClick={() => setShowMutationForm(!showMutationForm)} 
                          style={{ marginBottom: '20px', padding: '12px 20px', background: showMutationForm ? 'rgba(139,92,246,0.2)' : '#8b5cf6', color: showMutationForm ? '#8b5cf6' : 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', transition: '0.2s', width: '100%', justifyContent: 'center' }}
                        >
                          {showMutationForm ? <X size={18} /> : <Plus size={18} />} {showMutationForm ? 'Annuler' : 'Enregistrer une mutation'}
                        </button>
                      )}
                      
                      {showMutationForm && (
                        <form onSubmit={handleAddMutation} style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Nouveau Site d'affectation</label>
                            <select name="nouveau_site_id" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: 'white', outline: 'none' }}>
                              <option value="">Sélectionner...</option>
                              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </div>
                          <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Date d'effet (Immédiate)</label>
                            <input type="date" name="date_mutation" required defaultValue={new Date().toISOString().split('T')[0]} readOnly style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#94a3b8', outline: 'none' }} />
                          </div>
                          <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>Motif de la mutation</label>
                            <input type="text" name="motif" placeholder="Raison (ex: Demande agent, Restructuration)" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: 'white', outline: 'none' }} />
                          </div>
                          <button type="submit" style={{ width: '100%', padding: '12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Muter l'agent</button>
                        </form>
                      )}
                      
                      {dossierData.mutations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', color: '#94a3b8' }}>Aucune mutation historique.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          {dossierData.mutations.map(m => {
                            const s_old = sites.find(x => x.id === m.ancien_site_id)?.name || 'Inconnu';
                            const s_new = sites.find(x => x.id === m.nouveau_site_id)?.name || 'Inconnu';
                            return (
                              <div key={m.id} style={{ background: 'rgba(15,23,42,0.8)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #8b5cf6', borderTop: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontWeight: 'bold', color: 'white', fontSize: '1.1rem', marginBottom: '15px' }}>Mutation du {m.date_mutation}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                                  <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>ANCIEN SITE</div>
                                    <div style={{ fontWeight: '600', color: '#cbd5e1' }}>{s_old}</div>
                                  </div>
                                  <div style={{ color: '#8b5cf6' }}>➔</div>
                                  <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>NOUVEAU SITE</div>
                                    <div style={{ fontWeight: '600', color: 'white' }}>{s_new}</div>
                                  </div>
                                </div>
                                <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                  Motif : {m.motif}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
