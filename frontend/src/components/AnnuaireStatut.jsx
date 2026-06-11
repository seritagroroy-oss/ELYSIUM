import React, { useState, useEffect } from 'react';
import { Contact, Search, Phone, CheckCircle, XCircle, Clock, Building2, RefreshCw, Loader2, User } from 'lucide-react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';

const STATUS_CONFIG = {
  present: { label: 'Présent', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  absent:  { label: 'Absent',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: XCircle },
  unknown: { label: 'Inconnu', color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: Clock },
};

export default function AnnuaireStatut() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchEmployees();
    // Auto-refresh every 60s
    const interval = setInterval(() => {
      fetchEmployees(true);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmployees = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiCall('get_all_agents', {}, 'GET');
      if (res?.success && res.agents) {
        const today = new Date().toISOString().slice(0, 10);
        const formatted = res.agents.map(agent => {
          const profile = agent.profile_data || {};
          // Determine presence based on today's pointage (simple heuristic)
          const status = agent.today_status || 'unknown';
          return {
            id: agent.id,
            name: agent.name,
            poste: profile.job_title || profile.function || 'N/A',
            dept: profile.site || profile.department || 'Siège',
            phone: profile.phone || null,
            email: profile.email || null,
            status: status,
            avatar: null,
          };
        });
        const depts = [...new Set(formatted.map(e => e.dept))].sort();
        setEmployees(formatted);
        setDepartments(depts);
        setLastRefresh(new Date());
      } else {
        // Demo data fallback
        const demo = [
          { id: 1, name: 'Konan Aya', poste: 'Directrice RH', dept: 'Ressources Humaines', phone: '+225 07 12 34 56', status: 'present', avatar: null },
          { id: 2, name: 'Bamba Seydou', poste: 'Responsable Sécurité', dept: 'Direction', phone: '+225 05 98 76 54', status: 'present', avatar: null },
          { id: 3, name: 'Yao Emmanuel', poste: 'Comptable', dept: 'Comptabilité', phone: '+225 01 23 45 67', status: 'absent', avatar: null },
          { id: 4, name: 'Touré Mariam', poste: 'Assistante', dept: 'Secrétariat', phone: null, status: 'present', avatar: null },
          { id: 5, name: 'Gnagne Paul', poste: 'Chef de Site', dept: 'Opérations', phone: '+225 07 55 44 33', status: 'unknown', avatar: null },
        ];
        setEmployees(demo);
        setDepartments([...new Set(demo.map(e => e.dept))]);
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error(e);
    }
    if (!silent) setLoading(false);
  };

  const presentCount = employees.filter(e => e.status === 'present').length;
  const absentCount = employees.filter(e => e.status === 'absent').length;

  const filtered = employees.filter(e => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterDept !== 'all' && e.dept !== filterDept) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.poste.toLowerCase().includes(q);
    }
    return true;
  });

  const grouped = filtered.reduce((acc, emp) => {
    if (!acc[emp.dept]) acc[emp.dept] = [];
    acc[emp.dept].push(emp);
    return acc;
  }, {});

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const getAvatarColor = (name) => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#f97316'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Contact size={28} color="#38bdf8" /> Annuaire & Statut
          </h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
            Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={() => fetchEmployees()}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <RefreshCw size={16} /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Effectif', value: employees.length, color: '#38bdf8', icon: User },
          { label: 'Présents', value: presentCount, color: '#10b981', icon: CheckCircle },
          { label: 'Absents', value: absentCount, color: '#ef4444', icon: XCircle },
          { label: 'Statut Inconnu', value: employees.length - presentCount - absentCount, color: '#64748b', icon: Clock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}>
            <div style={{ background: `${color}15`, padding: '10px', borderRadius: '10px' }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>{value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', padding: '16px 20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={16} color="var(--muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text" placeholder="Rechercher un collaborateur..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 9px 9px 36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[['all', 'Tous'], ['present', 'Présents'], ['absent', 'Absents']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilterStatus(val)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${filterStatus === val ? (val === 'present' ? '#10b981' : val === 'absent' ? '#ef4444' : 'var(--b)') : 'var(--border)'}`, background: filterStatus === val ? (val === 'present' ? 'rgba(16,185,129,0.15)' : val === 'absent' ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.15)') : 'transparent', color: filterStatus === val ? 'white' : 'var(--muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}>
              {lbl}
            </button>
          ))}
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.4)', color: 'white', outline: 'none', cursor: 'pointer', minWidth: '160px' }}>
          <option value="all">Tous les services</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Grouped List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 className="animate-spin" size={36} color="var(--b)" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <Contact size={48} color="var(--muted)" style={{ opacity: 0.4, marginBottom: '16px' }} />
          <p style={{ color: 'var(--muted)' }}>Aucun collaborateur trouvé.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([dept, emps]) => (
          <div key={dept} style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Building2 size={16} color="var(--muted)" />
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{dept}</h3>
              <div style={{ height: '1px', flex: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {emps.map(emp => {
                const sc = STATUS_CONFIG[emp.status] || STATUS_CONFIG.unknown;
                const StatusIcon = sc.icon;
                return (
                  <div key={emp.id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', transition: 'all 0.2s', cursor: 'default', borderLeft: `3px solid ${sc.color}` }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    {/* Avatar */}
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: getAvatarColor(emp.name), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '0.95rem', color: 'white', letterSpacing: '0.03em' }}>
                      {getInitials(emp.name)}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.poste}</p>
                      {emp.phone && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={11} /> {emp.phone}
                        </p>
                      )}
                    </div>
                    {/* Status Badge */}
                    <div style={{ background: sc.bg, border: `1px solid ${sc.color}40`, padding: '5px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                      <StatusIcon size={12} color={sc.color} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: sc.color }}>{sc.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
