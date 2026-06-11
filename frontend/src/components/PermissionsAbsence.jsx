import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../api';
import { Clock, Plus, Trash2, Calendar, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

const REASONS = [
  'Mariage',
  'Naissance',
  'Décès (famille proche)',
  'Rendez-vous médical',
  'Convenance personnelle',
  'Urgence familiale',
  'Sortie anticipée autorisée',
  'Retard autorisé',
  'Autre',
];

const formatDateTime = (dt) => {
  if (!dt) return '-';
  const d = new Date(dt);
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (hours) => {
  if (!hours && hours !== 0) return '-';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = Math.round((hours % 24) * 10) / 10;
  return rem > 0 ? `${days}j ${rem}h` : `${days} jour${days > 1 ? 's' : ''}`;
};

// Composant Agent Autocomplete (input tapable avec dropdown)
function AgentCombobox({ agents, value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selectedAgent = agents.find(a => a.id === value);

  useEffect(() => {
    if (selectedAgent) setQuery(selectedAgent.name);
  }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    (a.matricule || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Taper le nom ou matricule..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(''); }}
          onFocus={() => setOpen(true)}
          style={{
            width: '100%', padding: '11px 36px 11px 36px', borderRadius: '8px',
            border: `1px solid ${open ? '#f59e0b' : 'var(--border-color)'}`,
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--text-color)', fontSize: '0.95rem', outline: 'none',
            boxSizing: 'border-box', transition: 'border 0.2s'
          }}
        />
        {query && (
          <button onClick={() => { setQuery(''); onChange(''); setOpen(false); }}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
            <X size={15} />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#1e293b', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '10px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
        }}>
          {filtered.map(a => (
            <div key={a.id}
              onClick={() => { onChange(a.id); setQuery(a.name); setOpen(false); }}
              style={{
                padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'background 0.1s', borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontWeight: 600 }}>{a.name}</span>
              {a.matricule && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>#{a.matricule}</span>}
            </div>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && query && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px', marginTop: '4px', color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center' }}>
          Aucun agent trouvé
        </div>
      )}
    </div>
  );
}

export default function PermissionsAbsence() {
  const [permissions, setPermissions] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const monthStr = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}`;
  const monthLabel = new Date(currentMonth.year, currentMonth.month - 1, 1)
    .toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  const [form, setForm] = useState({
    agent_id: '', reason: '', custom_reason: '',
    start_datetime: '', end_datetime: '',
  });

  useEffect(() => { fetchAll(); }, [currentMonth]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [permRes, agRes] = await Promise.all([
        apiCall('get_permissions', { month: monthStr }, 'GET'),
        apiCall('get_agents_for_admin', {}, 'GET'),
      ]);
      if (permRes.success) setPermissions(permRes.permissions || []);
      if (agRes.success) setAgents(agRes.agents || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const finalReason = form.reason === 'Autre' ? form.custom_reason : form.reason;
    if (!form.agent_id || !finalReason || !form.start_datetime || !form.end_datetime) {
      setMsg({ text: 'Veuillez remplir tous les champs.', type: 'error' }); return;
    }
    if (new Date(form.end_datetime) <= new Date(form.start_datetime)) {
      setMsg({ text: 'La date de fin doit être après la date de début.', type: 'error' }); return;
    }
    try {
      const res = await apiCall('add_permission', { ...form, reason: finalReason }, 'POST');
      if (res.success) {
        setMsg({ text: 'Permission enregistrée avec succès !', type: 'success' });
        setShowModal(false);
        setForm({ agent_id: '', reason: '', custom_reason: '', start_datetime: '', end_datetime: '' });
        fetchAll();
      } else {
        setMsg({ text: res.message || 'Erreur serveur', type: 'error' });
      }
    } catch (e) { setMsg({ text: 'Erreur réseau', type: 'error' }); }
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette permission ?')) return;
    try {
      const res = await apiCall('delete_permission', { id }, 'POST');
      if (res.success) {
        setMsg({ text: 'Permission supprimée.', type: 'success' });
        fetchAll();
        setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      }
    } catch (e) { console.error(e); }
  };

  const prevMonth = () => setCurrentMonth(prev => {
    const d = new Date(prev.year, prev.month - 2, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const nextMonth = () => setCurrentMonth(prev => {
    const d = new Date(prev.year, prev.month, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const filtered = permissions.filter(p =>
    !search || (p.agent_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.matricule || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.reason || '').toLowerCase().includes(search.toLowerCase())
  );

  const inpStyle = {
    width: '100%', padding: '11px 14px', borderRadius: '8px',
    border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-color)', fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(245,158,11,0.15)', borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={26} color="#f59e0b" />
          </div>
          Permissions d'Absence
        </h1>
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: '12px 22px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
        >
          <Plus size={18} /> Enregistrer une permission
        </button>
      </div>

      {msg.text && (
        <div style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontWeight: 600, fontSize: '0.95rem', background: msg.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', color: msg.type === 'success' ? '#34d399' : '#ef4444', border: `1px solid ${msg.type === 'success' ? '#34d399' : '#ef4444'}` }}>
          {msg.text}
        </div>
      )}

      {/* Navigation mois + recherche */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', textTransform: 'capitalize', minWidth: '160px', textAlign: 'center' }}>
            <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#f59e0b' }} />
            {monthLabel}
          </span>
          <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-color)', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={18} />
          </button>
        </div>
        <input type="text" placeholder="Rechercher un agent ou un motif..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inpStyle, width: '280px' }}
        />
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Permissions ce mois', value: permissions.length, color: '#f59e0b' },
          { label: 'Agents concernés', value: [...new Set(permissions.map(p => p.agent_id))].length, color: '#38bdf8' },
          { label: 'Durée totale', value: formatDuration(permissions.reduce((s, p) => s + parseFloat(p.duration_hours || 0), 0)), color: '#a855f7' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}30`, borderRadius: '12px', padding: '16px 24px', flex: '1', minWidth: '150px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
              {['Agent / Matricule', 'Motif', 'Début', 'Fin', 'Durée', 'Enregistré par', 'Action'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '50px', textAlign: 'center', color: 'var(--muted)' }}>
                <Clock size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
                Aucune permission enregistrée pour ce mois.
              </td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700 }}>{p.agent_name || '—'}</div>
                  {p.matricule && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>#{p.matricule}</div>}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                    {p.reason}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>{formatDateTime(p.start_datetime)}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>{formatDateTime(p.end_datetime)}</td>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#38bdf8' }}>{formatDuration(p.duration_hours)}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--muted)' }}>{p.recorded_by || 'Admin'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <button onClick={() => handleDelete(p.id)} title="Supprimer" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL AJOUT */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '36px', width: '90%', maxWidth: '520px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={22} color="#f59e0b" /> Nouvelle Permission d'Absence
            </h2>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Agent *</label>
                <AgentCombobox
                  agents={agents}
                  value={form.agent_id}
                  onChange={id => setForm({ ...form, agent_id: id })}
                />
                {!form.agent_id && <span style={{ fontSize: '0.75rem', color: 'rgba(245,158,11,0.7)', marginTop: '4px', display: 'block' }}>Tapez pour filtrer les agents</span>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Motif *</label>
                <select required value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} style={inpStyle}>
                  <option value="">Choisir un motif...</option>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {form.reason === 'Autre' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Préciser le motif *</label>
                  <input type="text" required value={form.custom_reason} onChange={e => setForm({ ...form, custom_reason: e.target.value })} placeholder="Ex: Démarches administratives..." style={inpStyle} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Date & heure de début *</label>
                  <input type="datetime-local" required value={form.start_datetime} onChange={e => setForm({ ...form, start_datetime: e.target.value })} style={inpStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--muted)', fontSize: '0.85rem', fontWeight: 600 }}>Date & heure de fin *</label>
                  <input type="datetime-local" required value={form.end_datetime} onChange={e => setForm({ ...form, end_datetime: e.target.value })} style={inpStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.05)', color: 'var(--muted)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                  Annuler
                </button>
                <button type="submit" style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                  Enregistrer la Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
