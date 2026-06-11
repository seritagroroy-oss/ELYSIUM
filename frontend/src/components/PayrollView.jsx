import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { useAuth } from '../AuthContext';
import {
  ReceiptText, ChevronLeft, Loader2, Printer, Building2,
  Users, CheckCircle2, Clock, ShieldOff,
  BadgeCheck, Wallet, AlertCircle, MapPin, Eye, Archive, Lock, Search
} from 'lucide-react';

const STATUSES = {
  brouillon: { label: 'Brouillon', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', next: 'valide' },
  valide:    { label: 'Validé',    color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',   next: 'paye' },
  paye:      { label: 'Payé',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',    next: null },
};

const getPeriodsList = (currentPeriod = null) => {
  const list = [];
  const now = new Date();
  
  const generateLabel = (y, m) => {
    // Note: use local time construction to avoid timezone shifts
    const d = new Date();
    d.setFullYear(y, parseInt(m, 10) - 1, 1);
    d.setHours(12, 0, 0, 0); // Safe mid-day
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const periodSet = new Set();

  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const val = `${y}-${m}`;
    list.push({ value: val, label: generateLabel(y, m) });
    periodSet.add(val);
  }

  // Ensure currentPeriod is in the list
  if (currentPeriod && !periodSet.has(currentPeriod)) {
    const [y, m] = currentPeriod.split('-');
    list.push({ value: currentPeriod, label: generateLabel(y, m) });
    // Sort to keep it chronological
    list.sort((a, b) => a.value.localeCompare(b.value));
  }

  return list;
};

const ZONE_COLORS = ['#38bdf8','#a78bfa','#34d399','#fbbf24','#f472b6','#fb7185','#818cf8','#2dd4bf','#e879f9','#a3e635'];

export default function PayrollView({ setView }) {
  const { user } = useAuth();

  const sName = (user?.service || '').toLowerCase();
  const isAllowed =
    user?.role === 'admin' ||
    sName.includes('compta') ||
    sName.includes('rh') ||
    sName.includes('ressources humaines') ||
    (user?.permissions && user.permissions.can_view_salaries);

  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const initialLoadRef = React.useRef(true);
  const [sites, setSites] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishedPeriods, setPublishedPeriods] = useState([]);
  const [archivedPeriods, setArchivedPeriods] = useState([]);
  const [viewMode, setViewMode] = useState('current'); // 'current' ou 'archives'
  const [archivesList, setArchivesList] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [archiveDetail, setArchiveDetail] = useState(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [searchArchiveText, setSearchArchiveText] = useState('');

  // Navigation: null = sites | {id, name} = zones | {siteId, zoneName} = agents
  const [activeSite, setActiveSite] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pontage_payroll_activeSite')) || null; } catch { return null; }
  });
  const [activeZone, setActiveZone] = useState(() => {
    return localStorage.getItem('pontage_payroll_activeZone') || null;
  });

  useEffect(() => {
    if (activeSite) localStorage.setItem('pontage_payroll_activeSite', JSON.stringify(activeSite));
    else localStorage.removeItem('pontage_payroll_activeSite');
  }, [activeSite]);

  useEffect(() => {
    if (activeZone) localStorage.setItem('pontage_payroll_activeZone', activeZone);
    else localStorage.removeItem('pontage_payroll_activeZone');
  }, [activeZone]);
  const [expandedRow, setExpandedRow] = useState(null);

  const formatArchiveTitle = (p) => {
    if (!p) return '';
    const [y, m] = p.split('-');
    const date = new Date(y, parseInt(m) - 1, 1);
    const monthName = date.toLocaleString('fr-FR', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    const prevDate = new Date(y, parseInt(m) - 2, 21);
    const currDate = new Date(y, parseInt(m) - 1, 20);
    const d1 = prevDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const d2 = currDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `Archive de ${capitalizedMonth} (Du ${d1} au ${d2})`;
  };

  const [statuses, setStatuses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pontage_payroll_statuses') || '{}'); }
    catch { return {}; }
  });

  const saveStatuses = (s) => {
    setStatuses(s);
    localStorage.setItem('pontage_payroll_statuses', JSON.stringify(s));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [sitesRes, salRes, funcRes, pubRes] = await Promise.all([
        apiCall('get_sites', { scope: 'company' }, 'GET'),
        apiCall('get_salaries', { period, scope: 'company' }, 'GET'),
        apiCall('get_functions', { scope: 'company' }, 'GET'),
        apiCall('get_published_periods', { scope: 'company' }, 'GET')
      ]);
      if (Array.isArray(sitesRes)) setSites(sitesRes);
      if (Array.isArray(salRes)) setSalaries(salRes);
      if (Array.isArray(funcRes)) setFunctions(funcRes);
      if (pubRes?.success) {
        const pubs = pubRes.published_periods || [];
        const archs = pubRes.archived_periods || [];
        setPublishedPeriods(pubs);
        setArchivedPeriods(archs);
        
        // Auto-jump to the latest publication on initial load, or if the current period is entirely missing
        if (pubs.length > 0) {
          const exactLatest = pubRes.latest_publication?.period;
          const targetPeriod = exactLatest && pubs.includes(exactLatest) ? exactLatest : [...pubs].sort().reverse()[0];
          
          if (initialLoadRef.current) {
             setPeriod(targetPeriod);
             initialLoadRef.current = false;
          } else if (!pubs.includes(period) && !archs.includes(period)) {
             setPeriod(targetPeriod);
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAllowed) loadData(); }, [period]);

  const isArchiveMode = viewMode === 'archives' && selectedArchive;
  const activeSalaries = isArchiveMode ? (archiveDetail?.salaries || []) : salaries;
  const activeStatuses = isArchiveMode ? (archiveDetail?.statuses || {}) : statuses;

  // Déterminer la liste des sites à afficher et leur ordre
  const activeSites = React.useMemo(() => {
    if (isArchiveMode && archiveDetail?.sites) {
      // En mode archive, on prend l'ordre historique figé dans l'archive
      return archiveDetail.sites.map(s => ({ id: s.id, name: s.name }));
    }
    // En mode actuel, on trie avec l'ordre du localStorage (celui du Dashboard)
    const siteOrder = JSON.parse(localStorage.getItem('pontage_site_order') || '[]');
    return [...sites].sort((a, b) => {
      const idxA = siteOrder.indexOf(a.id);
      const idxB = siteOrder.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [sites, isArchiveMode, archiveDetail, user?.service_id]);

  const funcLabel = (id) => functions.find(fn => fn.id === id)?.name || id || '—';

  const getStatusKey = (agentName, siteId, zoneName) => `${isArchiveMode ? selectedArchive : period}_${siteId}_${zoneName}_${agentName}`;
  const getAgentStatus = (agentName, siteId, zoneName) => activeStatuses[getStatusKey(agentName, siteId, zoneName)] || 'brouillon';
  
  const cycleStatus = (agentName, siteId, zoneName) => {
    if (isArchiveMode) return; // Lecture seule en mode archive
    const key = getStatusKey(agentName, siteId, zoneName);
    const next = STATUSES[activeStatuses[key] || 'brouillon']?.next;
    if (next) saveStatuses({ ...activeStatuses, [key]: next });
  };

  // Agents d'un site
  const agentsForSite = (siteName) => activeSalaries.filter(s => s.site === siteName);

  // Zones (subsites) uniques d'un site
  const zonesForSite = (siteName) => {
    const agents = agentsForSite(siteName);
    return [...new Set(agents.map(a => a.subsite).filter(Boolean))];
  };

  // Agents d'une zone précise
  const agentsForZone = (siteName, zoneName) =>
    agentsForSite(siteName).filter(a => a.subsite === zoneName);

  // Résumé par site
  const siteSummary = (site) => {
    const agents = agentsForSite(site.name);
    const total = agents.reduce((acc, s) => acc + s.total, 0);
    const paid = agents.filter(s => getAgentStatus(s.name, site.id, s.subsite) === 'paye').length;
    const validated = agents.filter(s => getAgentStatus(s.name, site.id, s.subsite) === 'valide').length;
    const zones = zonesForSite(site.name).length;
    return { agentsCount: agents.length, total, paid, validated, zones };
  };

  // Résumé par zone
  const zoneSummary = (siteId, siteName, zoneName) => {
    const agents = agentsForZone(siteName, zoneName);
    const total = agents.reduce((acc, s) => acc + s.total, 0);
    const paid = agents.filter(s => getAgentStatus(s.name, siteId, zoneName) === 'paye').length;
    const validated = agents.filter(s => getAgentStatus(s.name, siteId, zoneName) === 'valide').length;
    return { agentsCount: agents.length, total, paid, validated };
  };

  const fetchArchives = async () => {
    try {
      const res = await apiCall('get_payroll_archives', { scope: 'company' }, 'GET');
      if (res?.success) setArchivesList(res.archives || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (viewMode === 'archives') fetchArchives();
  }, [viewMode]);

  useEffect(() => {
    if (selectedArchive) {
      const loadArch = async () => {
        setArchiveLoading(true);
        try {
          const res = await apiCall(`get_payroll_archive_detail&period=${selectedArchive}&scope=company`, {}, 'GET');
          if (res?.success) setArchiveDetail(res.archive);
        } catch (e) { console.error(e); } 
        finally { setArchiveLoading(false); }
      };
      loadArch();
    } else {
      setArchiveDetail(null);
      if (viewMode === 'archives') {
        setActiveSite(null);
        setActiveZone(null);
      }
    }
  }, [selectedArchive, viewMode]);

  const handleArchive = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir archiver cet état de paie pour la période ${period} ?\nCeci figera les montants et statuts actuels.`)) return;
    try {
      const res = await apiCall('archive_payroll', { period, salaries, statuses, sites: activeSites, scope: 'company' }, 'POST');
      if (res?.success) {
        alert('Archive créée avec succès.');
        setArchivedPeriods(prev => [...prev, period]);
        fetchArchives();
      } else {
        alert(res?.message || 'Erreur lors de l\'archivage.');
      }
    } catch (e) {
      alert('Erreur réseau.');
    }
  };

  const isPeriodPublished = publishedPeriods.includes(period);

  const BackBtn = ({ onClick, label = 'Retour' }) => (
    <button onClick={onClick} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <ChevronLeft size={18} /> {label}
    </button>
  );

  const PeriodSelect = () => (
    <select className="form-input" style={{ background: 'rgba(0,0,0,0.3)', minWidth: '180px' }} value={period} onChange={(e) => setPeriod(e.target.value)}>
      {getPeriodsList(period).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
    </select>
  );

  const ModeTabs = () => (
    <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px' }}>
      <button onClick={() => setViewMode('current')} className={`btn ${viewMode === 'current' ? 'btn-primary' : ''}`} style={{ padding: '6px 12px', borderRadius: '8px', background: viewMode === 'current' ? 'var(--primary)' : 'transparent', color: viewMode === 'current' ? 'white' : 'var(--muted)', border: 'none' }}>
        Actuel
      </button>
      <button onClick={() => setViewMode('archives')} className={`btn ${viewMode === 'archives' ? 'btn-primary' : ''}`} style={{ padding: '6px 12px', borderRadius: '8px', background: viewMode === 'archives' ? 'var(--primary)' : 'transparent', color: viewMode === 'archives' ? 'white' : 'var(--muted)', border: 'none' }}>
        <Archive size={16} style={{ display: 'inline', marginRight: '6px' }} /> Archives
      </button>
    </div>
  );

  // ─── Accès refusé ────────────────────────────────────────────────────────────
  if (!isAllowed) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <ShieldOff size={40} style={{ color: '#ef4444' }} />
      </div>
      <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '12px', color: 'white' }}>Accès Restreint</h2>
      <p style={{ color: 'var(--muted)', maxWidth: '420px', lineHeight: '1.6' }}>
        Ce module est réservé aux administrateurs et au service Comptabilité / RH.
      </p>
    </div>
  );

  // ─── CHARGEMENT GLOBAL ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--b)' }} />
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Chargement des données de l'état de paie...</p>
      </div>
    );
  }

  // ─── VUE ARCHIVES (Liste) ───────────────────────────────────────────
  if (viewMode === 'archives' && !selectedArchive) {
    const normalizeString = (str) => {
      if (!str) return "";
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const filteredArchives = archivesList.filter(a => {
      let monthLabel = a.period;
      if (a.period.includes('-')) {
         const [y, m] = a.period.split('-');
         const d = new Date(); d.setFullYear(y, parseInt(m, 10) - 1, 1); d.setHours(12, 0, 0, 0);
         monthLabel = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      }
      const searchable = `${a.period} ${monthLabel} ${a.archived_by} ${a.archived_at}`;
      return normalizeString(searchable).includes(normalizeString(searchArchiveText));
    });

    return (
      <div style={{ padding: '0 0 40px 0' }}>
        <div className="top-bar glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* Titre à gauche */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <ReceiptText size={24} style={{ color: 'var(--a)' }} />
            <h2 style={{ fontSize: '1.4rem', margin: 0, whiteSpace: 'nowrap' }}>Archives de Paie</h2>
          </div>
          
          {/* Recherche centrée et élargie */}
          <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', width: '100%', maxWidth: '600px', gap: '10px', transition: 'all 0.2s' }}>
              <Search size={20} style={{ color: 'var(--muted)' }} />
              <input 
                type="text" 
                placeholder="Rechercher une archive (mois, année, auteur)..." 
                value={searchArchiveText}
                onChange={e => setSearchArchiveText(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1rem' }}
              />
            </div>
          </div>

          {/* Onglets à droite */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <ModeTabs />
          </div>
        </div>
        
        <div className="glass-panel" style={{ marginTop: '24px' }}>
          {archivesList.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
              <Archive size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>Aucune archive disponible.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Période</th>
                    <th>Date d'archivage</th>
                    <th>Archivé par</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArchives.map((a, i) => {
                    let monthLabel = a.period;
                    if (a.period.includes('-')) {
                       const [y, m] = a.period.split('-');
                       const d = new Date(); d.setFullYear(y, parseInt(m, 10) - 1, 1); d.setHours(12, 0, 0, 0);
                       monthLabel = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                       monthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
                    }
                    
                    let dateLabel = a.archived_at;
                    if (dateLabel && dateLabel.includes('-')) {
                       // format from YYYY-MM-DD HH:MM:SS to DD/MM/YYYY HH:MM:SS
                       const parts = dateLabel.split(' ');
                       if (parts.length > 0) {
                          const dateParts = parts[0].split('-');
                          if (dateParts.length === 3) {
                             dateLabel = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}${parts[1] ? ' ' + parts[1] : ''}`;
                          }
                       }
                    }

                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: '700', color: 'white' }}>{monthLabel}</td>
                        <td>{dateLabel}</td>
                        <td>{a.archived_by}</td>
                        <td>
                          <button onClick={() => setSelectedArchive(a.period)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            Consulter
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isPeriodArchived = archivedPeriods.includes(period);

  // ─── BLOCAGE SI DÉJÀ ARCHIVÉ (Seulement en Actuel) ────────────────────────
  if (!isArchiveMode && isPeriodArchived) {
    return (
      <div style={{ padding: '0 0 40px 0' }}>
        <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ReceiptText size={24} style={{ color: 'var(--a)' }} />
            <h2 style={{ fontSize: '1.4rem' }}>État de Paie</h2>
            <span style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>Comptabilité / RH</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <PeriodSelect />
            <ModeTabs />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', marginTop: '24px' }} className="glass-panel">
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <Archive size={40} style={{ color: '#22c55e' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '12px', color: 'white' }}>État de paie clôturé</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '480px', lineHeight: '1.6' }}>
            L'état de paie de <strong>{period}</strong> a été définitivement archivé. Il n'est plus modifiable dans cet espace.
            <br/><br/>
            Veuillez basculer sur l'onglet <strong>Archives</strong> pour le consulter en lecture seule.
          </p>
        </div>
      </div>
    );
  }

  // ─── BLOCAGE SI NON PUBLIÉ (Seulement en Actuel) ───────────────────────────
  if (!isArchiveMode && !isPeriodPublished) {
    return (
      <div style={{ padding: '0 0 40px 0' }}>
        <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ReceiptText size={24} style={{ color: 'var(--a)' }} />
            <h2 style={{ fontSize: '1.4rem' }}>État de Paie</h2>
            <span style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>Comptabilité / RH</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <PeriodSelect />
            <ModeTabs />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', marginTop: '24px' }} className="glass-panel">
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <Lock size={40} style={{ color: '#f59e0b' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '12px', color: 'white' }}>Pointage non publié</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '480px', lineHeight: '1.6' }}>
            L'état de paie de <strong>{period}</strong> n'est pas encore accessible. Le service en charge du pointage n'a pas encore validé ni publié les données pour cette période.
          </p>
        </div>
      </div>
    );
  }

  // ─── VUE 3 : Agents d'une Zone ───────────────────────────────────────────────
  if (activeSite && activeZone) {
    const agents = agentsForZone(activeSite.name, activeZone);
    const totalNet = agents.reduce((acc, s) => acc + s.total, 0);
    const toggleRow = (idx) => setExpandedRow(prev => prev === idx ? null : idx);
    return (
      <div style={{ padding: '0 0 40px 0' }}>
        <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isArchiveMode && <BackBtn onClick={() => setSelectedArchive(null)} label="Liste" />}
            <BackBtn onClick={() => setActiveZone(null)} label="Zones" />
            <ReceiptText size={20} style={{ color: 'var(--a)' }} />
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                {isArchiveMode ? formatArchiveTitle(selectedArchive) : 'État de Paie'} — 
                <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: '6px' }}>{activeSite.name}</span>
                <span style={{ color: 'var(--muted)' }}> / </span>
                <span style={{ color: 'var(--a)' }}>{activeZone}</span>
              </h2>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {!isArchiveMode && <PeriodSelect />}
            {isArchiveMode && (
              <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem' }}>
                Mode Lecture Seule
              </div>
            )}
            <button className="btn btn-secondary" onClick={() => {
              let csv = "data:text/csv;charset=utf-8,\uFEFFNom,Poste,Jours Trav,Absences,MAP,H.Sup,Base,Retenues,Gains,Remb. Prêt,Net,Statut\n";
              agents.forEach(s => {
                const stLabel = STATUSES[getAgentStatus(s.name, activeSite.id, activeZone)]?.label || '';
                csv += `"${s.name}","${funcLabel(s.function)}",${s.days_worked ?? (30 - s.absences - (s.map_count||0))},${s.absences},${s.map_count||0},${s.sp_count||0},${s.base},${s.deductions},${s.gains},${s.remboursement_pret||0},${s.total},"${stLabel}"\n`;
              });
              const link = document.createElement("a");
              link.setAttribute("href", encodeURI(csv));
              link.setAttribute("download", `paie_${activeSite.name}_${activeZone}_${period}.csv`.replace(/ /g, '_'));
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--border)' }}>
              <ReceiptText size={16} /> Exporter CSV
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={16} /> Imprimer
            </button>
          </div>
        </div>

        {/* Résumé de la zone */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', margin: '20px 0' }}>
          {[
            { label: 'Agents', value: agents.length, color: '#38bdf8', icon: Users },
            { label: 'Brouillons', value: agents.filter(s => getAgentStatus(s.name, activeSite.id, activeZone) === 'brouillon').length, color: '#94a3b8', icon: Clock },
            { label: 'Validés', value: agents.filter(s => getAgentStatus(s.name, activeSite.id, activeZone) === 'valide').length, color: '#38bdf8', icon: BadgeCheck },
            { label: 'Payés', value: agents.filter(s => getAgentStatus(s.name, activeSite.id, activeZone) === 'paye').length, color: '#22c55e', icon: Wallet },
            { label: 'MAP', value: agents.reduce((a, s) => a + (s.map_count || 0), 0), color: '#f97316', icon: AlertCircle },
            { isLink: true, label: 'Consulter Pointage', color: '#a855f7', icon: Clock }
          ].map((item, idx) => {
            if (item.isLink) {
              return (
                <div key={item.label} className="glass-panel" 
                  onClick={() => {
                     localStorage.setItem('pontage_activeSiteId', activeSite.id);
                     localStorage.setItem('pontage_activeSiteName', activeSite.name);
                     localStorage.setItem('pontage_period', period);
                     if (typeof setView === 'function') setView('verification');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', cursor: 'pointer', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', transition: 'all 0.2s', borderRadius: '12px' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(168,85,247,0.2)'; e.currentTarget.style.background = 'rgba(168,85,247,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(168,85,247,0.1)'; }}
                >
                  <div style={{ background: `${item.color}20`, borderRadius: '8px', padding: '8px', color: item.color }}><item.icon size={18} /></div>
                  <div>
                    <h4 style={{ fontSize: '0.90rem', fontWeight: 800, margin: 0, color: 'white', textTransform: 'uppercase' }}>{item.label}</h4>
                    <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: 0 }}>Aller au traitement</p>
                  </div>
                </div>
              );
            }
            return (
              <div key={item.label} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px' }}>
                <div style={{ background: `${item.color}20`, borderRadius: '8px', padding: '8px', color: item.color }}><item.icon size={18} /></div>
                <div>
                  <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</p>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'white' }}>{item.value}</h4>
                </div>
              </div>
            );
          })}
        </div>

        {agents.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Aucune donnée de salaire disponible.<br />Calculez d'abord les salaires dans le module "Calcul Salaires".</p>
          </div>
        ) : (
          <div className="glass-panel">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom & Prénom</th>
                    <th>Poste</th>
                    <th style={{ textAlign: 'center' }}>Jours Trav.</th>
                    <th style={{ textAlign: 'center' }}>Absences</th>
                    <th style={{ textAlign: 'center', color: '#f97316' }}>MAP</th>
                    <th style={{ textAlign: 'center', color: 'var(--b)' }}>H. Sup.</th>
                    <th style={{ textAlign: 'right' }}>Base (XOF)</th>
                    <th style={{ textAlign: 'right', color: 'var(--danger)' }}>Retenues</th>
                    <th style={{ textAlign: 'right', color: '#a855f7' }}>Prime Site</th>
                    <th style={{ textAlign: 'right', color: 'var(--b)' }}>Supplémentaire</th>
                    <th style={{ textAlign: 'right', color: '#f43f5e' }}>Remb. Prêt</th>
                    <th style={{ textAlign: 'right', color: 'var(--a)' }}>Net à Payer</th>
                    <th style={{ textAlign: 'center' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                   {agents.map((s, idx) => {
                    const status = getAgentStatus(s.name, activeSite.id, activeZone);
                    const st = STATUSES[status];
                    const isOpen = expandedRow === idx;
                    return (
                      <React.Fragment key={idx}>
                       <tr>
                         <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{idx + 1}</td>
                         <td style={{ fontWeight: '700' }}>{s.name}</td>
                         <td>
                           <span style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.78rem' }}>
                             {funcLabel(s.function)}
                           </span>
                         </td>
                         <td style={{ textAlign: 'center', fontWeight: '600' }}>{s.days_worked ?? (30 - s.absences - (s.map_count||0))}</td>
                         <td style={{ textAlign: 'center' }}>
                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                             <span style={{ color: s.absences > 0 ? 'var(--danger)' : 'var(--muted)' }}>
                               {s.absences > 0 ? s.absences : '—'}
                             </span>
                             {s.absences > 0 && (
                               <button
                                 onClick={() => toggleRow(isOpen && expandedRow === idx ? null : idx)}
                                 title="Voir les jours d'absence"
                                 style={{ background: 'none', border: 'none', cursor: 'pointer', color: isOpen ? 'var(--danger)' : 'rgba(239,68,68,0.4)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                               >
                                 <Eye size={14} />
                               </button>
                             )}
                           </div>
                         </td>
                         <td style={{ textAlign: 'center' }}>
                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                             <span style={{ color: (s.map_count||0) > 0 ? '#f97316' : 'var(--muted)' }}>
                               {(s.map_count||0) > 0 ? s.map_count : '—'}
                             </span>
                             {(s.map_count||0) > 0 && (
                               <button
                                 onClick={() => toggleRow(isOpen && expandedRow === idx ? null : idx)}
                                 title="Voir les jours de mise à pied"
                                 style={{ background: 'none', border: 'none', cursor: 'pointer', color: isOpen ? '#f97316' : 'rgba(249,115,22,0.4)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                               >
                                 <Eye size={14} />
                               </button>
                             )}
                           </div>
                         </td>
                         <td style={{ textAlign: 'center' }}>
                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                             <span style={{ color: (s.sp_count||0) > 0 ? 'var(--b)' : 'var(--muted)' }}>
                               {(s.sp_count||0) > 0 ? `+${s.sp_count}` : '—'}
                             </span>
                             {(s.sp_count||0) > 0 && (
                               <button
                                 onClick={() => toggleRow(idx)}
                                 title="Voir les jours supplémentaires"
                                 style={{ background: 'none', border: 'none', cursor: 'pointer', color: isOpen ? 'var(--b)' : 'rgba(56,189,248,0.4)', padding: '2px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                               >
                                 <Eye size={14} />
                               </button>
                             )}
                           </div>
                         </td>
                         <td style={{ textAlign: 'right' }}>{s.base.toLocaleString()}</td>
                         <td style={{ textAlign: 'right', color: s.deductions > 0 ? 'var(--danger)' : 'var(--muted)' }}>{s.deductions > 0 ? `-${s.deductions.toLocaleString()}` : '—'}</td>
                         <td style={{ textAlign: 'right', color: (s.prime_site||0) > 0 ? '#a855f7' : 'var(--muted)', fontWeight: (s.prime_site||0) > 0 ? '700' : '400' }}>{(s.prime_site||0) > 0 ? `+${s.prime_site.toLocaleString()}` : '—'}</td>
                         <td style={{ textAlign: 'right', color: s.gains > 0 ? 'var(--b)' : 'var(--muted)', fontWeight: s.gains > 0 ? '700' : '400' }}>{s.gains > 0 ? `+${s.gains.toLocaleString()}` : '—'}</td>
                         <td style={{ textAlign: 'right', color: (s.remboursement_pret||0) > 0 ? '#f43f5e' : 'var(--muted)', fontWeight: (s.remboursement_pret||0) > 0 ? '700' : '400' }}>{(s.remboursement_pret||0) > 0 ? `-${s.remboursement_pret.toLocaleString()}` : '—'}</td>
                         <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--a)', fontSize: '1.05rem' }}>{s.total.toLocaleString()}</td>
                         <td style={{ textAlign: 'center' }}>
                           <button
                             onClick={() => cycleStatus(s.name, activeSite.id, activeZone)}
                             style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}50`, borderRadius: '20px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: '700', cursor: st.next ? 'pointer' : 'default', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                             title={st.next ? `Passer à : ${STATUSES[st.next]?.label}` : 'Statut final'}
                           >
                             {status === 'paye' && <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                             {st.label}
                           </button>
                         </td>
                       </tr>
                       {isOpen && (
                         <tr>
                           <td colSpan={12} style={{ background: 'rgba(255,255,255,0.02)', padding: '14px 20px' }}>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                               {/* Détails Absences */}
                               <div>
                                 <h4 style={{ color: 'var(--danger)', marginBottom: '8px', fontSize: '0.88rem', fontWeight: 700 }}>
                                   Jours d'absence ({s.absences})
                                 </h4>
                                 {(s.absence_details || []).length === 0 ? (
                                   <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Aucune absence</p>
                                 ) : (
                                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                     {s.absence_details.map((a, i) => (
                                       <span key={i} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                         {new Date(a.date).toLocaleDateString('fr-FR')} ({a.shift})
                                       </span>
                                     ))}
                                   </div>
                                 )}
                               </div>
                               {/* Détails MAP */}
                               <div>
                                 <h4 style={{ color: '#f97316', marginBottom: '8px', fontSize: '0.88rem', fontWeight: 700 }}>
                                   Mises à pied ({s.map_count || 0})
                                 </h4>
                                 {(s.map_details || []).length === 0 ? (
                                   <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Aucune mise à pied</p>
                                 ) : (
                                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                     {s.map_details.map((a, i) => (
                                       <span key={i} style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', padding: '3px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                         {new Date(a.date).toLocaleDateString('fr-FR')} ({a.shift})
                                       </span>
                                     ))}
                                   </div>
                                 )}
                               </div>
                               {/* Détails Supplémentaires */}
                               <div>
                                 <h4 style={{ color: 'var(--b)', marginBottom: '8px', fontSize: '0.88rem', fontWeight: 700 }}>
                                   Services supplémentaires ({s.sp_count || 0})
                                 </h4>
                                 {(s.sp_details || []).length === 0 ? (
                                   <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Aucun service supplémentaire</p>
                                 ) : (
                                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                     {s.sp_details.map((a, i) => (
                                       <span key={i} style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                                         {new Date(a.date).toLocaleDateString('fr-FR')} ({a.shift})
                                       </span>
                                     ))}
                                   </div>
                                 )}
                               </div>
                             </div>
                           </td>
                         </tr>
                       )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'linear-gradient(90deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.02) 100%)', borderTop: '2px solid #22c55e', borderBottom: '1px solid #22c55e' }}>
                    <td colSpan={7} style={{ fontWeight: '800', padding: '16px 16px', color: '#22c55e', fontSize: '0.95rem' }}>TOTAL ZONE</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#22c55e' }}>{agents.reduce((a, s) => a + s.base, 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#ef4444' }}>-{agents.reduce((a, s) => a + s.deductions, 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#a855f7' }}>+{agents.reduce((a, s) => a + (s.prime_site||0), 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#38bdf8' }}>+{agents.reduce((a, s) => a + s.gains, 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#f43f5e' }}>-{agents.reduce((a, s) => a + (s.remboursement_pret||0), 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: '900', color: '#22c55e', fontSize: '1.2rem' }}>{totalNet.toLocaleString()} XOF</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  // ─── VUE 2 : Zones d'un Site ─────────────────────────────────────────────────
  if (activeSite) {
    const zones = zonesForSite(activeSite.name);
    const allAgents = agentsForSite(activeSite.name);
    const totalSite = allAgents.reduce((a, s) => a + s.total, 0);

    return (
      <div style={{ padding: '0 0 40px 0' }}>
        <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isArchiveMode && <BackBtn onClick={() => setSelectedArchive(null)} label="Liste" />}
            <BackBtn onClick={() => setActiveSite(null)} label="Sites" />
            <ReceiptText size={20} style={{ color: 'var(--a)' }} />
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                {isArchiveMode ? formatArchiveTitle(selectedArchive) : 'État de Paie'} — <span style={{ color: 'var(--a)' }}>{activeSite.name}</span>
              </h2>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {!isArchiveMode && (
              <button className="btn btn-success" onClick={handleArchive} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Archive size={16} /> Archiver l'état de paie
              </button>
            )}
            {!isArchiveMode && <PeriodSelect />}
            {isArchiveMode && (
              <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem' }}>
                Mode Lecture Seule
              </div>
            )}
            <ModeTabs />
          </div>
        </div>

        {/* Stats du site */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', margin: '20px 0' }}>
          {[
            { label: 'Total Agents', value: allAgents.length, color: '#38bdf8', icon: Users },
            { label: 'Zones', value: zones.length, color: '#a78bfa', icon: MapPin },
            { label: 'Validés', value: allAgents.filter(s => getAgentStatus(s.name, activeSite.id, s.subsite) === 'valide').length, color: '#38bdf8', icon: BadgeCheck },
            { label: 'Payés', value: allAgents.filter(s => getAgentStatus(s.name, activeSite.id, s.subsite) === 'paye').length, color: '#22c55e', icon: Wallet },
            { isLink: true, label: 'Consulter Pointage', color: '#a855f7', icon: Clock }
          ].map((item, idx) => {
            if (item.isLink) {
              return (
                <div key={item.label} className="glass-panel" 
                  onClick={() => {
                     localStorage.setItem('pontage_activeSiteId', activeSite.id);
                     localStorage.setItem('pontage_activeSiteName', activeSite.name);
                     localStorage.setItem('pontage_period', period);
                     if (typeof setView === 'function') setView('verification');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', cursor: 'pointer', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', transition: 'all 0.2s', borderRadius: '12px' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(168,85,247,0.2)'; e.currentTarget.style.background = 'rgba(168,85,247,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(168,85,247,0.1)'; }}
                >
                  <div style={{ background: `${item.color}20`, borderRadius: '8px', padding: '8px', color: item.color }}><item.icon size={18} /></div>
                  <div>
                    <h4 style={{ fontSize: '0.90rem', fontWeight: 800, margin: 0, color: 'white', textTransform: 'uppercase' }}>{item.label}</h4>
                    <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: 0 }}>Aller au traitement</p>
                  </div>
                </div>
              );
            }
            return (
              <div key={item.label} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px' }}>
                <div style={{ background: `${item.color}20`, borderRadius: '8px', padding: '8px', color: item.color }}><item.icon size={18} /></div>
                <div>
                  <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</p>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'white' }}>{item.value}</h4>
                </div>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: 'var(--b)' }} />
          </div>
        ) : zones.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Aucune zone / aucune donnée pour ce site sur cette période.</p>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', margin: '0 0 16px 0', fontSize: '0.95rem' }}>
              Sélectionnez une zone pour voir les états de paie de ses agents.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {zones.map((zone, idx) => {
                const { agentsCount, total, paid, validated } = zoneSummary(activeSite.id, activeSite.name, zone);
                const progress = agentsCount > 0 ? Math.round((paid / agentsCount) * 100) : 0;
                const color = ZONE_COLORS[idx % ZONE_COLORS.length];
                return (
                  <div
                    key={zone}
                    onClick={() => setActiveZone(zone)}
                    className="glass-panel"
                    style={{ cursor: 'pointer', borderRadius: '16px', padding: '22px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', animation: `slideUp 0.35s ease-out forwards`, animationDelay: `${idx * 0.06}s`, opacity: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 28px -10px ${color}50`; e.currentTarget.style.borderColor = `${color}60`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`, borderRadius: '50%' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ background: `${color}20`, borderRadius: '10px', padding: '10px', color }}>
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontWeight: '700', fontSize: '1.05rem', margin: 0 }}>{zone}</h3>
                        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '2px 0 0 0' }}>{agentsCount} agent{agentsCount > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '5px' }}>
                        <span>Progression paiements</span>
                        <span style={{ color: progress === 100 ? '#22c55e' : color, fontWeight: '700' }}>{progress}%</span>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#22c55e' : color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600' }}>
                          {agentsCount - validated - paid} Brouillon
                        </span>
                        <span style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600' }}>
                          {validated} Validé
                        </span>
                        <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600' }}>
                          {paid} Payé
                        </span>
                      </div>
                      <span style={{ color: color, fontWeight: '700', fontSize: '0.88rem' }}>
                        {total.toLocaleString()} <span style={{ fontSize: '0.7rem' }}>XOF</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    );
  }

  // ─── VUE 1 : Liste des Sites ─────────────────────────────────────────────────
  return (
    <div style={{ padding: '0 0 40px 0' }}>
      <div className="top-bar glass-panel" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isArchiveMode && <BackBtn onClick={() => setSelectedArchive(null)} label="Liste" />}
          <ReceiptText size={24} style={{ color: 'var(--a)' }} />
          <h2 style={{ fontSize: '1.4rem' }}>{isArchiveMode ? formatArchiveTitle(selectedArchive) : 'État de Paie'}</h2>
          {!isArchiveMode && <span style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>Comptabilité / RH</span>}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!isArchiveMode && (
            <button className="btn btn-success" onClick={handleArchive} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Archive size={16} /> Archiver l'état de paie
            </button>
          )}
          {!isArchiveMode && <PeriodSelect />}
          {isArchiveMode && (
            <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem' }}>
              Mode Lecture Seule
            </div>
          )}
          <ModeTabs />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--b)' }} />
        </div>
      ) : sites.length === 0 ? (
        <div className="glass-panel" style={{ marginTop: '24px', textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
          <Building2 size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>Aucun site trouvé.</p>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--muted)', margin: '20px 0 16px 0', fontSize: '0.95rem' }}>
            Sélectionnez un site pour accéder à ses zones, puis aux états de paie.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {activeSites.map((site, idx) => {
              const { agentsCount, total, paid, validated, zones } = siteSummary(site);
              const progress = agentsCount > 0 ? Math.round((paid / agentsCount) * 100) : 0;
              const isAllPaid = agentsCount > 0 && paid === agentsCount;
              const isAllValidatedOrPaid = agentsCount > 0 && (validated + paid === agentsCount) && !isAllPaid;

              let cardBg = '';
              let cardBorderColor = 'var(--border)';
              let cardHoverBorderColor = 'rgba(56,189,248,0.4)';
              let cardHoverShadow = '0 12px 30px -10px rgba(56,189,248,0.3)';
              let radialGradientColor = 'rgba(56,189,248,0.15)';
              let iconBgColor = 'rgba(56,189,248,0.12)';
              let iconColor = 'var(--b)';

              if (isAllPaid) {
                cardBg = 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.02) 100%)';
                cardBorderColor = 'rgba(34,197,94,0.3)';
                cardHoverBorderColor = 'rgba(34,197,94,0.7)';
                cardHoverShadow = '0 12px 30px -10px rgba(34,197,94,0.4)';
                radialGradientColor = 'rgba(34,197,94,0.2)';
                iconBgColor = 'rgba(34,197,94,0.2)';
                iconColor = '#22c55e';
              } else if (isAllValidatedOrPaid) {
                cardBg = 'linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(56,189,248,0.02) 100%)';
                cardBorderColor = 'rgba(56,189,248,0.4)';
                cardHoverBorderColor = 'rgba(56,189,248,0.8)';
                cardHoverShadow = '0 12px 30px -10px rgba(56,189,248,0.5)';
                radialGradientColor = 'rgba(56,189,248,0.25)';
                iconBgColor = 'rgba(56,189,248,0.2)';
                iconColor = '#38bdf8';
              }

              return (
                <div
                  key={site.id}
                  onClick={() => setActiveSite({ id: site.id, name: site.name })}
                  className="glass-panel"
                  style={{ cursor: 'pointer', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', animation: `slideUp 0.4s ease-out forwards`, animationDelay: `${idx * 0.06}s`, opacity: 0, background: cardBg || undefined, borderColor: cardBorderColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = cardHoverShadow; e.currentTarget.style.borderColor = cardHoverBorderColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = cardBorderColor; }}
                >
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: `radial-gradient(circle, ${radialGradientColor} 0%, transparent 70%)`, borderRadius: '50%' }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: iconBgColor, borderRadius: '10px', padding: '10px', color: iconColor }}>
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: '700', fontSize: '1.1rem', margin: 0 }}>{site.name}</h3>
                      <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '2px 0 0 0' }}>
                        {zones} zone{zones > 1 ? 's' : ''} · {agentsCount} agent{agentsCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--muted)', marginBottom: '5px' }}>
                      <span>Progression paiements</span>
                      <span style={{ color: progress === 100 ? '#22c55e' : 'var(--b)', fontWeight: '700' }}>{progress}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? 'linear-gradient(to right,#22c55e,#16a34a)' : 'linear-gradient(to right,#38bdf8,#818cf8)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600' }}>{agentsCount - validated - paid} Brouillon</span>
                      <span style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--b)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600' }}>{validated} Validé</span>
                      <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '600' }}>{paid} Payé</span>
                    </div>
                    <span style={{ color: 'var(--a)', fontWeight: '700', fontSize: '0.9rem' }}>
                      {total.toLocaleString()} <span style={{ fontSize: '0.72rem', fontWeight: '500' }}>XOF</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @media print { .sidebar,.nav-links,.top-bar button{display:none!important} }
      `}</style>
    </div>
  );
}
