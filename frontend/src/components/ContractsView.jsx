import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api';
import {
  Briefcase, Plus, Trash2, Search, X, CheckCircle,
  AlertTriangle, Clock, FileText, ChevronDown, Eye
} from 'lucide-react';

const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Intérim', 'Prestation', 'Apprentissage'];

const STATUS_CONFIG = {
  active:    { label: 'Actif',     color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
  expired:   { label: 'Expiré',    color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  suspended: { label: 'Suspendu',  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  terminated:{ label: 'Résilié',   color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const fmtSalary = (s) => s ? Number(s).toLocaleString('fr-FR') + ' FCFA' : '—';

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  return diff;
};

// Combobox Agent
function AgentCombobox({ agents, value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = agents.find(a => a.id === value);

  useEffect(() => { if (selected) setQuery(selected.name); }, [value]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    (a.matricule || '').toLowerCase().includes(query.toLowerCase())
  );

  const inpStyle = { width: '100%', padding: '11px 14px 11px 38px', borderRadius: '8px', border: `1px solid ${open ? '#3b82f6' : 'var(--border-color)'}`, background: 'rgba(255,255,255,0.04)', color: 'var(--text-color)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none', zIndex: 1 }} />
      <input type="text" placeholder="Nom ou matricule de l'agent..." value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(''); }}
        onFocus={() => setOpen(true)} style={inpStyle} />
      {query && <button onClick={() => { setQuery(''); onChange(''); }} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><X size={14} /></button>}
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: '#1e293b', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', marginTop: '4px', maxHeight: '180px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center' }}>Aucun agent trouvé</div>
          ) : filtered.map(a => (
            <div key={a.id} onClick={() => { onChange(a.id); setQuery(a.name); setOpen(false); }}
              style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontWeight: 600 }}>{a.name}</span>
              {a.matricule && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>#{a.matricule}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContractsView() {
  const [contracts, setContracts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState(null);

  const emptyForm = { agent_id: '', contract_type: 'CDI', start_date: '', end_date: '', trial_end_date: '', salary: '', position: '', department: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([
        apiCall('get_contracts', { status: filter }, 'GET'),
        apiCall('get_agents_for_admin', {}, 'GET'),
      ]);
      if (cRes.success) setContracts(cRes.contracts || []);
      if (aRes.success) setAgents(aRes.agents || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.agent_id || !form.start_date) {
      setMsg({ text: 'Agent et date de début requis.', type: 'error' }); return;
    }
    try {
      const res = await apiCall('add_contract', form, 'POST');
      if (res.success) {
        setMsg({ text: 'Contrat créé avec succès !', type: 'success' });
        setShowModal(false); setForm(emptyForm); fetchData();
      } else { setMsg({ text: res.message, type: 'error' }); }
    } catch { setMsg({ text: 'Erreur réseau', type: 'error' }); }
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const updateStatus = async (id, status) => {
    await apiCall('update_contract_status', { id, status }, 'POST');
    fetchData();
  };

  const deleteContract = async (id) => {
    if (!confirm('Supprimer ce contrat définitivement ?')) return;
    await apiCall('delete_contract', { id }, 'POST');
    fetchData();
  };

  const filtered = contracts.filter(c =>
    !search ||
    (c.agent_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.matricule || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.position || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    expiring: contracts.filter(c => { const d = daysUntil(c.end_date); return d !== null && d >= 0 && d <= 30; }).length,
    expired: contracts.filter(c => c.status === 'expired' || (c.end_date && daysUntil(c.end_date) < 0)).length,
  };

  const inp = { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-color)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' };
  const detailContract = contracts.find(c => c.id === detailId);

  return (
    <div style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(244,63,94,0.15)', borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={26} color="#f43f5e" />
          </div>
          Gestion des Contrats
        </h1>
        <button onClick={() => setShowModal(true)}
          style={{ padding: '12px 22px', background: 'linear-gradient(135deg, #f43f5e, #e11d48)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(244,63,94,0.3)' }}>
          <Plus size={18} /> Nouveau Contrat
        </button>
      </div>

      {msg.text && (
        <div style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontWeight: 600, background: msg.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', color: msg.type === 'success' ? '#34d399' : '#ef4444', border: `1px solid ${msg.type === 'success' ? '#34d399' : '#ef4444'}` }}>
          {msg.text}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total contrats', value: stats.total, color: '#3b82f6', icon: FileText },
          { label: 'Actifs', value: stats.active, color: '#34d399', icon: CheckCircle },
          { label: 'Expirent < 30j', value: stats.expiring, color: '#fbbf24', icon: Clock },
          { label: 'Expirés', value: stats.expired, color: '#f87171', icon: AlertTriangle },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}25`, borderRadius: '12px', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '3px' }}>{s.label}</div>
            </div>
            <s.icon size={28} color={s.color} style={{ opacity: 0.5 }} />
          </div>
        ))}
      </div>

      {/* Filtres + Recherche */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px' }}>
          {[['all','Tous'],['active','Actifs'],['expired','Expirés'],['suspended','Suspendus'],['terminated','Résiliés']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', background: filter === v ? '#f43f5e' : 'transparent', color: filter === v ? 'white' : 'var(--muted)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
              {l}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Rechercher agent, poste..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inp, width: '260px', paddingLeft: '14px' }} />
      </div>

      {/* Tableau */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
              {['Agent', 'Type', 'Poste', 'Début', 'Fin', 'Salaire', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '50px', textAlign: 'center', color: 'var(--muted)' }}>
                <Briefcase size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
                Aucun contrat trouvé.
              </td></tr>
            ) : filtered.map(c => {
              const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.active;
              const daysLeft = daysUntil(c.end_date);
              const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

              return (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700 }}>{c.agent_name || '—'}</div>
                    {c.matricule && <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>#{c.matricule}</div>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', padding: '4px 10px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700 }}>{c.contract_type}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>{c.position || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.88rem' }}>{fmtDate(c.start_date)}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.88rem' }}>
                    <div style={{ color: isExpiringSoon ? '#fbbf24' : 'inherit' }}>
                      {c.end_date ? fmtDate(c.end_date) : <span style={{ color: 'var(--muted)' }}>Indéterminée</span>}
                    </div>
                    {isExpiringSoon && <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>⚠ Expire dans {daysLeft}j</div>}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#34d399', fontSize: '0.9rem' }}>{fmtSalary(c.salary)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: st.bg, color: st.color, padding: '5px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700 }}>{st.label}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setDetailId(c.id === detailId ? null : c.id)} title="Détails"
                        style={{ padding: '7px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', borderRadius: '7px', cursor: 'pointer', display: 'flex' }}>
                        <Eye size={15} />
                      </button>
                      {c.status === 'active' && (
                        <button onClick={() => updateStatus(c.id, 'suspended')} title="Suspendre"
                          style={{ padding: '7px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', borderRadius: '7px', cursor: 'pointer', display: 'flex' }}>
                          <AlertTriangle size={15} />
                        </button>
                      )}
                      {(c.status === 'suspended') && (
                        <button onClick={() => updateStatus(c.id, 'active')} title="Réactiver"
                          style={{ padding: '7px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', borderRadius: '7px', cursor: 'pointer', display: 'flex' }}>
                          <CheckCircle size={15} />
                        </button>
                      )}
                      <button onClick={() => deleteContract(c.id)} title="Supprimer"
                        style={{ padding: '7px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '7px', cursor: 'pointer', display: 'flex' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Panneau de détail */}
      {detailContract && (
        <div style={{ marginTop: '20px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} color="#60a5fa" /> Détails — {detailContract.agent_name}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              ['Type', detailContract.contract_type],
              ['Poste', detailContract.position || '—'],
              ['Service', detailContract.department || '—'],
              ['Salaire', fmtSalary(detailContract.salary)],
              ['Début', fmtDate(detailContract.start_date)],
              ['Fin', fmtDate(detailContract.end_date)],
              ['Fin période d\'essai', fmtDate(detailContract.trial_end_date)],
              ['Créé par', detailContract.created_by || 'Admin'],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
          {detailContract.notes && (
            <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--text-color)' }}>Notes : </strong>{detailContract.notes}
            </div>
          )}
        </div>
      )}

      {/* MODAL NOUVEAU CONTRAT */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '600px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Briefcase size={22} color="#f43f5e" /> Nouveau Contrat
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Agent *</label>
                <AgentCombobox agents={agents} value={form.agent_id} onChange={id => setForm({ ...form, agent_id: id })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Type de contrat *</label>
                  <select value={form.contract_type} onChange={e => setForm({ ...form, contract_type: e.target.value })} style={inp}>
                    {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Poste / Fonction</label>
                  <input type="text" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="Ex: Agent de sécurité" style={inp} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Service / Département</label>
                <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Ex: Sécurité, Gardiennage..." style={inp} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Date de début *</label>
                  <input type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Date de fin <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(vide = CDI)</span></label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inp} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Fin période d'essai</label>
                  <input type="date" value={form.trial_end_date} onChange={e => setForm({ ...form, trial_end_date: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Salaire de base (FCFA)</label>
                  <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="Ex: 150000" style={inp} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Notes / Observations</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Informations complémentaires..." style={{ ...inp, resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.05)', color: 'var(--muted)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                  Annuler
                </button>
                <button type="submit" style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg, #f43f5e, #e11d48)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                  Créer le Contrat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
