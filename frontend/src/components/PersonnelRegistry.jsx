import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiCall } from '../api';
import {
  Database, RefreshCw, Search, Users, UserCheck, UserX,
  AlertCircle, Shield, Edit3, Check, X as XIcon
} from 'lucide-react';

const STATUS_CONFIG = {
  active:    { label: 'Actif',        color: '#34d399', bg: 'rgba(52,211,153,0.12)',  dot: '#34d399' },
  unknown:   { label: 'Incertain',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  dot: '#fbbf24' },
  archived:  { label: 'Archivé',      color: '#f87171', bg: 'rgba(248,113,113,0.12)', dot: '#f87171' },
  abandoned: { label: 'Abandon',      color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   dot: '#f43f5e' },
};

const SOURCE_CONFIG = {
  agent: { label: 'Agent',        color: '#38bdf8', bg: 'rgba(56,189,248,0.1)'  },
  user:  { label: 'Admin / Ctrl', color: '#a855f7', bg: 'rgba(168,85,247,0.1)'  },
};

const fmtDate = (d) => {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
};

// Cellule "Date de sortie" — inline editable si vide et source=agent
function ExitDateCell({ row, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(row.exit_date || '');

  const canEdit = row.source === 'agent' && !row.exit_date;
  const isInactive = row.status !== 'active';

  const handleSave = async () => {
    if (!val) { setEditing(false); return; }
    await onSave(row.id, val);
    setEditing(false);
  };

  if (!isInactive) return <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>—</span>;

  if (row.exit_date) {
    return <span style={{ color: '#f87171', fontWeight: 700 }}>{fmtDate(row.exit_date)}</span>;
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <input type="date" value={val} onChange={e => setVal(e.target.value)}
          style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid #f87171', borderRadius: '6px', color: 'var(--text-color)', fontSize: '0.85rem', outline: 'none' }}
          autoFocus />
        <button onClick={handleSave} style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid #34d399', borderRadius: '5px', color: '#34d399', padding: '4px', cursor: 'pointer', display: 'flex' }}><Check size={13} /></button>
        <button onClick={() => setEditing(false)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '5px', color: '#ef4444', padding: '4px', cursor: 'pointer', display: 'flex' }}><XIcon size={13} /></button>
      </div>
    );
  }

  if (canEdit) {
    return (
      <button onClick={() => setEditing(true)}
        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(248,113,113,0.08)', border: '1px dashed rgba(248,113,113,0.4)', borderRadius: '6px', padding: '4px 10px', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
        <Edit3 size={12} /> À renseigner
      </button>
    );
  }

  return <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>—</span>;
}

export default function PersonnelRegistry() {
  const [registry, setRegistry] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [countdown, setCountdown] = useState(30);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  const fetchRegistry = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiCall('get_personnel_registry', {}, 'GET');
      if (res.success) {
        setRegistry(res.registry || []);
        setLastRefresh(new Date());
        setCountdown(30);
      }
    } catch (e) { console.error(e); }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchRegistry();
    // Auto-refresh toutes les 30s
    intervalRef.current = setInterval(() => fetchRegistry(true), 30000);
    // Countdown visuel
    countdownRef.current = setInterval(() => setCountdown(c => (c <= 1 ? 30 : c - 1)), 1000);
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [fetchRegistry]);

  const handleSaveExitDate = async (agentId, date) => {
    await apiCall('set_exit_date', { agent_id: agentId, exit_date: date }, 'POST');
    fetchRegistry(true);
  };

  // Filtrage
  const filtered = registry.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (r.name || '').toLowerCase().includes(q) ||
             (r.matricule || '').toLowerCase().includes(q) ||
             (r.function || '').toLowerCase().includes(q) ||
             (r.service || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Statistiques
  const stats = {
    total:     registry.length,
    active:    registry.filter(r => r.status === 'active').length,
    inactive:  registry.filter(r => r.status !== 'active').length,
    unknown:   registry.filter(r => r.status === 'unknown').length,
    abandoned: registry.filter(r => r.status === 'abandoned').length,
    agents:    registry.filter(r => r.source === 'agent').length,
    users:     registry.filter(r => r.source === 'user').length,
  };

  const isInactive = (r) => r.status !== 'active';

  return (
    <div style={{ padding: '30px', animation: 'fadeIn 0.3s' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(168,85,247,0.2))', borderRadius: '12px', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59,130,246,0.3)' }}>
              <Database size={28} color="#60a5fa" />
            </div>
            Registre Général du Personnel
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
            Base de données complète et autonome — Agents + Admins + Contrôleurs
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <button onClick={() => fetchRegistry(false)} disabled={loading}
            style={{ padding: '10px 20px', background: loading ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
          {lastRefresh && (
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'right' }}>
              <span style={{ color: '#34d399' }}>●</span> Actif — Rafraîchissement dans {countdown}s
              <br />Dernière MàJ : {lastRefresh.toLocaleTimeString('fr-FR')}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Effectif',  value: stats.total,     color: '#60a5fa', icon: Database  },
          { label: 'Actifs',          value: stats.active,    color: '#34d399', icon: UserCheck },
          { label: 'Inactifs',        value: stats.inactive,  color: '#f87171', icon: UserX     },
          { label: 'Abandons',        value: stats.abandoned, color: '#f43f5e', icon: UserX     },
          { label: 'Agents terrain',  value: stats.agents,    color: '#38bdf8', icon: Users     },
          { label: 'Admins/Ctrl',     value: stats.users,     color: '#a855f7', icon: Shield    },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.color}20`, borderRadius: '12px', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '6px' }}>{s.label}</div>
            </div>
            <s.icon size={26} color={s.color} style={{ opacity: 0.4 }} />
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Recherche */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input type="text" placeholder="Nom, matricule, poste, service..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '9px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-color)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Filtre statut */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '9px', padding: '3px' }}>
          {[['all','Tous'],['active','Actifs'],['unknown','Incertains'],['archived','Archivés'],['abandoned','Abandons']].map(([v,l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              style={{ padding: '6px 13px', borderRadius: '7px', border: 'none', background: statusFilter === v ? '#3b82f6' : 'transparent', color: statusFilter === v ? 'white' : 'var(--muted)', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}>{l}</button>
          ))}
        </div>

        {/* Filtre source */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '9px', padding: '3px' }}>
          {[['all','Tout'],['agent','Agents'],['user','Admins']].map(([v,l]) => (
            <button key={v} onClick={() => setSourceFilter(v)}
              style={{ padding: '6px 13px', borderRadius: '7px', border: 'none', background: sourceFilter === v ? '#a855f7' : 'transparent', color: sourceFilter === v ? 'white' : 'var(--muted)', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}>{l}</button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: '0.85rem' }}>
          {filtered.length} / {registry.length} affiché(s)
        </div>
      </div>

      {/* Grand tableau */}
      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)', position: 'sticky', top: 0 }}>
              {['#', 'Nom & Prénom', 'Fonction / Rôle', 'Service / Site', 'Date d\'entrée', 'Dernier pointage', 'Statut', 'Date de sortie', 'Motif'].map(h => (
                <th key={h} style={{ padding: '13px 14px', textAlign: 'left', color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && registry.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
                <Database size={44} style={{ opacity: 0.15, display: 'block', margin: '0 auto 14px' }} />
                Chargement du registre...
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
                <Search size={44} style={{ opacity: 0.15, display: 'block', margin: '0 auto 14px' }} />
                Aucun résultat trouvé.
              </td></tr>
            ) : filtered.map((r, idx) => {
              const inactive = isInactive(r);
              const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.active;
              const src = SOURCE_CONFIG[r.source] || SOURCE_CONFIG.agent;
              const rowBg = inactive
                ? 'rgba(248,113,113,0.04)'
                : 'transparent';

              return (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: rowBg, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = inactive ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = rowBg}>

                  {/* Index */}
                  <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, minWidth: '40px' }}>
                    {idx + 1}
                  </td>

                  {/* Nom */}
                  <td style={{ padding: '12px 14px', minWidth: '180px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: inactive ? '#f87171' : 'var(--text-color)' }}>
                      {r.name}
                    </div>
                    {r.matricule && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                        {r.source === 'agent' ? `#${r.matricule}` : r.matricule}
                      </div>
                    )}
                  </td>



                  {/* Fonction */}
                  <td style={{ padding: '12px 14px', fontSize: '0.87rem', color: inactive ? '#94a3b8' : 'var(--text-color)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.function || ''}>
                    {r.function || '—'}
                  </td>

                  {/* Service */}
                  <td style={{ padding: '12px 14px', fontSize: '0.87rem', color: 'var(--muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.service || '—'}
                  </td>

                  {/* Date entrée */}
                  <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {fmtDate(r.hire_date) || '—'}
                  </td>

                  {/* Dernier pointage */}
                  <td style={{ padding: '12px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {r.last_period
                      ? <span style={{ color: r.source === 'user' ? 'var(--muted)' : (inactive ? '#f87171' : '#34d399') }}>{r.last_period}</span>
                      : <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>

                  {/* Statut */}
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: st.bg, color: st.color, padding: '5px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
                      {st.label}
                    </span>
                  </td>

                  {/* Date de sortie — éditable si inconnue */}
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <ExitDateCell row={r} onSave={handleSaveExitDate} />
                  </td>

                  {/* Motif */}
                  <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#f87171' }}>
                    {r.exit_reason || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '14px', fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'right' }}>
        ⚡ Rafraîchissement automatique toutes les 30 secondes · 🔴 = Plus dans l'effectif
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
