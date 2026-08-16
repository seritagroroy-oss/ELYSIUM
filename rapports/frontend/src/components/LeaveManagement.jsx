import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { Calendar, CheckCircle, XCircle, Clock, Settings, FileText, Download } from 'lucide-react';

export default function LeaveManagement() {
  const [activeTab, setActiveTab] = useState('workflow'); // workflow, balances, planning, settings
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settings, setSettings] = useState({ auto_increment: 0, increment_rate: 2.0 });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  
  // Nouveau Congé Manuel
  const [showAddModal, setShowAddModal] = useState(false);
  const [agents, setAgents] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [addForm, setAddForm] = useState({ agent_id: '', leave_type_id: '', start_date: '', end_date: '', reason: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Charger les agents et les types de congés une seule fois
      if (agents.length === 0) {
        const agRes = await apiCall('get_all_agents', {}, 'GET');
        if (agRes.success) setAgents(agRes.agents || []);
        
        const typRes = await apiCall('get_leave_types', {}, 'GET');
        if (typRes.success) setLeaveTypes(typRes.leave_types || []);
      }

      if (activeTab === 'workflow' || activeTab === 'planning') {
        const res = await apiCall('get_leave_requests', {}, 'GET');
        if (res.success) setRequests(res.requests);
      } else if (activeTab === 'balances') {
        const res = await apiCall('get_all_leave_balances', {}, 'GET');
        if (res.success) setBalances(res.balances);
      } else if (activeTab === 'settings') {
        const res = await apiCall('get_leave_settings', {}, 'GET');
        if (res.success) setSettings(res.settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!addForm.agent_id || !addForm.leave_type_id || !addForm.start_date || !addForm.end_date) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    try {
      const res = await apiCall('admin_add_leave_request', addForm, 'POST');
      if (res.success) {
        setMsg('Congé ajouté et validé avec succès.');
        setShowAddModal(false);
        setAddForm({ agent_id: '', leave_type_id: '', start_date: '', end_date: '', reason: '' });
        setTimeout(() => setMsg(''), 3000);
        fetchData();
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const processRequest = async (id, status) => {
    let comment = '';
    if (status === 'rejected') {
      comment = prompt('Motif du refus :');
      if (comment === null) return;
    }
    try {
      const res = await apiCall('process_leave_request', { request_id: id, status, comment }, 'POST');
      if (res.success) {
        setMsg('Demande traitée avec succès.');
        setTimeout(() => setMsg(''), 3000);
        fetchData();
      } else {
        alert(res.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveSettings = async () => {
    try {
      const res = await apiCall('update_leave_settings', settings, 'POST');
      if (res.success) {
        setMsg('Paramètres enregistrés.');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper for Gantt Chart dates (current month)
  const getDaysInMonth = () => {
    const d = new Date();
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const currentYearMonth = new Date().toISOString().substring(0, 8); // "YYYY-MM-"
  const daysInMonth = getDaysInMonth();

  const isDayInLeave = (agentId, day) => {
    const dayStr = currentYearMonth + String(day).padStart(2, '0');
    // Find approved request covering this day
    return requests.some(r => {
      return r.agent_id === agentId && r.status === 'approved' && dayStr >= r.start_date && dayStr <= r.end_date;
    });
  };

  return (
    <div style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={28} color="var(--primary)" /> Gestion des Congés
        </h1>
        <button 
          onClick={() => setShowAddModal(true)} 
          style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          + Saisir un congé
        </button>
      </div>

      {msg && (
        <div style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        {[
          { id: 'workflow', label: 'À valider', icon: Clock },
          { id: 'balances', label: 'Soldes', icon: FileText },
          { id: 'planning', label: 'Planning (Gantt)', icon: Calendar },
          { id: 'settings', label: 'Paramètres', icon: Settings },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              background: activeTab === t.id ? 'var(--primary)' : 'transparent',
              color: activeTab === t.id ? 'white' : 'var(--muted)',
              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>

      {/* WORKFLOW VIEW */}
      {activeTab === 'workflow' && (
        <div>
          <h3>Demandes en attente</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.9rem' }}>Agent</th>
                <th style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.9rem' }}>Type</th>
                <th style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.9rem' }}>Période</th>
                <th style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.9rem' }}>Justificatif</th>
                <th style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.9rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.filter(r => r.status === 'pending').map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{r.agent_name}</td>
                  <td style={{ padding: '12px' }}>{r.type_name}</td>
                  <td style={{ padding: '12px' }}>{r.start_date} au {r.end_date} <br/><span style={{ fontSize:'0.8rem', color:'var(--muted)'}}>({r.total_days} jours)</span></td>
                  <td style={{ padding: '12px' }}>
                    {r.attachment_url ? (
                      <a href={`http://localhost:8000${r.attachment_url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Download size={16} /> Voir la pièce
                      </a>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => processRequest(r.id, 'approved')} style={{ padding: '8px 12px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid #34d399', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                      <CheckCircle size={16} /> Valider
                    </button>
                    <button onClick={() => processRequest(r.id, 'rejected')} style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                      <XCircle size={16} /> Refuser
                    </button>
                  </td>
                </tr>
              ))}
              {requests.filter(r => r.status === 'pending').length === 0 && (
                <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Aucune demande en attente.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* BALANCES VIEW */}
      {activeTab === 'balances' && (
        <div>
          <h3>Soldes des Agents ({new Date().getFullYear()})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.9rem' }}>Agent</th>
                <th style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.9rem' }}>Acquis</th>
                <th style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.9rem' }}>Pris</th>
                <th style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.9rem' }}>En Cours</th>
                <th style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.9rem' }}>Disponible</th>
              </tr>
            </thead>
            <tbody>
              {balances.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{b.agent_name}</td>
                  <td style={{ padding: '12px', color: '#38bdf8', fontWeight: 700 }}>{b.acquired}</td>
                  <td style={{ padding: '12px' }}>{b.taken}</td>
                  <td style={{ padding: '12px', color: '#fbbf24' }}>{b.pending}</td>
                  <td style={{ padding: '12px', color: '#34d399', fontWeight: 800 }}>{(b.acquired - b.taken).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PLANNING / GANTT VIEW */}
      {activeTab === 'planning' && (
        <div>
          <h3>Planning d'Équipe - Mois en cours</h3>
          <div style={{ overflowX: 'auto', marginTop: '20px', background: 'var(--bg-card)', padding: '20px', borderRadius: '12px' }}>
            <table style={{ borderCollapse: 'collapse', width: 'max-content' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', minWidth: '150px', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Agent</th>
                  {daysInMonth.map(d => (
                    <th key={d} style={{ padding: '10px 5px', width: '30px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted)', borderBottom: '2px solid var(--border-color)' }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Obtenir la liste unique des agents ayant des requêtes (ou idéalement de tous les agents) */}
                {[...new Set(requests.map(r => r.agent_id))].map(agentId => {
                  const agentName = requests.find(r => r.agent_id === agentId)?.agent_name;
                  return (
                    <tr key={agentId}>
                      <td style={{ padding: '10px', fontWeight: 600, borderRight: '1px solid var(--border-color)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{agentName}</td>
                      {daysInMonth.map(d => {
                        const inLeave = isDayInLeave(agentId, d);
                        return (
                          <td key={d} style={{ 
                            padding: '2px', borderBottom: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.02)',
                            background: inLeave ? 'linear-gradient(45deg, #a855f7, #ec4899)' : 'transparent'
                          }}>
                            {inLeave && <div style={{ height: '20px', borderRadius: '4px' }}></div>}
                          </td>
                        );
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTINGS VIEW */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '500px', background: 'var(--bg-card)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Paramètres d'Acquisition</h3>
          
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              id="autoInc" 
              checked={settings.auto_increment === 1}
              onChange={e => setSettings({...settings, auto_increment: e.target.checked ? 1 : 0})}
              style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
            />
            <label htmlFor="autoInc" style={{ fontWeight: 600, cursor: 'pointer' }}>Activer l'incrémentation mensuelle automatique</label>
          </div>
          
          {settings.auto_increment === 1 && (
            <div style={{ marginBottom: '20px', paddingLeft: '30px' }}>
              <label style={{ display: 'block', color: 'var(--muted)', marginBottom: '8px', fontSize: '0.9rem' }}>Taux mensuel (Jours Acquis / Mois)</label>
              <input 
                type="number" 
                step="0.5"
                value={settings.increment_rate}
                onChange={e => setSettings({...settings, increment_rate: parseFloat(e.target.value)})}
                style={{ 
                  width: '100px', padding: '10px', borderRadius: '8px', 
                  border: '1px solid var(--border-color)', background: 'var(--bg-body)', 
                  color: 'white', fontSize: '1rem', outline: 'none' 
                }} 
              />
            </div>
          )}

          <button onClick={saveSettings} style={{ padding: '12px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
            Enregistrer les paramètres
          </button>
        </div>
      )}

      {/* MODAL AJOUT MANUEL */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '500px', border: '1px solid var(--border-color)', position: 'relative' }}>
            <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><XCircle size={24} /></button>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Saisir un congé manuel</h2>
            
            <form onSubmit={handleManualAdd}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--muted)', fontSize: '0.9rem' }}>Agent</label>
                <select required value={addForm.agent_id} onChange={e => setAddForm({...addForm, agent_id: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-color)' }}>
                  <option value="">Sélectionner un agent...</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--muted)', fontSize: '0.9rem' }}>Type de congé</label>
                <select required value={addForm.leave_type_id} onChange={e => setAddForm({...addForm, leave_type_id: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-color)' }}>
                  <option value="">Sélectionner un type...</option>
                  {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--muted)', fontSize: '0.9rem' }}>Date de début</label>
                  <input required type="date" value={addForm.start_date} onChange={e => setAddForm({...addForm, start_date: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-color)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--muted)', fontSize: '0.9rem' }}>Date de fin</label>
                  <input required type="date" value={addForm.end_date} onChange={e => setAddForm({...addForm, end_date: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-color)' }} />
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--muted)', fontSize: '0.9rem' }}>Motif (Optionnel)</label>
                <textarea value={addForm.reason} onChange={e => setAddForm({...addForm, reason: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-color)', resize: 'none', height: '80px' }}></textarea>
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '1.05rem' }}>
                Enregistrer et Valider
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
